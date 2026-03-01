// =====================================================
// CBIT Manager — main.js  (conectado a DB via API PHP)
// =====================================================
const API = 'backend/api.php';

// ─── SESSION GUARD ──────────────────────────────────
(function checkSession() {
    const session = sessionStorage.getItem('cbit_session');
    if (!session) {
        window.location.href = 'login.html';
    }
})();

function getSession() {
    try { return JSON.parse(sessionStorage.getItem('cbit_session')); } catch { return null; }
}

// ─── HELPERS ────────────────────────────────────────
async function apiFetch(action, method = 'GET', body = null) {
    const url = method === 'GET' && body
        ? `${API}?action=${action}&` + new URLSearchParams(body).toString()
        : `${API}?action=${action}`;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 3500);
}

function badge(estado) {
    const map = {
        'Operativo': 'success', 'Activo': 'success', 'Finalizada': 'success',
        'En Reparación': 'warning', 'Inactivo': 'warning', 'Activa': 'warning',
        'Dañado': 'danger', 'Baja': 'danger'
    };
    return `<span class="status-badge ${map[estado] || 'warning'}">${estado}</span>`;
}

function limpiarFormulario(id) {
    const f = document.getElementById(id);
    if (f) f.reset();
}

function formatDT(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return s; }
}

// ─── MODALES ────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active'); });

// ─── NAVEGACIÓN SPA ─────────────────────────────────
function switchViewPub(targetId) {
    document.querySelectorAll('.nav-item[data-target], .nav-subitem[data-target]').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

    const nav = document.querySelector(`[data-target="${targetId}"]`);
    if (nav) {
        nav.classList.add('active');
        if (nav.classList.contains('nav-subitem')) {
            const g = nav.closest('.nav-group');
            if (g) { g.classList.add('open'); g.querySelector('.nav-submenu')?.classList.add('open'); }
        }
    }
    const sec = document.getElementById(targetId);
    if (sec) sec.classList.add('active');
    window.location.hash = targetId;

    const loaders = {
        'dashboard': () => { cargarStats(); },
        'registro-ingreso': () => { cargarIngresos(); },
        'estado-equipos': () => { cargarEquipos(); },
        'agregar-equipo': () => { document.getElementById('eq-codigo')?.focus(); },
        'reserva-equipos': () => { cargarReservas(); poblarSelectEquipos(); },
        'calendario-reservas': () => { renderCalendario(); },
        'soporte-tecnico': () => { cargarSoporte(); poblarSelectSoporte(); },
        'usuarios': () => { cargarUsuarios(); poblarSelectRoles(); },
        'reportes': () => { cargarStats(true); },
    };
    loaders[targetId]?.();
}

// ─── DASHBOARD ──────────────────────────────────────
async function cargarStats(esReportes = false) {
    try {
        const d = await apiFetch('stats');
        setText('stat-ingresos', d.ing);
        setText('stat-reparacion', d.rep);
        setText('stat-reservas', d.res);
        if (esReportes) {
            const equipos = await apiFetch('equipos');
            const soporte = await apiFetch('soporte');
            const ingresos = await apiFetch('ingresos');
            setText('rep-ingresos', ingresos.length);
            setText('rep-equipos', equipos.length);
            setText('rep-soporte', soporte.length);
        }
        // Feed de actividades
        const feed = document.getElementById('recent-activity-list');
        if (feed) {
            if (!d.acts?.length) {
                feed.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>Sin actividades recientes.</p></div>';
            } else {
                feed.innerHTML = d.acts.map(a => `
                    <div class="activity-item">
                        <div class="activity-dot"></div>
                        <div><p>${a.mensaje}</p><small>${a.tiempo}</small></div>
                    </div>`).join('');
            }
        }
    } catch (e) { showToast('Error cargando estadísticas: ' + e.message, 'error'); }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ─── INGRESOS ───────────────────────────────────────
async function guardarIngreso() {
    const tipo = document.getElementById('ing-tipo').value;
    const cedula = document.getElementById('ing-cedula').value.trim();
    const nombre = document.getElementById('ing-nombre').value.trim();
    const motivo = document.getElementById('ing-motivo').value.trim();
    if (!cedula || !nombre) { showToast('Cédula y nombre son requeridos.', 'error'); return; }
    try {
        await apiFetch('ingreso', 'POST', { tipo, cedula, nombre, motivo });
        limpiarFormulario('form-ingreso');
        await cargarIngresos();
        await cargarStats();
        showToast('✅ Ingreso registrado.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function cargarIngresos() {
    try {
        const datos = await apiFetch('ingresos');
        const tbody = document.getElementById('tabla-ingresos');
        const empty = document.getElementById('ing-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
        empty.style.display = 'none';
        tbody.innerHTML = datos.map(r => `<tr>
            <td>${r.id}</td>
            <td>${r.tipo}</td>
            <td><strong>${r.cedula}</strong></td>
            <td>${r.nombre}</td>
            <td>${r.motivo || '—'}</td>
            <td>${r.hora}</td>
            <td><button class="btn-icon-small" title="Eliminar" style="background:rgba(239,68,68,0.1);color:var(--danger)" onclick="eliminarRegistro('ingreso',${r.id}, cargarIngresos)"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('');
    } catch (e) { showToast('Error cargando ingresos: ' + e.message, 'error'); }
}

// ─── EQUIPOS ────────────────────────────────────────
async function guardarEquipo() {
    const codigo = document.getElementById('eq-codigo').value.trim();
    const modelo = document.getElementById('eq-modelo').value.trim();
    const marca = document.getElementById('eq-marca').value.trim();
    const estado = document.getElementById('eq-estado').value;
    if (!codigo || !modelo) { showToast('Código y modelo son requeridos.', 'error'); return; }
    try {
        await apiFetch('equipo', 'POST', { codigo, modelo, marca, estado });
        limpiarFormulario('form-equipo');
        await cargarEquipos();
        await poblarSelectEquipos();
        await poblarSelectSoporte();
        switchViewPub('estado-equipos');
        showToast('✅ Equipo registrado.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function editarEquipo(id, codigo, modelo, marca, estado) {
    document.getElementById('edit-eq-idx').value = id;
    document.getElementById('edit-eq-codigo').value = codigo;
    document.getElementById('edit-eq-modelo').value = modelo;
    document.getElementById('edit-eq-marca').value = marca;
    document.getElementById('edit-eq-estado').value = estado;
    openModal('modal-editar-equipo');
}

async function actualizarEquipo() {
    const id = document.getElementById('edit-eq-idx').value;
    const codigo = document.getElementById('edit-eq-codigo').value.trim();
    const modelo = document.getElementById('edit-eq-modelo').value.trim();
    const marca = document.getElementById('edit-eq-marca').value.trim();
    const estado = document.getElementById('edit-eq-estado').value;
    try {
        await apiFetch('equipo', 'PUT', { id, codigo, modelo, marca, estado });
        closeModal('modal-editar-equipo');
        await cargarEquipos();
        await poblarSelectEquipos();
        await poblarSelectSoporte();
        showToast('✅ Equipo actualizado.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function verHistorial(codigo) {
    try {
        const datos = await apiFetch('historial', 'GET', { codigo });
        document.getElementById('hist-equipo-nombre').textContent = codigo;
        const tbody = document.getElementById('tabla-historial-modal');
        const empty = document.getElementById('hist-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; }
        else {
            empty.style.display = 'none';
            tbody.innerHTML = datos.map(r => `<tr>
                <td>${r.fecha}</td><td>${r.nombre}</td><td>${r.empresa || '—'}</td>
                <td>${r.tipo}</td><td>${r.descripcion || '—'}</td>
            </tr>`).join('');
        }
        openModal('modal-historial');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function filtrarEquipos() {
    const q = document.getElementById('buscar-equipo').value.trim();
    await cargarEquipos(q);
}

async function cargarEquipos(q = '') {
    try {
        const datos = await apiFetch('equipos', 'GET', { q });
        const tbody = document.getElementById('tabla-equipos');
        const empty = document.getElementById('eq-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
        empty.style.display = 'none';
        tbody.innerHTML = datos.map(e => `<tr>
            <td><strong>${e.codigo}</strong></td>
            <td>${e.modelo}</td>
            <td>${e.marca || '—'}</td>
            <td>${badge(e.estado)}</td>
            <td>${e.fecha}</td>
            <td><button class="btn-text" onclick="verHistorial('${e.codigo}')"><i class="fas fa-history"></i> Ver</button></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon-small" title="Editar"
                        onclick="editarEquipo(${e.id},'${e.codigo}','${e.modelo}','${e.marca || ''}','${e.estado}')">
                        <i class="fas fa-edit"></i></button>
                    <button class="btn-icon-small warn" title="Ir a Soporte" onclick="switchViewPub('soporte-tecnico')">
                        <i class="fas fa-tools"></i></button>
                    <button class="btn-icon-small" style="background:rgba(239,68,68,0.1);color:var(--danger)" title="Eliminar"
                        onclick="eliminarRegistro('equipo',${e.id}, () => { cargarEquipos(); poblarSelectEquipos(); poblarSelectSoporte(); })">
                        <i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
    } catch (e) { showToast('Error cargando equipos: ' + e.message, 'error'); }
}

async function poblarSelectEquipos() {
    try {
        const equipos = await apiFetch('equipos', 'GET', { q: '' });
        const sel = document.getElementById('res-equipos');
        if (!sel) return;
        const operativos = equipos.filter(e => e.estado === 'Operativo');
        sel.innerHTML = operativos.length
            ? operativos.map(e => `<option value="${e.codigo}">${e.codigo} — ${e.modelo}</option>`).join('')
            : '<option disabled>No hay equipos disponibles</option>';
    } catch { }
}

async function poblarSelectSoporte() {
    try {
        const equipos = await apiFetch('equipos', 'GET', { q: '' });
        const sel = document.getElementById('sop-equipos');
        if (!sel) return;
        sel.innerHTML = equipos.length
            ? equipos.map(e => `<option value="${e.codigo}">${e.codigo} — ${e.modelo}</option>`).join('')
            : '<option disabled>Sin equipos</option>';
    } catch { }
}

// ─── RESERVAS ───────────────────────────────────────
async function guardarReserva() {
    const espacio = document.getElementById('res-espacio').value.trim();
    const s_equipos = Array.from(document.getElementById('res-equipos').selectedOptions).map(o => o.value);
    const usuario = document.getElementById('res-usuario').value.trim();
    const inicio = document.getElementById('res-inicio').value;
    const fin = document.getElementById('res-fin').value;
    const proposito = document.getElementById('res-proposito').value.trim();

    if (!espacio || !usuario || !inicio || !fin) { showToast('Completa los campos requeridos con (*).', 'error'); return; }
    if (new Date(fin) <= new Date(inicio)) { showToast('La fecha fin debe ser posterior al inicio.', 'error'); return; }

    try {
        await apiFetch('reserva', 'POST', { espacio, equipos: s_equipos, usuario, inicio, fin, proposito });
        limpiarFormulario('form-reserva');
        await cargarReservas();
        await cargarStats();
        showToast('✅ Reservación registrada.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function finalizarReserva(id) {
    try {
        await apiFetch('reserva_finalizar', 'PUT', { id });
        await cargarReservas();
        showToast('Reserva finalizada.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function cargarReservas() {
    try {
        const datos = await apiFetch('reservas');
        const tbody = document.getElementById('tabla-reservas');
        const empty = document.getElementById('res-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
        empty.style.display = 'none';
        tbody.innerHTML = datos.map(r => `<tr>
            <td>${r.id}</td>
            <td><strong>${r.espacio}</strong></td>
            <td>${r.equipos && r.equipos.length ? r.equipos.join(', ') : '—'}</td>
            <td>${r.usuario}</td>
            <td>${formatDT(r.inicio)}</td>
            <td>${formatDT(r.fin)}</td>
            <td>${r.proposito || '—'}</td>
            <td>${badge(r.estado)}</td>
            <td><div class="action-buttons">
                ${r.estado === 'Activa' ? `<button class="btn-icon-small" title="Finalizar" onclick="finalizarReserva(${r.id})"><i class="fas fa-check"></i></button>` : ''}
                <button class="btn-icon-small" style="background:rgba(239,68,68,0.1);color:var(--danger)" title="Eliminar"
                    onclick="eliminarRegistro('reserva',${r.id}, cargarReservas)"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`).join('');
    } catch (e) { showToast('Error cargando reservas: ' + e.message, 'error'); }
}

async function renderCalendario() {
    try {
        const reservas = await apiFetch('reservas');
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        // Horarios a mostrar (Ej: de 8 AM a 6 PM)
        const startHour = 8;
        const endHour = 18;
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        // Estructura de encabezado
        let html = `<div class="cal-header cal-cell">Hora</div>`;
        days.forEach(d => html += `<div class="cal-header cal-cell">${d}</div>`);

        // Determinar qué días caen en la semana actual basada en la fecha actual
        const todayUrl = new Date();
        const firstDayOfWeek = todayUrl.getDate() - todayUrl.getDay() + 1; // Ajuste para Lunes

        for (let h = startHour; h <= endHour; h++) {
            const timeStr = `${h.toString().padStart(2, '0')}:00`;
            html += `<div class="cal-time cal-cell">${timeStr}</div>`;

            for (let d = 1; d <= 6; d++) {
                // Comprobar si hay reservaciones para esta hora y día en la semana actual
                const cellDate = new Date(todayUrl.setDate(firstDayOfWeek + d - 1));
                const cellDateStr = cellDate.toISOString().split('T')[0];

                const recs = reservas.filter(r => {
                    if (r.estado !== 'Activa') return false;
                    const rInicio = new Date(r.inicio);
                    const rFin = new Date(r.fin);
                    const rDateStr = r.inicio.split('T')[0] || r.inicio.split(' ')[0];

                    if (rDateStr === cellDateStr) {
                        return (rInicio.getHours() <= h && rFin.getHours() >= h);
                    }
                    return false;
                });

                if (recs.length > 0) {
                    html += `<div class="cal-cell has-reserva">
                                ${recs.map(r => `
                                    <div class="cal-badge mb-1">
                                        <strong>${r.espacio}:</strong> ${r.usuario}
                                    </div>
                                `).join('')}
                             </div>`;
                } else {
                    html += `<div class="cal-cell"></div>`;
                }
            }
        }
        grid.innerHTML = html;
    } catch (e) {
        showToast('Error al cargar el calendario: ' + e.message, 'error');
    }
}

// ─── SOPORTE ────────────────────────────────────────
async function guardarSoporte() {
    const cedula = document.getElementById('sop-cedula').value.trim();
    const nombre = document.getElementById('sop-nombre').value.trim();
    const empresa = document.getElementById('sop-empresa').value.trim();
    const fecha = document.getElementById('today-date-soporte').value;
    const tipo = document.getElementById('sop-tipo').value;
    const descripcion = document.getElementById('sop-descripcion').value.trim();
    const selEl = document.getElementById('sop-equipos');
    const equipos = selEl ? Array.from(selEl.selectedOptions).map(o => o.value) : [];
    if (!cedula || !nombre) { showToast('Cédula y nombre del técnico son requeridos.', 'error'); return; }
    try {
        await apiFetch('soporte', 'POST', { cedula, nombre, empresa, fecha, tipo, descripcion, equipos });
        limpiarFormulario('form-soporte');
        document.getElementById('today-date-soporte').value = new Date().toISOString().split('T')[0];
        await cargarSoporte();
        await cargarEquipos();
        showToast('✅ Registro técnico guardado.');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function cargarSoporte() {
    try {
        const datos = await apiFetch('soporte');
        const tbody = document.getElementById('tabla-soporte');
        const empty = document.getElementById('sop-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
        empty.style.display = 'none';
        tbody.innerHTML = datos.map(r => `<tr>
            <td>${r.id}</td>
            <td><strong>${r.nombre}</strong><br><small>${r.cedula}</small></td>
            <td>${r.empresa || '—'}</td>
            <td>${(r.equipos?.length ? r.equipos.join(', ') : '—')}</td>
            <td>${r.tipo}</td>
            <td>${r.fecha}</td>
            <td><button class="btn-icon-small" style="background:rgba(239,68,68,0.1);color:var(--danger)" title="Eliminar"
                onclick="eliminarRegistro('soporte',${r.id}, cargarSoporte)"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('');
    } catch (e) { showToast('Error cargando soporte: ' + e.message, 'error'); }
}

// ─── USUARIOS ───────────────────────────────────────
async function guardarUsuario() {
    const cedula = document.getElementById('usr-cedula').value.trim();
    const nombre = document.getElementById('usr-nombre').value.trim();
    const usuario = document.getElementById('usr-username').value.trim();
    const email = document.getElementById('usr-email').value.trim();
    const rol_id = document.getElementById('usr-rol-id').value;
    const estado = document.getElementById('usr-estado').value;

    if (!nombre || !email || !usuario || !cedula) {
        showToast('Cédula, nombre, usuario y email son obligatorios.', 'error');
        return;
    }

    try {
        await apiFetch('usuario', 'POST', { cedula, nombre, usuario, email, rol_id, estado });
        closeModal('modal-nuevo-usuario');
        limpiarFormulario('form-usuario');
        await cargarUsuarios();
        showToast('✅ Usuario registrado. (Contraseña defecto: 12345678)');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function cargarUsuarios() {
    try {
        const datos = await apiFetch('usuarios');
        const tbody = document.getElementById('tabla-usuarios');
        const empty = document.getElementById('usr-empty');
        if (!datos.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
        empty.style.display = 'none';

        tbody.innerHTML = datos.map(u => `<tr>
            <td>${u.id}</td>
            <td>${u.cedula}</td>
            <td><strong>${u.nombre}</strong></td>
            <td>@${u.usuario}</td>
            <td>${u.email}</td>
            <td><span class="status-badge" style="background:rgba(79,70,229,0.1); color:var(--primary); text-transform:capitalize">${u.rol || 'N/A'}</span></td>
            <td>${badge(u.estado)}</td>
            <td><button class="btn-icon-small" style="background:rgba(239,68,68,0.1);color:var(--danger)" title="Eliminar"
                onclick="eliminarRegistro('usuario',${u.id}, cargarUsuarios)"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function poblarSelectRoles() {
    try {
        const roles = await apiFetch('roles');
        const sel = document.getElementById('usr-rol-id');
        if (!sel) return;
        sel.innerHTML = roles.length
            ? roles.map(r => `<option value="${r.id}" style="text-transform:capitalize">${r.nombre}</option>`).join('')
            : '<option disabled>Sin roles</option>';
    } catch { }
}

// ─── DELETE GENÉRICO ────────────────────────────────
async function eliminarRegistro(action, id, callback) {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
        await fetch(`${API}?action=${action}&id=${id}`, { method: 'DELETE' });
        showToast('Registro eliminado.', 'error');
        callback();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ─── EXPORTAR CSV ───────────────────────────────────
function exportarTabla(tablaId, nombre) {
    const table = document.getElementById(tablaId);
    if (!table || !table.rows.length) { showToast('No hay datos para exportar.', 'error'); return; }
    let csv = '';
    for (const row of table.rows) {
        csv += Array.from(row.cells).map(c => `"${c.innerText.trim().replace(/"/g, '""')}"`).join(',') + '\n';
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CBIT_${nombre}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast(`📄 ${nombre}.csv exportado.`);
}

// ─── BÚSQUEDA GLOBAL ────────────────────────────────
document.getElementById('global-search').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    if (!q) return;
    if (q.includes('ingreso') || q.includes('registro')) switchViewPub('registro-ingreso');
    else if (q.includes('equipo') || q.includes('reparaci')) switchViewPub('estado-equipos');
    else if (q.includes('reserva')) switchViewPub('reserva-equipos');
    else if (q.includes('soporte') || q.includes('tecnico')) switchViewPub('soporte-tecnico');
    else if (q.includes('usuario')) switchViewPub('usuarios');
    else if (q.includes('reporte')) switchViewPub('reportes');
});

// ─── INICIO ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Navegación
    document.querySelectorAll('.nav-item[data-target], .nav-subitem[data-target]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const t = item.getAttribute('data-target');
            if (t) switchViewPub(t);
        });
    });

    // Submenú desplegable
    document.querySelectorAll('.has-submenu').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            const g = toggle.closest('.nav-group');
            if (g) { g.classList.toggle('open'); g.querySelector('.nav-submenu')?.classList.toggle('open'); }
        });
    });

    // Mostrar datos del usuario logueado
    const sessUser = getSession();
    if (sessUser) {
        const nameEl = document.getElementById('user-name-display');
        const roleEl = document.getElementById('user-role-display');
        const avatarEl = document.getElementById('user-avatar');
        if (nameEl) nameEl.textContent = sessUser.nombre || 'Usuario';
        if (roleEl) roleEl.textContent = sessUser.email || sessUser.rol || '';
        if (avatarEl) {
            const initials = (sessUser.nombre || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            avatarEl.childNodes[0].textContent = initials;
        }
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', e => {
        e.preventDefault();
        if (confirm('¿Cerrar sesión?')) {
            sessionStorage.removeItem('cbit_session');
            window.location.href = 'login.html';
        }
    });

    // Tema
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeBtn.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('cbit-theme', isDark ? 'dark' : 'light');
    });
    if (localStorage.getItem('cbit-theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeBtn.querySelector('i').className = 'fas fa-sun';
    }

    // Fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(el => { if (!el.value) el.value = today; });

    // Fecha legible en Registro de Ingreso
    const fechaHoy = document.getElementById('fecha-hoy');
    if (fechaHoy) fechaHoy.textContent = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Cargar vista inicial desde hash
    const hash = window.location.hash.replace('#', '');
    switchViewPub(hash || 'dashboard');
});
