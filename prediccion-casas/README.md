# 🏠 Tasador IA de Viviendas (Python + Scikit-learn)

**Tema 2: Python y los Fundamentos de la Inteligencia Artificial**

Aplicación web que estima el precio de una casa con Machine Learning. Parte del ejercicio
original (`modelo_simple.py`: habitaciones → precio) y lo lleva a un caso más real.

![Ejecución](captura_ejecucion.png)

## Cómo ejecutarlo
```bash
cd prediccion-casas
pip install -r requirements.txt
python app.py
```
Abre http://localhost:5000 — en Windows también puedes hacer doble clic en `ejecutar.bat`.

Versión de consola original: `python modelo_simple.py`

## Qué demuestra
| Concepto | Dónde se ve en la app |
|---|---|
| **Programación tradicional** (regla fija `precio = 30000 × habitaciones`) vs **IA** (aprende de los datos con `modelo.fit`) | Tarjetas de comparación y tabla de precisión |
| Regresión lineal con **1 variable** (tu código) vs **5 variables** (habitaciones, m², baños, antigüedad, zona) | Los 3 precios del resultado |
| **Entrenamiento y prueba** (`train_test_split` 80/20) | Tabla "¿Qué tan bien acierta cada enfoque?" (error promedio y R²) |
| **Qué aprendió el modelo** (`coef_`, `intercept_`) | "Cada habitación suma $…", desglose del precio y gráfico |
| Variables de texto → números (`OneHotEncoder` para la zona) | `Pipeline` en `app.py` |
| **Aprender de datos nuevos** | Formulario "Registrar una venta real y reentrenar" |

## Resultados (datos de prueba)
| Enfoque | Error promedio | R² |
|---|---|---|
| Regla fija tradicional | ~$21 000 | 0.79 |
| IA con 1 variable | ~$15 000 | 0.91 |
| IA con 5 variables | ~$7 000 | 0.98 |

## Archivos
- `app.py` – servidor Flask + modelos de Scikit-learn
- `templates/index.html` – interfaz web
- `datos/casas.csv` – 120 ventas de ejemplo (creadas con `generar_datos.py`, que simula un mercado con ruido; el modelo no conoce esa fórmula y la descubre)
- `modelo_simple.py` – el ejercicio original de consola
- `static/chart.umd.min.js` – Chart.js incluido localmente (funciona sin internet)
