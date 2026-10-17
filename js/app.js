// Sistema de venta de vinos - Castillo de Chancay
// Roles: "cliente" compra vinos; "admin" ve ventas, inventario y clientes.
// Los datos se guardan en el navegador (localStorage).

const $ = (s) => document.querySelector(s);
const soles = (n) => 'S/ ' + Number(n).toFixed(2);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Datos ----------
const db = {
  leer(clave, defecto) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  }
};

let usuarios = db.leer('usuarios', [
  { usuario: 'admin', clave: 'chancay2026', nombre: 'Administrador', rol: 'admin', creado: new Date().toISOString() },
  { usuario: 'cliente', clave: 'cliente123', nombre: 'Cliente de prueba', rol: 'cliente', creado: new Date().toISOString() }
]);

let vinos = db.leer('vinos', [
  { id: 1, nombre: 'Castillo Reserva', tipo: 'Tinto', cepa: 'Malbec', anio: 2021, precio: 45, stock: 24 },
  { id: 2, nombre: 'Chancay Borgoña', tipo: 'Borgoña', cepa: 'Isabel', anio: 2023, precio: 25, stock: 40 },
  { id: 3, nombre: 'Torre Blanca', tipo: 'Blanco', cepa: 'Sauvignon Blanc', anio: 2022, precio: 38, stock: 4 },
  { id: 4, nombre: 'Rosado del Valle', tipo: 'Rosado', cepa: 'Syrah', anio: 2023, precio: 32, stock: 12 },
  { id: 5, nombre: 'Muralla Dulce', tipo: 'Dulce', cepa: 'Moscatel', anio: 2022, precio: 28, stock: 18 },
  { id: 6, nombre: 'Brindis del Castillo', tipo: 'Espumante', cepa: 'Chardonnay', anio: 2023, precio: 55, stock: 10 }
]);

// Ventas: { id, fecha, usuario, cliente, items: [{ vinoId, nombre, precio, cantidad }], total }
// Convierte ventas de la versión anterior (un solo vino por venta).
let ventas = db.leer('ventas', []).map(v => v.items ? v : {
  id: v.id, fecha: v.fecha, usuario: '', cliente: v.cliente || 'Mostrador', total: v.total,
  items: [{ vinoId: v.vinoId, nombre: v.vino, precio: v.total / v.cantidad, cantidad: v.cantidad }]
});

let carrito = []; // [{ vinoId, cantidad }]
let actual = null; // usuario en sesión

const guardarTodo = () => { db.guardar('usuarios', usuarios); db.guardar('vinos', vinos); db.guardar('ventas', ventas); };

// ---------- Login y registro ----------
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('activo', x === b));
  $('#formLogin').classList.toggle('oculto', b.dataset.tab !== 'ingresar');
  $('#formRegistro').classList.toggle('oculto', b.dataset.tab !== 'registro');
}));

$('#formLogin').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = usuarios.find(x => x.usuario === $('#usuario').value.trim().toLowerCase() && x.clave === $('#clave').value);
  if (!u) { $('#errorLogin').textContent = 'Usuario o contraseña incorrectos'; return; }
  $('#errorLogin').textContent = '';
  iniciarSesion(u);
});

$('#formRegistro').addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = $('#regUsuario').value.trim().toLowerCase();
  if (usuarios.some(x => x.usuario === usuario)) { $('#errorRegistro').textContent = 'Ese usuario ya existe'; return; }
  const u = { usuario, clave: $('#regClave').value, nombre: $('#regNombre').value.trim(), rol: 'cliente', creado: new Date().toISOString() };
  usuarios.push(u);
  guardarTodo();
  $('#formRegistro').reset();
  $('#errorRegistro').textContent = '';
  iniciarSesion(u);
});

const MENUS = {
  cliente: [['tienda', 'Tienda'], ['carrito', 'Carrito'], ['miscompras', 'Mis compras']],
  admin: [['panel', 'Panel'], ['ventas', 'Ventas'], ['vinos', 'Inventario'], ['clientes', 'Clientes']]
};

function iniciarSesion(u) {
  actual = u;
  carrito = [];
  try { sessionStorage.setItem('sesion', u.usuario); } catch {}
  $('#login').classList.add('oculto');
  $('#app').classList.remove('oculto');
  $('#nombreUsuario').textContent = u.nombre;
  $('#rolUsuario').textContent = u.rol === 'admin' ? 'Administrador' : 'Cliente';
  $('#nav').innerHTML = MENUS[u.rol].map(([id, txt]) =>
    `<button data-vista="${id}">${txt}${id === 'carrito' ? ' <span id="contCarrito" class="badge">0</span>' : ''}</button>`).join('');
  document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => irA(b.dataset.vista)));
  irA(MENUS[u.rol][0][0]);
}

$('#salir').addEventListener('click', () => {
  try { sessionStorage.removeItem('sesion'); } catch {}
  actual = null;
  $('#app').classList.add('oculto');
  $('#login').classList.remove('oculto');
  $('#clave').value = '';
  document.querySelector('.tabs [data-tab=ingresar]').click();
});

function irA(vista) {
  document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('activo', x.dataset.vista === vista));
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  $('#vista-' + vista).classList.remove('oculto');
  render();
}

// ---------- Render ----------
function render() {
  if (!actual) return;
  if (actual.rol === 'admin') renderAdmin(); else renderCliente();
}

const detalle = (venta) => venta.items.map(i => `${i.cantidad} × ${esc(i.nombre)}`).join('<br>');

function renderCliente() {
  // Catálogo
  const q = $('#buscarTienda').value.toLowerCase();
  $('#catalogo').innerHTML = vinos
    .filter(v => [v.nombre, v.tipo, v.cepa].join(' ').toLowerCase().includes(q))
    .map(v => `
      <div class="card producto">
        <div class="botella tipo-${esc(v.tipo).toLowerCase().replace('ñ', 'n')}">🍷</div>
        <h3>${esc(v.nombre)}</h3>
        <p class="muted">${esc(v.tipo)} · ${esc(v.cepa)} ${v.anio ? '· ' + esc(v.anio) : ''}</p>
        <p class="precio">${soles(v.precio)}</p>
        <p class="muted">${v.stock ? `${v.stock} disponibles` : '<span class="bajo">Agotado</span>'}</p>
        <button class="btn" onclick="agregarCarrito(${v.id})" ${v.stock ? '' : 'disabled'}>Agregar al carrito</button>
      </div>`).join('') || '<p>No se encontraron vinos.</p>';

  // Carrito
  const lineas = carrito.map(c => ({ ...c, vino: vinos.find(v => v.id === c.vinoId) })).filter(c => c.vino);
  $('#tablaCarrito').innerHTML = lineas.map(c => `
    <tr>
      <td>${esc(c.vino.nombre)}</td><td>${soles(c.vino.precio)}</td>
      <td><input type="number" min="1" max="${c.vino.stock}" value="${c.cantidad}" class="cant"
            onchange="cambiarCantidad(${c.vinoId}, this.value)"></td>
      <td>${soles(c.vino.precio * c.cantidad)}</td>
      <td><button class="btn-sec" onclick="quitarCarrito(${c.vinoId})">Quitar</button></td>
    </tr>`).join('') || '<tr><td colspan="5">Tu carrito está vacío</td></tr>';
  $('#totalCarrito').textContent = soles(lineas.reduce((a, c) => a + c.vino.precio * c.cantidad, 0));
  $('#comprar').disabled = !lineas.length;
  const cont = $('#contCarrito');
  if (cont) cont.textContent = carrito.reduce((a, c) => a + c.cantidad, 0);

  // Mis compras
  const mias = ventas.filter(v => v.usuario === actual.usuario).reverse();
  $('#listaMisCompras').innerHTML = mias.map(v => `
    <div class="card pedido">
      <div><b>Pedido N° ${v.id}</b> <span class="muted">${new Date(v.fecha).toLocaleString('es-PE')}</span></div>
      <div>${detalle(v)}</div>
      <div class="precio">${soles(v.total)}</div>
    </div>`).join('') || '<p class="muted">Aún no tienes compras.</p>';
}

function renderAdmin() {
  const hoy = new Date().toLocaleDateString('es-PE');
  const suma = (lista) => lista.reduce((a, v) => a + v.total, 0);
  $('#sHoy').textContent = soles(suma(ventas.filter(v => new Date(v.fecha).toLocaleDateString('es-PE') === hoy)));
  $('#sTotal').textContent = soles(suma(ventas));
  $('#sPedidos').textContent = ventas.length;
  $('#sClientes').textContent = usuarios.filter(u => u.rol === 'cliente').length;
  $('#sStock').textContent = vinos.reduce((a, v) => a + Number(v.stock), 0);
  $('#sValor').textContent = soles(vinos.reduce((a, v) => a + v.precio * v.stock, 0));

  const vendidos = {};
  ventas.forEach(v => v.items.forEach(i => { vendidos[i.nombre] = (vendidos[i.nombre] || 0) + i.cantidad; }));
  const top = Object.entries(vendidos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('#topVinos').innerHTML = top.map(([n, c]) => `<li>${esc(n)} — <b>${c}</b> botellas</li>`).join('') || '<li>Sin ventas todavía</li>';
  const bajos = vinos.filter(v => v.stock <= 5);
  $('#stockBajo').innerHTML = bajos.map(v => `<li>${esc(v.nombre)} — <span class="bajo">${v.stock}</span> botellas</li>`).join('') || '<li>Todo en orden 🍷</li>';

  // Ventas
  const fq = $('#filtroVentas').value.toLowerCase();
  const fd = $('#fechaVentas').value; // yyyy-mm-dd
  const lista = ventas.filter(v => {
    const texto = (v.cliente + ' ' + v.items.map(i => i.nombre).join(' ')).toLowerCase();
    const f = new Date(v.fecha);
    const local = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    return texto.includes(fq) && (!fd || local === fd);
  }).reverse();
  $('#tablaVentas').innerHTML = lista.map(v => `
    <tr>
      <td>${v.id}</td><td>${new Date(v.fecha).toLocaleString('es-PE')}</td><td>${esc(v.cliente)}</td>
      <td>${detalle(v)}</td><td>${soles(v.total)}</td>
      <td><button class="btn-sec" onclick="anularVenta(${v.id})">Anular</button></td>
    </tr>`).join('') || '<tr><td colspan="6">Sin ventas</td></tr>';
  $('#totalVentas').textContent = soles(suma(lista));

  // Inventario
  const q = $('#buscar').value.toLowerCase();
  $('#tablaVinos').innerHTML = vinos.filter(v => [v.nombre, v.tipo, v.cepa].join(' ').toLowerCase().includes(q)).map(v => `
    <tr>
      <td>${esc(v.nombre)}</td><td>${esc(v.tipo)}</td><td>${esc(v.cepa)}</td><td>${esc(v.anio)}</td>
      <td>${soles(v.precio)}</td><td class="${v.stock <= 5 ? 'bajo' : ''}">${v.stock}</td>
      <td><button class="btn-sec" onclick="editarVino(${v.id})">Editar</button>
          <button class="btn-sec" onclick="eliminarVino(${v.id})">Eliminar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">No hay vinos</td></tr>';

  // Clientes
  $('#tablaClientes').innerHTML = usuarios.filter(u => u.rol === 'cliente').map(u => {
    const suyas = ventas.filter(v => v.usuario === u.usuario);
    return `<tr><td>${esc(u.nombre)}</td><td>${esc(u.usuario)}</td>
      <td>${new Date(u.creado).toLocaleDateString('es-PE')}</td><td>${suyas.length}</td><td>${soles(suma(suyas))}</td></tr>`;
  }).join('') || '<tr><td colspan="5">Sin clientes</td></tr>';
}

['#buscarTienda', '#buscar', '#filtroVentas', '#fechaVentas'].forEach(s => $(s).addEventListener('input', render));

// ---------- Carrito (cliente) ----------
window.agregarCarrito = (id) => {
  const vino = vinos.find(v => v.id === id);
  const linea = carrito.find(c => c.vinoId === id);
  if (linea) linea.cantidad = Math.min(linea.cantidad + 1, vino.stock);
  else carrito.push({ vinoId: id, cantidad: 1 });
  render();
};

window.cambiarCantidad = (id, valor) => {
  const vino = vinos.find(v => v.id === id);
  const linea = carrito.find(c => c.vinoId === id);
  linea.cantidad = Math.max(1, Math.min(Number(valor) || 1, vino.stock));
  render();
};

window.quitarCarrito = (id) => { carrito = carrito.filter(c => c.vinoId !== id); render(); };

$('#comprar').addEventListener('click', () => {
  const items = [];
  for (const c of carrito) {
    const vino = vinos.find(v => v.id === c.vinoId);
    if (!vino || c.cantidad > vino.stock) {
      $('#msgCarrito').textContent = `Stock insuficiente de ${vino ? vino.nombre : 'un vino'}`;
      return;
    }
    items.push({ vinoId: vino.id, nombre: vino.nombre, precio: vino.precio, cantidad: c.cantidad });
  }
  if (!items.length) return;
  items.forEach(i => { vinos.find(v => v.id === i.vinoId).stock -= i.cantidad; });
  const id = ventas.reduce((m, v) => Math.max(m, v.id), 1000) + 1;
  ventas.push({ id, fecha: new Date().toISOString(), usuario: actual.usuario, cliente: actual.nombre,
    items, total: items.reduce((a, i) => a + i.precio * i.cantidad, 0) });
  carrito = [];
  $('#msgCarrito').textContent = '';
  guardarTodo();
  alert(`¡Gracias por tu compra! Pedido N° ${id}`);
  irA('miscompras');
});

// ---------- Inventario (admin) ----------
const modal = $('#modalVino');
const form = $('#formVino');
let editandoId = null;

$('#nuevoVino').addEventListener('click', () => {
  editandoId = null;
  form.reset();
  $('#tituloModal').textContent = 'Nuevo vino';
  modal.showModal();
});

window.editarVino = (id) => {
  const v = vinos.find(x => x.id === id);
  editandoId = id;
  for (const k of ['nombre', 'tipo', 'cepa', 'anio', 'precio', 'stock']) form.elements[k].value = v[k] ?? '';
  $('#tituloModal').textContent = 'Editar vino';
  modal.showModal();
};

window.eliminarVino = (id) => {
  if (!confirm('¿Eliminar este vino?')) return;
  vinos = vinos.filter(v => v.id !== id);
  guardarTodo(); render();
};

$('#cancelarVino').addEventListener('click', () => modal.close());

form.addEventListener('submit', () => {
  const f = form.elements;
  const datos = {
    nombre: f.nombre.value.trim(), tipo: f.tipo.value, cepa: f.cepa.value.trim(),
    anio: f.anio.value ? Number(f.anio.value) : '', precio: Number(f.precio.value), stock: Number(f.stock.value)
  };
  if (editandoId) Object.assign(vinos.find(v => v.id === editandoId), datos);
  else vinos.push({ id: Date.now(), ...datos });
  guardarTodo(); render();
});

window.anularVenta = (id) => {
  if (!confirm('¿Anular esta venta? El stock se devolverá.')) return;
  const venta = ventas.find(v => v.id === id);
  venta.items.forEach(i => { const vino = vinos.find(v => v.id === i.vinoId); if (vino) vino.stock += i.cantidad; });
  ventas = ventas.filter(v => v.id !== id);
  guardarTodo(); render();
};

// ---------- Inicio ----------
let sesion = null;
try { sesion = sessionStorage.getItem('sesion'); } catch {}
const u = usuarios.find(x => x.usuario === sesion);
if (u) iniciarSesion(u);
