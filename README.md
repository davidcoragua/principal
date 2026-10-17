# Sistema de Vinos – Castillo de Chancay

Sistema web simple para gestionar vinos: inventario, ventas y panel de resumen.

## Cómo usarlo
Abre `index.html` en el navegador (doble clic) o sirve la carpeta:

```
python3 -m http.server 8000
```

y entra a http://localhost:8000

## Acceso
| Usuario | Contraseña   |
|---------|--------------|
| admin   | chancay2026  |

Para cambiar o agregar usuarios edita la lista `USUARIOS` al inicio de `js/app.js`.

## Funciones
- Login con usuario y contraseña
- Panel: total de vinos, botellas, valor del inventario, ventas del día y alertas de stock bajo
- Vinos: crear, editar, eliminar y buscar
- Ventas: registrar (descuenta stock) y anular (devuelve stock)

Los datos se guardan en el navegador (localStorage).

## Logo
`img/logo.svg` es un logo del castillo. Para usar el logo oficial, reemplaza ese archivo
(o cambia las rutas `img/logo.svg` en `index.html` por tu imagen, p. ej. `img/logo.png`).
