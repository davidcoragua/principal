"""Genera un dataset de ejemplo de casas (datos/casas.csv).

Se usa una fórmula "oculta" + ruido aleatorio para simular ventas reales.
El modelo NO conoce esta fórmula: debe descubrirla a partir de los datos.
"""
import csv
import random

random.seed(42)
ZONAS = ["Centro", "Norte", "Sur", "Residencial"]
PLUS_ZONA = {"Centro": 12000, "Norte": 0, "Sur": -6000, "Residencial": 25000}

filas = []
for _ in range(120):
    hab = random.randint(1, 6)
    m2 = round(random.uniform(30, 40) + hab * random.uniform(18, 28))
    banos = max(1, min(4, hab // 2 + random.choice([0, 0, 1])))
    antig = random.randint(0, 40)
    zona = random.choice(ZONAS)
    precio = (15000 + 14000 * hab + 520 * m2 + 8000 * banos
              - 900 * antig + PLUS_ZONA[zona] + random.gauss(0, 7000))
    filas.append([hab, m2, banos, antig, zona, int(round(precio, -2))])

with open("datos/casas.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["habitaciones", "metros2", "banos", "antiguedad", "zona", "precio"])
    w.writerows(filas)
print(f"{len(filas)} casas guardadas en datos/casas.csv")
