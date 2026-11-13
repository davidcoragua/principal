# Versión original del ejercicio (consola): 1 variable -> precio
from sklearn.linear_model import LinearRegression

habitaciones = [[1], [2], [3], [4], [5]]
precios = [52000, 78000, 115000, 138000, 170000]

modelo = LinearRegression()
modelo.fit(habitaciones, precios)          # el modelo APRENDE de los datos

prediccion = modelo.predict([[6]])
print(f"Precio estimado: ${prediccion[0]:,.0f}")
print(f"Aumento por habitación: ${modelo.coef_[0]:,.0f}")
