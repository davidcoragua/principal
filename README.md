# Sistema de Vinos – Castillo de Chancay

Sistema web de venta de vinos con dos tipos de acceso: **cliente** (compra) y **administrador** (ve las ventas).

## Cómo usarlo
Abre `index.html` en el navegador (doble clic) o sirve la carpeta:

```
python3 -m http.server 8000
```

y entra a http://localhost:8000

## Acceso
| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | admin | chancay2026 |
| Cliente (prueba) | cliente | cliente123 |

Los clientes también pueden crear su propia cuenta con **Crear cuenta**.

## Funciones
**Cliente**
- Tienda con catálogo y buscador
- Carrito: agregar, cambiar cantidades, quitar y confirmar compra (descuenta stock)
- Mis compras: historial de pedidos

**Administrador**
- Panel: ventas de hoy y totales, pedidos, clientes, stock, vinos más vendidos y stock bajo
- Ventas: todos los pedidos con cliente y detalle, filtro por texto y fecha, anular (devuelve stock)
- Inventario: crear, editar, eliminar y buscar vinos
- Clientes: lista con número de compras y total gastado

Los datos se guardan en el navegador (localStorage).

## Logo
`img/logo.svg` es un logo del castillo. Para usar el logo oficial, reemplaza ese archivo
(o cambia las rutas `img/logo.svg` en `index.html` por tu imagen, p. ej. `img/logo.png`).
