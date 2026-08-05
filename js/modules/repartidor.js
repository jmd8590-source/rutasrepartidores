// ============================================================
//  REPARTIDOR.js — Módulo del Repartidor/Responsable de Ruta
//  Pollos Fuentes
// ============================================================
'use strict';

const Repartidor = {

  _getSession() { return Auth.getSession(); },
  _getRutaId() { return this._getSession()?.rutaId; },

  // ─── DASHBOARD ───────────────────────────────────────────
  renderDashboard() {
    const session = this._getSession();
    const rutaId = this._getRutaId();
    const today = Utils.today();
    const ruta = rutaId ? DB.findById('rutas', rutaId) : null;
    const pedidosHoy = rutaId ? DB.find('pedidos', p => p.rutaId === rutaId && p.fecha === today) : [];
    const clientes = rutaId ? DB.find('clientes', c => c.rutaId === rutaId && c.estado === 'activo') : [];
    const pendientes = rutaId ? DB.find('clientes', c => c.rutaId === rutaId && c.estado === 'pendiente') : [];
    const incidencias = pedidosHoy.filter(p => p.estado === 'incidencia');
    const ventasHoy = pedidosHoy.reduce((s, p) => s + (p.total || 0), 0);

    // Verificar hora límite
    const abierto = !ruta?.horaLimitePedido || (() => {
      const now = new Date();
      const [hh, mm] = (ruta.horaLimitePedido).split(':').map(Number);
      const limite = new Date(); limite.setHours(hh, mm, 0, 0);
      return now < limite;
    })();

    document.getElementById('page-title').textContent = 'Mi Panel de Ruta';
    document.getElementById('page-subtitle').textContent = ruta ? `${ruta.nombre} — ${Utils.formatDate(new Date(), 'full')}` : 'Sin ruta asignada';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary btn--sm" onclick="Router.go('/rep/disponibilidad')">📋 Disponibilidad</button>
    `;

    if (!rutaId) return `
      <div class="empty-state">
        <div class="empty-icon">🗺️</div>
        <h3>Sin ruta asignada</h3>
        <p>Contacta con el administrador para que te asigne una ruta.</p>
      </div>
    `;

    return `
      ${!abierto ? `<div class="alert alert--warning mb-4">⏰ La hora límite de pedidos (${ruta.horaLimitePedido}) ha pasado. Los clientes no pueden realizar pedidos.</div>` : `<div class="alert alert--success mb-4">✅ Pedidos abiertos hasta las ${ruta.horaLimitePedido}</div>`}

      <div class="kpi-grid mb-5">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--orange">🛒</div>
          <div class="kpi-info">
            <div class="kpi-value">${pedidosHoy.length}</div>
            <div class="kpi-label">Pedidos hoy</div>
            <div class="kpi-trend">${pedidosHoy.filter(p=>p.estado==='pendiente').length} pendientes</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--green">💶</div>
          <div class="kpi-info">
            <div class="kpi-value">${Utils.formatCurrency(ventasHoy)}</div>
            <div class="kpi-label">Ventas del día</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--blue">🏪</div>
          <div class="kpi-info">
            <div class="kpi-value">${clientes.length}</div>
            <div class="kpi-label">Clientes activos</div>
            ${pendientes.length > 0 ? `<div class="kpi-trend kpi-trend--down">⚠️ ${pendientes.length} pendientes</div>` : ''}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--red">⚠️</div>
          <div class="kpi-info">
            <div class="kpi-value ${incidencias.length > 0 ? 'text-error' : ''}">${incidencias.length}</div>
            <div class="kpi-label">Incidencias hoy</div>
          </div>
        </div>
      </div>

      ${pendientes.length > 0 ? `
      <div class="alert alert--warning mb-4" style="flex-direction:column;align-items:flex-start">
        <strong>🕐 ${pendientes.length} cliente(s) pendientes de aprobación:</strong>
        <div style="margin-top:.5rem">
          ${pendientes.map(c => `
            <div style="display:flex;align-items:center;gap:.5rem;margin-top:.25rem">
              <span style="font-size:.875rem">${Utils.esc(c.nombreNegocio)}</span>
              <button class="btn btn--success btn--xs" onclick="Repartidor.aprobarCliente('${c.id}')">✅ Aprobar</button>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="grid-2" style="gap:1.5rem">
        <div class="card">
          <div class="card-header">
            <h3>📋 Pedidos de Hoy</h3>
            <button class="btn btn--outline btn--sm" onclick="Router.go('/rep/pedidos')">Ver todos</button>
          </div>
          ${pedidosHoy.length ? `
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Cliente</th><th>Total</th><th>Estado</th><th>Acc.</th></tr></thead>
              <tbody>
                ${pedidosHoy.sort((a,b) => b.creadoEn.localeCompare(a.creadoEn)).map(p => {
                  const cli = DB.findById('clientes', p.clienteId);
                  return `<tr>
                    <td>
                      <div style="font-weight:600;font-size:.875rem">${Utils.esc(cli?.nombreNegocio || '—')}</div>
                      <div style="font-size:.75rem;color:var(--muted)">${Utils.formatDate(p.creadoEn, 'time')}</div>
                    </td>
                    <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                    <td>${Utils.statusBadge(p.estado)}</td>
                    <td>
                      <button class="btn btn--outline btn--xs" onclick="Repartidor.showPedidoDetalle('${p.id}')">Ver</button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="empty-state-sm">
            <p>Sin pedidos hoy</p>
          </div>`}
        </div>

        <div class="card">
          <div class="card-header">
            <h3>🏪 Mis Clientes</h3>
            <button class="btn btn--outline btn--sm" onclick="Router.go('/rep/clientes')">Gestionar</button>
          </div>
          <div class="card-body" style="padding:0">
            ${clientes.slice(0, 6).map(c => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;border-bottom:1px solid var(--border-light)">
                <div>
                  <div style="font-weight:600;font-size:.875rem">${Utils.esc(c.nombreNegocio)}</div>
                  <div style="font-size:.75rem;color:var(--muted)">${Utils.esc(c.localidad)}</div>
                </div>
                <div>
                  ${pedidosHoy.find(p => p.clienteId === c.id) ?
                    Utils.statusBadge(pedidosHoy.find(p => p.clienteId === c.id).estado) :
                    '<span class="badge badge--default">Sin pedido</span>'
                  }
                </div>
              </div>
            `).join('') || '<div class="empty-state-sm">Sin clientes activos</div>'}
            ${clientes.length > 6 ? `<div style="padding:.5rem 1.25rem;font-size:.8rem;color:var(--muted);text-align:center">+${clientes.length - 6} más</div>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  aprobarCliente(clienteId) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    DB.update('clientes', clienteId, { estado: 'activo' });
    if (c.usuarioId) DB.update('users', c.usuarioId, { activo: true });
    Audit.log('APROBAR_CLIENTE', 'cliente', clienteId, { nombreNegocio: c.nombreNegocio });
    Toast.success(`Cliente ${Utils.esc(c.nombreNegocio)} aprobado`);
    Router.go('/rep/dashboard');
  },

  // ─── CLIENTES ────────────────────────────────────────────
  renderClientes() {
    const rutaId = this._getRutaId();
    const ruta = rutaId ? DB.findById('rutas', rutaId) : null;
    document.getElementById('page-title').textContent = 'Mis Clientes';
    document.getElementById('page-subtitle').textContent = ruta?.nombre || '';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" id="btn-invitar">✉️ Generar Invitación</button>
    `;

    if (!rutaId) return '<div class="alert alert--warning">Sin ruta asignada</div>';

    const clientes = DB.find('clientes', c => c.rutaId === rutaId);

    setTimeout(() => {
      document.getElementById('btn-invitar')?.addEventListener('click', () => this.generarInvitacion());
      const search = document.getElementById('cli-search-rep');
      const estadoSel = document.getElementById('cli-estado-rep');
      const apply = () => {
        const s = search?.value.toLowerCase() || '';
        const e = estadoSel?.value || '';
        document.querySelectorAll('#clientes-rep-table tbody tr').forEach(row => {
          const name = row.dataset.name || '';
          const estado = row.dataset.estado || '';
          row.style.display = (!s || name.includes(s)) && (!e || estado === e) ? '' : 'none';
        });
      };
      [search, estadoSel].forEach(el => el?.addEventListener('input', apply));
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <div class="search-input" style="flex:1">
            <span class="search-icon">🔍</span>
            <input type="text" id="cli-search-rep" placeholder="Buscar cliente...">
          </div>
          <select id="cli-estado-rep" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="pendiente">Pendientes</option>
            <option value="bloqueado">Bloqueados</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table class="data-table" id="clientes-rep-table">
            <thead><tr>
              <th>Negocio</th><th>Contacto</th><th>Localidad</th><th>Tel.</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${clientes.length ? clientes.map(c => `
              <tr data-estado="${c.estado}" data-name="${Utils.esc((c.nombreNegocio+' '+c.personaContacto+' '+c.localidad).toLowerCase())}">
                <td>
                  <div style="font-weight:600">${Utils.esc(c.nombreNegocio)}</div>
                  <div style="font-size:.8rem;color:var(--muted)">${Utils.esc(c.nifCif)}</div>
                </td>
                <td>${Utils.esc(c.personaContacto)}</td>
                <td>${Utils.esc(c.localidad)}</td>
                <td style="font-size:.875rem">${Utils.esc(c.telefono)}</td>
                <td>${Utils.clienteEstadoBadge(c.estado)}</td>
                <td class="actions-cell">
                  <button class="btn btn--outline btn--xs" onclick="Repartidor.showClienteDetalle('${c.id}')">👁 Ver</button>
                  <button class="btn btn--outline btn--xs" onclick="Repartidor.showClienteEditForm('${c.id}')">✏️</button>
                  ${c.estado === 'pendiente' ? `<button class="btn btn--success btn--xs" onclick="Repartidor.aprobarCliente('${c.id}')">✅</button>` : ''}
                  ${c.estado === 'activo' ? `<button class="btn btn--warning btn--xs" onclick="Repartidor.toggleCliente('${c.id}','bloqueado')">🚫</button>` : ''}
                  ${c.estado === 'bloqueado' ? `<button class="btn btn--success btn--xs" onclick="Repartidor.toggleCliente('${c.id}','activo')">▶</button>` : ''}
                </td>
              </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">No hay clientes en esta ruta</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Invitaciones activas -->
      <div class="card mt-4">
        <div class="card-header">
          <h3>🎫 Códigos de Invitación Activos</h3>
        </div>
        <div class="card-body">
          ${(() => {
            const invs = DB.find('invitaciones', i => i.rutaId === rutaId && !i.usada && new Date() < new Date(i.expiraEn));
            if (!invs.length) return '<p class="text-muted text-sm">No hay invitaciones activas</p>';
            return invs.map(i => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border-light)">
                <div>
                  <code style="font-family:monospace;font-size:.9rem;font-weight:700;color:var(--primary)">${Utils.esc(i.token)}</code>
                  <span style="font-size:.8rem;color:var(--muted);margin-left:.75rem">Expira: ${Utils.formatDate(i.expiraEn, 'datetime')}</span>
                </div>
                <button class="btn btn--outline btn--xs" onclick="navigator.clipboard.writeText('${Utils.esc(i.token)}').then(()=>Toast.success('Código copiado'))">📋 Copiar</button>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    `;
  },

  generarInvitacion() {
    const session = this._getSession();
    const rutaId = this._getRutaId();
    if (!rutaId) { Toast.error('Sin ruta asignada'); return; }
    const inv = Auth.createInvitation(rutaId, session.userId);
    Modal.show('✉️ Código de Invitación Generado', `
      <div style="text-align:center;padding:1.5rem 0">
        <div style="font-size:.875rem;color:var(--muted);margin-bottom:.75rem">Comparte este código con tu cliente:</div>
        <div style="font-family:monospace;font-size:2rem;font-weight:800;color:var(--primary);letter-spacing:.1em;padding:1rem;background:var(--primary-50);border-radius:var(--radius-md)">
          ${Utils.esc(inv.token)}
        </div>
        <div style="font-size:.875rem;color:var(--muted);margin-top:.75rem">
          Válido 7 días · Expira: ${Utils.formatDate(inv.expiraEn, 'datetime')}
        </div>
        <div style="margin-top:.75rem;font-size:.875rem">
          El cliente deberá usar este código en la pantalla de registro de la aplicación.
        </div>
      </div>
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '📋 Copiar Código', cls: 'btn--primary', action: () => {
        navigator.clipboard.writeText(inv.token).then(() => Toast.success('Código copiado al portapapeles'));
      }}
    ]);
    Toast.success('Invitación generada');
  },

  showClienteDetalle(clienteId) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    const pedidos = DB.find('pedidos', p => p.clienteId === clienteId).slice(-5).reverse();
    Modal.show(`🏪 ${Utils.esc(c.nombreNegocio)}`, `
      <div class="detail-grid mb-4">
        <div class="detail-item"><label>Negocio</label><p>${Utils.esc(c.nombreNegocio)}</p></div>
        <div class="detail-item"><label>Contacto</label><p>${Utils.esc(c.personaContacto)}</p></div>
        <div class="detail-item"><label>NIF/CIF</label><p>${Utils.esc(c.nifCif)}</p></div>
        <div class="detail-item"><label>Teléfono</label><p><a href="tel:${Utils.esc(c.telefono)}">${Utils.esc(c.telefono)}</a></p></div>
        <div class="detail-item"><label>Email</label><p>${Utils.esc(c.email)}</p></div>
        <div class="detail-item"><label>Estado</label><p>${Utils.clienteEstadoBadge(c.estado)}</p></div>
      </div>
      <div class="detail-item mb-3"><label>Dirección completa</label>
        <p>${Utils.esc(c.direccion)}, ${Utils.esc(c.localidad)} (${Utils.esc(c.codigoPostal)})</p></div>
      ${c.observacionesEntrega ? `<div class="alert alert--info mb-3">📝 <strong>Obs. entrega:</strong> ${Utils.esc(c.observacionesEntrega)}</div>` : ''}
      <hr class="divider">
      <div style="font-weight:600;margin-bottom:.5rem">Últimos pedidos</div>
      ${pedidos.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--border-light);font-size:.875rem">
          <span>${Utils.formatDate(p.fecha)}</span>
          <span>${Utils.formatCurrency(p.total)}</span>
          ${Utils.statusBadge(p.estado)}
        </div>
      `).join('') || '<p class="text-muted text-sm">Sin pedidos</p>'}
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '✏️ Editar', cls: 'btn--primary', action: () => { Modal.hide(); this.showClienteEditForm(clienteId); } }
    ]);
  },

  showClienteEditForm(clienteId) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    Modal.show('✏️ Editar Cliente', `
      <form id="cli-edit-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre del Negocio *</label>
            <input type="text" id="ce-negocio" value="${Utils.esc(c.nombreNegocio)}" required>
          </div>
          <div class="form-group">
            <label>Persona de Contacto *</label>
            <input type="text" id="ce-contacto" value="${Utils.esc(c.personaContacto)}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>NIF/CIF</label>
            <input type="text" id="ce-nif" value="${Utils.esc(c.nifCif)}">
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="ce-tel" value="${Utils.esc(c.telefono)}">
          </div>
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input type="text" id="ce-dir" value="${Utils.esc(c.direccion)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Localidad</label>
            <input type="text" id="ce-loc" value="${Utils.esc(c.localidad)}">
          </div>
          <div class="form-group">
            <label>C.P.</label>
            <input type="text" id="ce-cp" value="${Utils.esc(c.codigoPostal)}" maxlength="5">
          </div>
        </div>
        <div class="form-group">
          <label>Observaciones de Entrega</label>
          <textarea id="ce-obs">${Utils.esc(c.observacionesEntrega)}</textarea>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="ce-estado">
            <option value="activo" ${c.estado==='activo'?'selected':''}>Activo</option>
            <option value="pendiente" ${c.estado==='pendiente'?'selected':''}>Pendiente</option>
            <option value="bloqueado" ${c.estado==='bloqueado'?'selected':''}>Bloqueado</option>
            <option value="baja" ${c.estado==='baja'?'selected':''}>Baja</option>
          </select>
        </div>
      </form>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '💾 Guardar', cls: 'btn--primary', action: () => {
        const updates = {
          nombreNegocio: Utils.sanitize(document.getElementById('ce-negocio').value),
          personaContacto: Utils.sanitize(document.getElementById('ce-contacto').value),
          nifCif: Utils.sanitize(document.getElementById('ce-nif').value).toUpperCase(),
          telefono: Utils.sanitize(document.getElementById('ce-tel').value),
          direccion: Utils.sanitize(document.getElementById('ce-dir').value),
          localidad: Utils.sanitize(document.getElementById('ce-loc').value),
          codigoPostal: Utils.sanitize(document.getElementById('ce-cp').value),
          observacionesEntrega: Utils.sanitize(document.getElementById('ce-obs').value),
          estado: document.getElementById('ce-estado').value
        };
        DB.update('clientes', clienteId, updates);
        if (c.usuarioId) DB.update('users', c.usuarioId, { activo: updates.estado === 'activo' });
        Audit.log('EDITAR_CLIENTE', 'cliente', clienteId, { nombreNegocio: updates.nombreNegocio });
        Toast.success('Cliente actualizado');
        Modal.hide();
        Router.go('/rep/clientes');
      }}
    ]);
  },

  toggleCliente(clienteId, estado) {
    const c = DB.findById('clientes', clienteId);
    if (!c) return;
    DB.update('clientes', clienteId, { estado });
    if (c.usuarioId) DB.update('users', c.usuarioId, { activo: estado === 'activo' });
    Audit.log('BLOQUEAR_CLIENTE', 'cliente', clienteId, { estado });
    Toast.success(`Cliente ${estado}`);
    Router.go('/rep/clientes');
  },

  // ─── DISPONIBILIDAD ──────────────────────────────────────
  renderDisponibilidad() {
    const rutaId = this._getRutaId();
    const ruta = rutaId ? DB.findById('rutas', rutaId) : null;
    const today = Utils.today();
    document.getElementById('page-title').textContent = 'Disponibilidad Diaria';
    document.getElementById('page-subtitle').textContent = `${ruta?.nombre || ''} — ${Utils.formatDate(today, 'full')}`;
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--success btn--sm" id="btn-save-disp">💾 Guardar Cambios</button>
    `;

    if (!rutaId) return '<div class="alert alert--warning">Sin ruta asignada</div>';

    const productos = DB.find('productos', p => p.activo);
    const categorias = DB.get('categorias');
    const disponibilidades = DB.find('disponibilidad', d => d.rutaId === rutaId && d.fecha === today);
    const getDisp = (prodId) => disponibilidades.find(d => d.productoId === prodId);

    setTimeout(() => {
      document.getElementById('btn-save-disp')?.addEventListener('click', () => this.saveDisponibilidad());
    }, 0);

    const groupedByCat = Utils.groupBy(productos, 'categoriaId');

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3>⏰ Configuración de la Jornada</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Hora Límite de Pedidos</label>
              <input type="time" id="hora-limite" value="${ruta?.horaLimitePedido || '08:00'}">
              <span class="form-hint">Los clientes no podrán modificar pedidos después de esta hora</span>
            </div>
            <div style="display:flex;align-items:flex-end;padding-bottom:.25rem">
              <button class="btn btn--primary btn--sm" onclick="Repartidor.saveHoraLimite()">✅ Actualizar Hora</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>📦 Productos Disponibles Hoy</h3>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn--success btn--xs" onclick="Repartidor.toggleAll(true)">✅ Activar todos</button>
            <button class="btn btn--warning btn--xs" onclick="Repartidor.toggleAll(false)">⏸ Desactivar todos</button>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <form id="disp-form">
            ${Object.entries(groupedByCat).map(([catId, prods]) => {
              const cat = DB.findById('categorias', catId);
              return `
              <div style="border-bottom:2px solid var(--border);padding:1rem 1.25rem;background:var(--bg)">
                <div style="font-weight:700;font-size:.875rem;color:var(--dark-600);text-transform:uppercase;letter-spacing:.05em">
                  ${Utils.esc(cat?.nombre || catId)}
                </div>
              </div>
              ${prods.map(p => {
                const d = getDisp(p.id);
                const disponible = d ? d.disponible : true;
                const precio = d ? d.precio : p.precioBase;
                const cantidad = d?.cantidadDisponible ?? '';
                const limite = d?.limitePorCliente ?? '';
                return `
                <div class="disp-row" data-prod-id="${p.id}" style="display:flex;align-items:center;gap:1rem;padding:.75rem 1.25rem;border-bottom:1px solid var(--border-light);flex-wrap:wrap;${!disponible ? 'opacity:.5;' : ''}">
                  <div style="flex:0 0 40px">
                    <input type="checkbox" class="disp-check" id="disp-${p.id}" data-prod="${p.id}" ${disponible ? 'checked' : ''}
                           onchange="Repartidor.onDispChange('${p.id}',this.checked)"
                           style="width:20px;height:20px;accent-color:var(--primary);cursor:pointer">
                  </div>
                  <div style="flex:1;min-width:150px">
                    <div style="font-weight:600;font-size:.875rem">${Utils.esc(p.nombre)}</div>
                    <div style="font-size:.75rem;color:var(--muted)">${Utils.esc(p.formato)} · base: ${Utils.formatCurrency(p.precioBase)}/${Utils.esc(p.unidadVenta)}</div>
                  </div>
                  <div style="flex:0 0 120px">
                    <label style="font-size:.75rem;font-weight:600;color:var(--muted);display:block;margin-bottom:2px">Precio (€/${Utils.esc(p.unidadVenta)})</label>
                    <input type="number" class="disp-precio" id="precio-${p.id}" value="${precio}" step="0.01" min="0"
                           style="width:100%;padding:.375rem .5rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem"
                           ${!disponible ? 'disabled' : ''}>
                  </div>
                  <div style="flex:0 0 110px">
                    <label style="font-size:.75rem;font-weight:600;color:var(--muted);display:block;margin-bottom:2px">Cantidad total</label>
                    <input type="number" class="disp-cant" id="cant-${p.id}" value="${cantidad}" min="0" placeholder="∞"
                           style="width:100%;padding:.375rem .5rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem"
                           ${!disponible ? 'disabled' : ''}>
                  </div>
                  <div style="flex:0 0 110px">
                    <label style="font-size:.75rem;font-weight:600;color:var(--muted);display:block;margin-bottom:2px">Límite cliente</label>
                    <input type="number" class="disp-limite" id="lim-${p.id}" value="${limite}" min="0" placeholder="Sin límite"
                           style="width:100%;padding:.375rem .5rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem"
                           ${!disponible ? 'disabled' : ''}>
                  </div>
                </div>`;
              }).join('')}`;
            }).join('')}
          </form>
        </div>
      </div>
    `;
  },

  onDispChange(prodId, checked) {
    const row = document.querySelector(`.disp-row[data-prod-id="${prodId}"]`);
    if (!row) return;
    row.style.opacity = checked ? '1' : '.5';
    row.querySelectorAll('input:not(.disp-check)').forEach(i => i.disabled = !checked);
  },

  toggleAll(state) {
    document.querySelectorAll('.disp-check').forEach(cb => {
      cb.checked = state;
      Repartidor.onDispChange(cb.dataset.prod, state);
    });
  },

  saveHoraLimite() {
    const rutaId = this._getRutaId();
    if (!rutaId) return;
    const hora = document.getElementById('hora-limite')?.value;
    if (!hora) return;
    DB.update('rutas', rutaId, { horaLimitePedido: hora });
    Audit.log('EDITAR_RUTA', 'ruta', rutaId, { horaLimitePedido: hora });
    Toast.success(`Hora límite actualizada: ${hora}`);
  },

  saveDisponibilidad() {
    const rutaId = this._getRutaId();
    if (!rutaId) return;
    const today = Utils.today();
    const productos = DB.find('productos', p => p.activo);

    productos.forEach(p => {
      const dispId = `disp-${rutaId}-${p.id}-${today}`;
      const disponible = document.getElementById(`disp-${p.id}`)?.checked ?? true;
      const precio = parseFloat(document.getElementById(`precio-${p.id}`)?.value) || p.precioBase;
      const cantRaw = document.getElementById(`cant-${p.id}`)?.value;
      const limRaw = document.getElementById(`lim-${p.id}`)?.value;
      const cantidadDisponible = cantRaw ? parseInt(cantRaw) : null;
      const limitePorCliente = limRaw ? parseInt(limRaw) : null;

      const existing = DB.findById('disponibilidad', dispId);
      const data = { id: dispId, rutaId, productoId: p.id, fecha: today, disponible, precio, cantidadDisponible, limitePorCliente };
      if (existing) {
        DB.update('disponibilidad', dispId, { disponible, precio, cantidadDisponible, limitePorCliente });
      } else {
        DB.insert('disponibilidad', data);
      }
    });

    Audit.log('CAMBIAR_DISPONIBILIDAD', 'disponibilidad', rutaId, { fecha: today });
    Toast.success('Disponibilidad guardada correctamente');
  },

  // ─── PEDIDOS ─────────────────────────────────────────────
  renderPedidos() {
    const rutaId = this._getRutaId();
    document.getElementById('page-title').textContent = 'Pedidos de mi Ruta';
    document.getElementById('page-subtitle').textContent = '';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--outline btn--sm" id="btn-export-rep">📥 CSV</button>
      <button class="btn btn--primary btn--sm" onclick="Repartidor.printResumenDia()">🖨️ Imprimir</button>
    `;

    if (!rutaId) return '<div class="alert alert--warning">Sin ruta asignada</div>';

    const pedidos = DB.find('pedidos', p => p.rutaId === rutaId).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    const today = Utils.today();

    setTimeout(() => {
      const fechaFil = document.getElementById('ped-rep-fecha');
      const estadoFil = document.getElementById('ped-rep-estado');
      const apply = () => {
        const f = fechaFil?.value || '';
        const e = estadoFil?.value || '';
        document.querySelectorAll('#ped-rep-table tbody tr').forEach(row => {
          const fd = row.dataset.fecha || '';
          const es = row.dataset.estado || '';
          row.style.display = (!f || fd === f) && (!e || es === e) ? '' : 'none';
        });
      };
      [fechaFil, estadoFil].forEach(el => el?.addEventListener('input', apply));
      document.getElementById('btn-export-rep')?.addEventListener('click', () => {
        const data = pedidos.map(p => {
          const cli = DB.findById('clientes', p.clienteId);
          return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Estado: p.estado, Total: p.total };
        });
        Utils.exportCSV(data, 'pedidos_ruta_' + Utils.today());
      });
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <input type="date" id="ped-rep-fecha" value="${today}" class="filter-select" style="min-width:140px">
          <select id="ped-rep-estado" class="filter-select">
            <option value="">Todos los estados</option>
            ${['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado','cancelado','incidencia'].map(e =>
              `<option value="${e}">${e.replace('_',' ')}</option>`
            ).join('')}
          </select>
        </div>
        <div class="table-wrapper">
          <table class="data-table" id="ped-rep-table">
            <thead><tr>
              <th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${pedidos.map(p => {
                const cli = DB.findById('clientes', p.clienteId);
                return `<tr data-fecha="${p.fecha}" data-estado="${p.estado}">
                  <td style="font-size:.875rem">${Utils.formatDate(p.fecha)}<br><span style="font-size:.75rem;color:var(--muted)">${Utils.formatDate(p.creadoEn,'time')}</span></td>
                  <td><div style="font-weight:600;font-size:.875rem">${Utils.esc(cli?.nombreNegocio||'—')}</div></td>
                  <td style="font-size:.8rem;max-width:180px">${(p.lineas||[]).map(l=>`${Utils.formatNumber(l.cantidad,0)} × ${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}`).join('<br>')}</td>
                  <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                  <td>${Utils.statusBadge(p.estado)}</td>
                  <td class="actions-cell">
                    <button class="btn btn--outline btn--xs" onclick="Repartidor.showPedidoDetalle('${p.id}')">Ver</button>
                    <button class="btn btn--primary btn--xs" onclick="Repartidor.showCambioEstado('${p.id}')">Estado</button>
                  </td>
                </tr>`;
              }).join('') || '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Sin pedidos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showPedidoDetalle(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = DB.findById('clientes', p.clienteId);
    Modal.show(`📋 Pedido — ${Utils.esc(cli?.nombreNegocio || '')}`, `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem">
        <div>${Utils.statusBadge(p.estado)}</div>
        <div style="font-size:.875rem;color:var(--muted)">${Utils.formatDate(p.creadoEn, 'datetime')}</div>
      </div>
      ${p.observaciones ? `<div class="alert alert--info mb-3">💬 ${Utils.esc(p.observaciones)}</div>` : ''}
      ${cli?.observacionesEntrega ? `<div class="alert alert--warning mb-3">📝 Entrega: ${Utils.esc(cli.observacionesEntrega)}</div>` : ''}
      <table class="data-table mb-3">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${(p.lineas||[]).map(l => `<tr>
            <td>${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}</td>
            <td>${Utils.formatNumber(l.cantidad,0)} ${Utils.esc(l.unidadVenta||'')}</td>
            <td>${Utils.formatCurrency(l.precioUnitario)}</td>
            <td><strong>${Utils.formatCurrency(l.subtotal)}</strong></td>
          </tr>`).join('')}
          <tr class="summary-total-row"><td colspan="3"><strong>Total</strong></td><td><strong>${Utils.formatCurrency(p.total)}</strong></td></tr>
        </tbody>
      </table>
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '🔄 Cambiar Estado', cls: 'btn--primary', action: () => { Modal.hide(); this.showCambioEstado(pedidoId); } },
      { text: '🖨 Imprimir', cls: 'btn--secondary btn--sm', action: () => SuperAdmin.printPedido(pedidoId) }
    ]);
  },

  showCambioEstado(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = DB.findById('clientes', p.clienteId);
    const estados = ['confirmado','en_preparacion','preparado','en_reparto','entregado','cancelado','incidencia'];
    Modal.show('🔄 Cambiar Estado del Pedido', `
      <div style="margin-bottom:1rem">
        <strong>${Utils.esc(cli?.nombreNegocio || '')}</strong> — ${Utils.formatDate(p.fecha)} — ${Utils.formatCurrency(p.total)}<br>
        <span style="font-size:.875rem">Estado actual: ${Utils.statusBadge(p.estado)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
        ${estados.map(e => `
          <button class="btn btn--${e === p.estado ? 'primary' : 'outline'} btn--sm" style="justify-content:flex-start"
                  onclick="Repartidor.cambiarEstadoPedido('${pedidoId}','${e}')">
            ${Utils.statusBadge(e)}
          </button>
        `).join('')}
      </div>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() }
    ]);
  },

  cambiarEstadoPedido(pedidoId, nuevoEstado) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const session = this._getSession();
    const hist = [...(p.historialEstados || []), { estado: nuevoEstado, fecha: Utils.now(), usuario: session?.userId }];
    DB.update('pedidos', pedidoId, { estado: nuevoEstado, historialEstados: hist });
    Notify.notifyOrderStatus({ ...p, estado: nuevoEstado }, nuevoEstado, session?.userId);
    Audit.log('CAMBIAR_ESTADO_PEDIDO', 'pedido', pedidoId, { estado: nuevoEstado });
    Toast.success(`Estado: ${nuevoEstado.replace('_', ' ')}`);
    Modal.hide();
    Router.go('/rep/pedidos');
  },

  // ─── RESUMEN DIARIO ──────────────────────────────────────
  renderResumen() {
    const rutaId = this._getRutaId();
    const ruta = rutaId ? DB.findById('rutas', rutaId) : null;
    const today = Utils.today();
    document.getElementById('page-title').textContent = 'Resumen Diario';
    document.getElementById('page-subtitle').textContent = Utils.formatDate(today, 'full');
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--outline btn--sm" onclick="Repartidor.printResumenDia()">🖨️ Imprimir</button>
      <button class="btn btn--primary btn--sm" onclick="Repartidor.exportResumen()">📥 CSV</button>
    `;

    if (!rutaId) return '<div class="alert alert--warning">Sin ruta asignada</div>';

    const pedidosHoy = DB.find('pedidos', p => p.rutaId === rutaId && p.fecha === today);
    const total = pedidosHoy.reduce((s, p) => s + (p.total || 0), 0);

    // Resumen por cliente
    const byCliente = pedidosHoy.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { cli: cli?.nombreNegocio || '—', obs: cli?.observacionesEntrega || '', estado: p.estado, total: p.total, lineas: p.lineas || [], pedidoObs: p.observaciones || '' };
    });

    // Resumen por producto
    const byProducto = {};
    pedidosHoy.forEach(p => (p.lineas || []).forEach(l => {
      const key = l.productoId;
      if (!byProducto[key]) byProducto[key] = { nombre: l.nombre || Utils.getProductoNombre(l.productoId), unidad: l.unidadVenta || '', qty: 0, importe: 0 };
      byProducto[key].qty += l.cantidad || 0;
      byProducto[key].importe += l.subtotal || 0;
    }));
    const prodList = Object.values(byProducto).sort((a, b) => b.qty - a.qty);

    return `
      <div class="kpi-grid mb-5">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--orange">🛒</div>
          <div class="kpi-info"><div class="kpi-value">${pedidosHoy.length}</div><div class="kpi-label">Pedidos</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--green">💶</div>
          <div class="kpi-info"><div class="kpi-value">${Utils.formatCurrency(total)}</div><div class="kpi-label">Total</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--blue">✅</div>
          <div class="kpi-info"><div class="kpi-value">${pedidosHoy.filter(p=>p.estado==='entregado').length}</div><div class="kpi-label">Entregados</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--red">⚠️</div>
          <div class="kpi-info"><div class="kpi-value">${pedidosHoy.filter(p=>p.estado==='incidencia').length}</div><div class="kpi-label">Incidencias</div></div>
        </div>
      </div>

      <div class="grid-2" style="gap:1.5rem">
        <div class="card">
          <div class="card-header"><h3>👥 Por Cliente</h3></div>
          ${byCliente.length ? byCliente.map(c => `
            <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border-light)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
                <div>
                  <div style="font-weight:700">${Utils.esc(c.cli)}</div>
                  ${c.obs ? `<div style="font-size:.8rem;color:var(--primary)">📝 ${Utils.esc(c.obs)}</div>` : ''}
                  ${c.pedidoObs ? `<div style="font-size:.8rem;color:var(--muted)">💬 ${Utils.esc(c.pedidoObs)}</div>` : ''}
                </div>
                <div style="text-align:right">
                  ${Utils.statusBadge(c.estado)}
                  <div style="font-weight:700;color:var(--primary);margin-top:.25rem">${Utils.formatCurrency(c.total)}</div>
                </div>
              </div>
              <div style="font-size:.8rem;color:var(--dark-600)">
                ${c.lineas.map(l => `${Utils.formatNumber(l.cantidad,0)} ${Utils.esc(l.unidadVenta||'')} × ${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}`).join(' · ')}
              </div>
            </div>
          `).join('') : '<div class="empty-state-sm">Sin pedidos</div>'}
        </div>

        <div class="card">
          <div class="card-header"><h3>📦 Por Producto</h3></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr></thead>
              <tbody>
                ${prodList.length ? prodList.map(p => `<tr>
                  <td>${Utils.esc(p.nombre)}</td>
                  <td><strong>${Utils.formatNumber(p.qty, 0)} ${Utils.esc(p.unidad)}</strong></td>
                  <td>${Utils.formatCurrency(p.importe)}</td>
                </tr>`).join('') + `
                <tr class="summary-total-row">
                  <td colspan="2"><strong>Total</strong></td>
                  <td><strong>${Utils.formatCurrency(total)}</strong></td>
                </tr>` : '<tr><td colspan="3" class="text-center text-muted" style="padding:2rem">Sin datos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  printResumenDia() {
    const rutaId = this._getRutaId();
    if (!rutaId) return;
    const ruta = DB.findById('rutas', rutaId);
    const today = Utils.today();
    const pedidos = DB.find('pedidos', p => p.rutaId === rutaId && p.fecha === today);
    const total = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const byProd = {};
    pedidos.forEach(p => (p.lineas || []).forEach(l => {
      if (!byProd[l.productoId]) byProd[l.productoId] = { nombre: l.nombre || Utils.getProductoNombre(l.productoId), qty: 0 };
      byProd[l.productoId].qty += l.cantidad || 0;
    }));
    const clienteRows = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      const lineasStr = (p.lineas||[]).map(l => `${l.cantidad} ${l.unidadVenta||''} ${l.nombre||''}`).join(', ');
      return `<tr><td>${Utils.esc(cli?.nombreNegocio||'')}</td><td>${Utils.esc(lineasStr)}</td><td>${p.estado}</td><td>${Utils.formatCurrency(p.total)}</td></tr>`;
    }).join('');
    const prodRows = Object.values(byProd).map(p => `<tr><td>${Utils.esc(p.nombre)}</td><td>${p.qty}</td></tr>`).join('');
    Utils.printSection(`
      <h1>Resumen Diario — ${Utils.esc(ruta?.nombre||'')} — ${Utils.formatDate(today,'full')}</h1>
      <p><strong>Total pedidos:</strong> ${pedidos.length} | <strong>Total:</strong> ${Utils.formatCurrency(total)}</p>
      <h2>Por Cliente</h2>
      <table><thead><tr><th>Cliente</th><th>Productos</th><th>Estado</th><th>Total</th></tr></thead><tbody>${clienteRows}</tbody></table>
      <h2>Por Producto</h2>
      <table><thead><tr><th>Producto</th><th>Cantidad Total</th></tr></thead><tbody>${prodRows}</tbody></table>
    `, 'Resumen Diario');
  },

  exportResumen() {
    const rutaId = this._getRutaId();
    if (!rutaId) return;
    const today = Utils.today();
    const pedidos = DB.find('pedidos', p => p.rutaId === rutaId && p.fecha === today);
    const data = pedidos.map(p => {
      const cli = DB.findById('clientes', p.clienteId);
      return { Fecha: p.fecha, Cliente: cli?.nombreNegocio||'', Estado: p.estado, Total: p.total };
    });
    Utils.exportCSV(data, 'resumen_ruta_' + today);
  }
};
