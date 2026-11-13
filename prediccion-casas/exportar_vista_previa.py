"""Genera vista_previa.html: la misma interfaz, sin servidor, con el modelo ya entrenado.

Sirve para compartir un enlace o abrirla en el celular. Los coeficientes los calcula
Scikit-learn aquí en Python y se guardan dentro de la página.

    python exportar_vista_previa.py [archivo_salida]
"""
import sys

from flask import render_template

from app import ZONAS, app

salida = sys.argv[1] if len(sys.argv) > 1 else "vista_previa.html"
with app.test_request_context():
    modelo = app.test_client().get("/api/modelo").get_json()
    html = render_template(
        "index.html", zonas=ZONAS, preview=True, modelo=modelo,
        chart_src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
    )
with open(salida, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Vista previa guardada en {salida}")
