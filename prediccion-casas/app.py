"""
Tasador IA de Viviendas
-----------------------
Aplicación web (Flask) que usa Scikit-learn para estimar el precio de una casa.

Idea clave del tema:
  * Programación tradicional -> el programador escribe la regla (precio = 30 000 x habitaciones).
  * Inteligencia Artificial   -> el modelo APRENDE la regla a partir de datos (ventas pasadas).

Ejecutar:
    pip install -r requirements.txt
    python app.py
    -> abrir http://localhost:5000
"""
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, render_template, request, url_for
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE = Path(__file__).parent
CSV = BASE / "datos" / "casas.csv"

NUMERICAS = ["habitaciones", "metros2", "banos", "antiguedad"]
ZONAS = ["Norte", "Centro", "Sur", "Residencial"]  # "Norte" es la zona base
PRECIO_POR_HAB_REGLA = 30000  # regla fija "tradicional" escrita a mano

app = Flask(__name__)
app.json.sort_keys = False  # mantener el orden del desglose
estado = {}  # aquí se guardan los modelos entrenados y sus métricas


def crear_modelo():
    """Pipeline: convierte la zona (texto) en números y aplica regresión lineal."""
    preprocesar = ColumnTransformer(
        [("zona", OneHotEncoder(categories=[ZONAS], drop="first"), ["zona"])],
        remainder="passthrough",
    )
    return Pipeline([("prep", preprocesar), ("reg", LinearRegression())])


def entrenar():
    """Lee el CSV, evalúa los modelos con datos de prueba y los reentrena con todo."""
    df = pd.read_csv(CSV)
    X, y = df[NUMERICAS + ["zona"]], df["precio"]

    # 1) Evaluación honesta: 80 % para aprender, 20 % para comprobar
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    completo = crear_modelo().fit(X_tr, y_tr)
    pred = completo.predict(X_te)

    simple = LinearRegression().fit(X_tr[["habitaciones"]], y_tr)
    pred_s = simple.predict(X_te[["habitaciones"]])
    pred_r = X_te["habitaciones"] * PRECIO_POR_HAB_REGLA

    metricas = {
        "completo": {"r2": r2_score(y_te, pred), "mae": mean_absolute_error(y_te, pred)},
        "simple": {"r2": r2_score(y_te, pred_s), "mae": mean_absolute_error(y_te, pred_s)},
        "regla": {"r2": r2_score(y_te, pred_r), "mae": mean_absolute_error(y_te, pred_r)},
    }

    # 2) Modelos finales entrenados con TODOS los datos
    completo = crear_modelo().fit(X, y)
    simple = LinearRegression().fit(X[["habitaciones"]], y)

    reg = completo.named_steps["reg"]
    nombres = [f"zona_{z}" for z in ZONAS[1:]] + NUMERICAS
    coef = dict(zip(nombres, reg.coef_))

    estado.update(df=df, completo=completo, simple=simple, metricas=metricas,
                  coef=coef, intercepto=reg.intercept_, n_test=len(y_te))


def leer_casa(datos):
    casa = {
        "habitaciones": int(datos["habitaciones"]),
        "metros2": float(datos["metros2"]),
        "banos": int(datos["banos"]),
        "antiguedad": int(datos["antiguedad"]),
        "zona": str(datos["zona"]),
    }
    if casa["zona"] not in ZONAS:
        raise ValueError("Zona no válida")
    if not (1 <= casa["habitaciones"] <= 10 and 15 <= casa["metros2"] <= 1000
            and 1 <= casa["banos"] <= 6 and 0 <= casa["antiguedad"] <= 100):
        raise ValueError("Valores fuera de rango")
    return casa


@app.route("/")
def inicio():
    return render_template("index.html", zonas=ZONAS, preview=False, modelo=None,
                           chart_src=url_for("static", filename="chart.umd.min.js"))


@app.get("/api/modelo")
def info_modelo():
    df, simple = estado["df"], estado["simple"]
    return jsonify({
        "n_casas": len(df),
        "n_test": estado["n_test"],
        "metricas": estado["metricas"],
        "coef": estado["coef"],
        "intercepto": estado["intercepto"],
        "simple": {"pendiente": simple.coef_[0], "intercepto": simple.intercept_},
        "regla": PRECIO_POR_HAB_REGLA,
        "puntos": df[["habitaciones", "metros2", "precio", "zona"]].to_dict("records"),
        "ultimas": df.tail(8).iloc[::-1].to_dict("records"),
    })


@app.post("/api/predecir")
def predecir():
    try:
        casa = leer_casa(request.get_json())
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

    X = pd.DataFrame([casa])
    precio = float(estado["completo"].predict(X)[0])
    precio_simple = float(estado["simple"].predict(X[["habitaciones"]])[0])
    mae = estado["metricas"]["completo"]["mae"]

    # Cuánto aporta cada característica al precio (coeficiente x valor)
    c = estado["coef"]
    desglose = {
        "Base del modelo": estado["intercepto"],
        "Habitaciones": c["habitaciones"] * casa["habitaciones"],
        "Metros²": c["metros2"] * casa["metros2"],
        "Baños": c["banos"] * casa["banos"],
        "Antigüedad": c["antiguedad"] * casa["antiguedad"],
        f"Zona {casa['zona']}": c.get(f"zona_{casa['zona']}", 0.0),
    }
    return jsonify({
        "precio": precio,
        "rango": [precio - mae, precio + mae],
        "precio_simple": precio_simple,
        "precio_regla": casa["habitaciones"] * PRECIO_POR_HAB_REGLA,
        "desglose": desglose,
    })


@app.post("/api/agregar")
def agregar_venta():
    """Registra una venta real nueva y reentrena: el modelo aprende de más datos."""
    try:
        datos = request.get_json()
        casa = leer_casa(datos)
        casa["precio"] = int(float(datos["precio"]))
        if not 5000 <= casa["precio"] <= 5_000_000:
            raise ValueError("Precio fuera de rango")
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

    pd.DataFrame([casa]).to_csv(CSV, mode="a", header=False, index=False)
    entrenar()
    return jsonify({"ok": True, "n_casas": len(estado["df"])})


entrenar()

if __name__ == "__main__":
    print(f"Modelo entrenado con {len(estado['df'])} casas")
    print(f"R² en datos de prueba: {estado['metricas']['completo']['r2']:.3f}")
    app.run(debug=True, port=5000)
