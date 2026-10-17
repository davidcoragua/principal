// Sistema de Vinos - Castillo de Chancay
// Los datos se guardan en el navegador (localStorage).

const USUARIOS = [
  { usuario: 'admin', clave: 'chancay2026', nombre: 'Administrador' }
];

const $ = (s) => document.querySelector(s);
const soles = (n) => 'S/ ' + Number(n).toFixed(2);

// ---------- Datos ----------
const db = {
  leer(clave, defecto) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  }
};

let vinos = db.leer('vinos', [
  { id: 1, nombre: 'Castillo Reserva', tipo: 'Tinto', cepa: 'Malbec', anio: 2021, precio: 45, stock: 24 },
  { id: 2, nombre: 'Chancay Borgoña', tipo: 'Borgoña', cepa: 'Isabel', anio: 2023, precio: 25, stock: 40 },
  { id: 3, nombre: 'Torre Blanca', tipo: 'Blanco', cepa: 'Sauvignon Blanc', anio: 2022, precio: 38, stock: 4 },
  { id: 4, nombre: 'Rosado del Valle', tipo: 'Rosado', cepa: 'Syrah', anio: 2023, precio: 32, stock: 12 }
]);
let ventas = db.leer('ventas', []);

const guardarTodo = () => { db.guardar('vinos', vinos); db.guardar('ventas', ventas); };

// ---------- Login ----------
function mostrarApp(nombre) {
  $('#login').classList.add('oculto');
  $('#app').classList.remove('oculto');
  $('#nombreUsuario').textContent = nombre;
  render();
}

$('#formLogin').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = USUARIOS.find(x => x.usuario === $('#usuario').value.trim() && x.clave === $('#clave').value);
  if (!u) { $('#errorLogin').textContent = 'Usuario o contraseña incorrectos'; return; }
  $('#errorLogin').textContent = '';
  try { sessionStorage.setItem('sesion', u.nombre); } catch {}
  mostrarApp(u.nombre);
});

$('#salir').addEventListener('click', () => {
  try { sessionStorage.removeItem('sesion'); } catch {}
  $('#app').classList.add('oculto');
  $('#login').classList.remove('oculto');
  $('#clave').value = '';
});

// ---------- Navegación ----------
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('activo', x === b));
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  $('#vista-' + b.dataset.vista).classList.remove('oculto');
  render();
}));

// ---------- Render ----------
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render() {
  // Panel
  const hoy = new Date().toISOString().slice(0, 10);
  $('#sVinos').textContent = vinos.length;
  $('#sStock').textContent = vinos.reduce((a, v) => a + Number(v.stock), 0);
  $('#sValor').textContent = soles(vinos.reduce((a, v) => a + v.precio * v.stock, 0));
  $('#sHoy').textContent = soles(ventas.filter(v => v.fecha.startsWith(hoy)).reduce((a, v) => a + v.total, 0));
  const bajos = vinos.filter(v => v.stock <= 5);
  $('#stockBajo').innerHTML = bajos.length
    ? bajos.map(v => `<li>${esc(v.nombre)} — <span class="bajo">${v.stock}</span> botellas</li>`).join('')
    : '<li>Todo en orden 🍷</li>';

  // Vinos
  const q = $('#buscar').value.toLowerCase();
  const lista = vinos.filter(v => [v.nombre, v.tipo, v.cepa].join(' ').toLowerCase().includes(q));
  $('#tablaVinos').innerHTML = lista.map(v => `
    <tr>
      <td>${esc(v.nombre)}</td><td>${esc(v.tipo)}</td><td>${esc(v.cepa)}</td><td>${esc(v.anio)}</td>
      <td>${soles(v.precio)}</td><td class="${v.stock <= 5 ? 'bajo' : ''}">${v.stock}</td>
      <td><button class="btn-sec" onclick="editarVino(${v.id})">Editar</button>
          <button class="btn-sec" onclick="eliminarVino(${v.id})">Eliminar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">No hay vinos</td></tr>';

  // Ventas
  $('#ventaVino').innerHTML = vinos.map(v =>
    `<option value="${v.id}" ${v.stock ? '' : 'disabled'}>${esc(v.nombre)} (${soles(v.precio)} · stock ${v.stock})</option>`).join('');
  $('#tablaVentas').innerHTML = ventas.slice().reverse().map(v => `
    <tr>
      <td>${new Date(v.fecha).toLocaleString('es-PE')}</td><td>${esc(v.vino)}</td><td>${v.cantidad}</td>
      <td>${esc(v.cliente) || '—'}</td><td>${soles(v.total)}</td>
      <td><button class="btn-sec" onclick="anularVenta(${v.id})">Anular</button></td>
    </tr>`).join('') || '<tr><td colspan="6">Sin ventas registradas</td></tr>';
}

$('#buscar').addEventListener('input', render);

// ---------- CRUD Vinos ----------
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

// ---------- Ventas ----------
$('#formVenta').addEventListener('submit', (e) => {
  e.preventDefault();
  const vino = vinos.find(v => v.id === Number($('#ventaVino').value));
  const cant = Number($('#ventaCant').value);
  if (!vino) { $('#errorVenta').textContent = 'Seleccione un vino'; return; }
  if (cant < 1 || cant > vino.stock) { $('#errorVenta').textContent = `Stock insuficiente (disponible: ${vino.stock})`; return; }
  $('#errorVenta').textContent = '';
  vino.stock -= cant;
  ventas.push({ id: Date.now(), fecha: new Date().toISOString(), vinoId: vino.id, vino: vino.nombre,
    cantidad: cant, cliente: $('#ventaCliente').value.trim(), total: cant * vino.precio });
  $('#ventaCant').value = 1; $('#ventaCliente').value = '';
  guardarTodo(); render();
});

window.anularVenta = (id) => {
  if (!confirm('¿Anular esta venta? El stock se devolverá.')) return;
  const venta = ventas.find(v => v.id === id);
  const vino = vinos.find(v => v.id === venta.vinoId);
  if (vino) vino.stock += venta.cantidad;
  ventas = ventas.filter(v => v.id !== id);
  guardarTodo(); render();
};

// ---------- Inicio ----------
let sesion = null;
try { sesion = sessionStorage.getItem('sesion'); } catch {}
if (sesion) mostrarApp(sesion);
