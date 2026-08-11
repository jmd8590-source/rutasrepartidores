// ============================================================
//  CLIENTE.js — Módulo del Cliente
//  Pollos Frescos
// ============================================================
'use strict';

const Cliente = {
  _cart: [],
  _cartObs: '',

  _getSession() { return Auth.getSession(); },
  _getClienteProfile() {
    const s = this._getSession();
    if (!s) return null;
    return DB.findOne('clientes', c => c.usuarioId === s.userId) ||
           (s.email ? DB.findOne('clientes', c => c.email && c.email.toLowerCase() === s.email.toLowerCase()) : null);
  },

  // ─── DASHBOARD ───────────────────────────────────────────
  renderDashboard() {
    const session = this._getSession();
    const cli = this._getClienteProfile();
    const today = Utils.today();

    document.getElementById('page-title').textContent = '¡Bienvenido!';
    document.getElementById('page-subtitle').textContent = cli ? cli.nombreNegocio : '';
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" onclick="Router.go('/cliente/catalogo')">🛒 Hacer Pedido</button>
    `;

    if (!cli) return `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Perfil no encontrado</h3>
        <p>No se encontró tu perfil de cliente. Contacta con tu repartidor.</p>
      </div>
    `;

    if (cli.estado !== 'activo') return `
      <div class="alert alert--${cli.estado === 'pendiente' ? 'warning' : 'error'}" style="margin-bottom:1rem">
        ${cli.estado === 'pendiente' ?
          '🕐 Tu cuenta está <strong>pendiente de aprobación</strong>. El repartidor revisará tu solicitud.' :
          cli.estado === 'bloqueado' ?
          '🚫 Tu cuenta está <strong>bloqueada</strong>. Contacta con tu repartidor.' :
          '❌ Tu cuenta ha sido dada de <strong>baja</strong>. Contacta con tu repartidor.'}
      </div>
    `;

    const ruta = DB.findById('rutas', cli.rutaId);
    const pedidos = DB.find('pedidos', p => p.clienteId === cli.id);
    const todayPedido = pedidos.find(p => p.fecha === today);
    const ultimosPedidos = [...pedidos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 5);

    // Verificar hora límite
    const abierto = !ruta?.horaLimitePedido || (() => {
      const now = new Date();
      const [hh, mm] = ruta.horaLimitePedido.split(':').map(Number);
      const lim = new Date(); lim.setHours(hh, mm, 0, 0);
      return now < lim;
    })();

    return `
      ${!abierto ? `
        <div class="alert alert--warning mb-4">
          ⏰ El plazo para realizar pedidos hoy (<strong>${ruta?.horaLimitePedido}</strong>) ha finalizado.
          Puedes realizar tu pedido para mañana.
        </div>` : `
        <div class="alert alert--success mb-4">
          ✅ Pedidos abiertos hasta las <strong>${ruta?.horaLimitePedido || '—'}</strong>
          <span style="margin-left:.75rem">
            <button class="btn btn--primary btn--sm" onclick="Router.go('/cliente/catalogo')">🛒 Hacer Pedido Ahora</button>
          </span>
        </div>`
      }

      ${todayPedido ? `
      <div class="card mb-5" style="border:2px solid var(--primary)">
        <div class="card-header" style="background:var(--primary-50)">
          <div>
            <h3 style="color:var(--primary-dark)">📦 Tu Pedido de Hoy</h3>
            <p style="font-size:.875rem;color:var(--muted)">${Utils.formatDate(todayPedido.creadoEn, 'datetime')}</p>
          </div>
          <div style="text-align:right">
            ${Utils.statusBadge(todayPedido.estado)}
            <div style="font-size:1.3rem;font-weight:800;color:var(--primary);margin-top:.25rem">${Utils.formatCurrency(todayPedido.total)}</div>
          </div>
        </div>
        <div class="card-body">
          <!-- Progress steps -->
          <div class="status-steps">
            ${['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado'].map(e => {
              const estados = ['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado'];
              const currentIdx = estados.indexOf(todayPedido.estado);
              const thisIdx = estados.indexOf(e);
              const icons = { pendiente: '🕐', confirmado: '✅', en_preparacion: '🔧', preparado: '📦', en_reparto: '🚚', entregado: '🏠' };
              return `<div class="status-step ${thisIdx < currentIdx ? 'done' : thisIdx === currentIdx ? 'current' : ''}">
                <div class="step-dot">${thisIdx <= currentIdx ? (thisIdx < currentIdx ? '✓' : icons[e]) : ''}</div>
                <div class="step-label">${e.replace('_', ' ')}</div>
              </div>`;
            }).join('')}
          </div>
          ${todayPedido.observaciones ? `<div class="alert alert--info mt-3">💬 ${Utils.esc(todayPedido.observaciones)}</div>` : ''}
          <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn--outline btn--sm" onclick="Cliente.showPedidoDetalle('${todayPedido.id}')">👁 Ver Detalle</button>
            <button class="btn btn--secondary btn--sm" onclick="Cliente.printPedido('${todayPedido.id}')">🖨 Justificante</button>
            ${(todayPedido.estado === 'pendiente') && abierto ? `
              <button class="btn btn--error btn--sm" onclick="Cliente.cancelarPedido('${todayPedido.id}')">❌ Cancelar</button>` : ''}
          </div>
        </div>
      </div>` : `
      <div class="card mb-5" style="border:2px dashed var(--border)">
        <div class="card-body" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:.75rem">🛒</div>
          <h3 style="margin-bottom:.5rem">Sin pedido hoy</h3>
          <p style="color:var(--muted);margin-bottom:1rem">Todavía no has realizado ningún pedido hoy.</p>
          ${abierto ? `<button class="btn btn--primary" onclick="Router.go('/cliente/catalogo')">Ver Catálogo de Hoy</button>` : '<p style="color:var(--muted);font-size:.875rem">El plazo de pedidos ha cerrado por hoy.</p>'}
        </div>
      </div>`}

      <div class="card">
        <div class="card-header">
          <h3>📋 Historial Reciente</h3>
          <button class="btn btn--outline btn--sm" onclick="Router.go('/cliente/pedidos')">Ver todo</button>
        </div>
        ${ultimosPedidos.length ? `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acc.</th></tr></thead>
            <tbody>
              ${ultimosPedidos.map(p => `<tr>
                <td style="font-size:.875rem">${Utils.formatDate(p.fecha)}</td>
                <td style="font-size:.8rem">${(p.lineas||[]).length} líneas</td>
                <td><strong>${Utils.formatCurrency(p.total)}</strong></td>
                <td>${Utils.statusBadge(p.estado)}</td>
                <td>
                  <button class="btn btn--outline btn--xs" onclick="Cliente.showPedidoDetalle('${p.id}')">Ver</button>
                  <button class="btn btn--primary btn--xs" onclick="Cliente.repeatPedido('${p.id}')">🔄 Repetir</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty-state-sm">Sin historial de pedidos</div>`}
      </div>
    `;
  },

  // ─── CATÁLOGO ────────────────────────────────────────────
  renderCatalogo() {
    const cli = this._getClienteProfile();
    const today = Utils.today();
    document.getElementById('page-title').textContent = 'Catálogo de Hoy';
    document.getElementById('page-subtitle').textContent = Utils.formatDate(today, 'full');
    document.getElementById('header-actions').innerHTML = `
      <button class="btn btn--primary" id="open-cart-btn" onclick="Cliente.openCart()">
        🛒 Mi Pedido <span id="cart-count" class="notif-badge" style="position:relative;top:0;right:0;margin-left:.25rem">${this._cart.length || ''}</span>
      </button>
    `;

    if (!cli || cli.estado !== 'activo') {
      return '<div class="alert alert--warning">Tu cuenta no está activa para realizar pedidos.</div>';
    }

    const ruta = DB.findById('rutas', cli.rutaId);

    // Verificar hora límite
    const abierto = !ruta?.horaLimitePedido || (() => {
      const now = new Date();
      const [hh, mm] = ruta.horaLimitePedido.split(':').map(Number);
      const lim = new Date(); lim.setHours(hh, mm, 0, 0);
      return now < lim;
    })();

    // Pedido de hoy ya existente
    const todayPedido = DB.findOne('pedidos', p => p.clienteId === cli.id && p.fecha === today);
    const isEditable = todayPedido && todayPedido.estado === 'pendiente' && abierto;

    const disponibilidades = DB.find('disponibilidad', d => d.rutaId === cli.rutaId && d.fecha === today && d.disponible);
    const categorias = DB.get('categorias');

    if (!disponibilidades.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>Sin disponibilidad configurada</h3>
          <p>Tu repartidor aún no ha configurado los productos disponibles para hoy.</p>
        </div>
      `;
    }

    const prodsByDisp = disponibilidades.map(d => {
      const prod = DB.findById('productos', d.productoId);
      const cat = DB.findById('categorias', prod?.categoriaId);
      return prod ? { ...prod, dispPrecio: d.precio, dispCantidad: d.cantidadDisponible, dispLimite: d.limitePorCliente, catNombre: cat?.nombre || '', catId: prod.categoriaId } : null;
    }).filter(Boolean);

    const byCategory = Utils.groupBy(prodsByDisp, 'categoriaId');

    return `
      ${!abierto ? `
        <div class="alert alert--warning mb-4">
          ⏰ El plazo de pedidos cerró a las <strong>${ruta?.horaLimitePedido}</strong>. No puedes realizar ni modificar pedidos.
        </div>` : ''}

      ${todayPedido && !isEditable ? `
        <div class="alert alert--info mb-4">
          ℹ️ Ya tienes un pedido para hoy (${Utils.statusBadge(todayPedido.estado)}). 
          ${isEditable ? 'Puedes modificarlo desde tu carrito.' : 'No puedes modificarlo en este estado.'}
          <button class="btn btn--outline btn--sm" style="margin-left:.5rem" onclick="Cliente.showPedidoDetalle('${todayPedido.id}')">Ver Pedido</button>
        </div>` : ''}

      <div class="filters-bar mb-4" style="background:transparent;border:none;padding:0">
        <div class="search-input" style="flex:1">
          <span class="search-icon">🔍</span>
          <input type="text" id="cat-search" placeholder="Buscar producto..." oninput="Cliente.filterCatalog(this.value)">
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${categorias.filter(c => byCategory[c.id]).map(c => `
            <button class="btn btn--outline btn--sm cat-filter" data-cat="${c.id}"
                    onclick="Cliente.filterByCategory('${c.id}',this)">${Utils.esc(c.nombre)}</button>
          `).join('')}
          <button class="btn btn--outline btn--sm" onclick="Cliente.filterByCategory('',null)">Todos</button>
        </div>
      </div>

      <div id="catalog-grid">
        ${Object.entries(byCategory).map(([catId, prods]) => {
          const cat = DB.findById('categorias', catId);
          return `
            <div class="cat-section" data-cat="${catId}">
              <h3 style="font-size:1rem;font-weight:700;color:var(--dark-600);margin-bottom:1rem;padding-bottom:.5rem;border-bottom:2px solid var(--primary-200)">
                📦 ${Utils.esc(cat?.nombre || catId)}
              </h3>
              <div class="grid-auto" style="margin-bottom:1.5rem">
                ${prods.map(p => {
                  const inCart = this._cart.find(c => c.productoId === p.id);
                  return `
                  <div class="product-card" id="prod-card-${p.id}">
                    <div class="product-img">
                      ${p.imagen ? `<img src="${Utils.esc(p.imagen)}" alt="${Utils.esc(p.nombre)}">` : '🐔'}
                    </div>
                    <div class="product-body">
                      <div class="product-cat">${Utils.esc(p.catNombre)}</div>
                      <div class="product-name">${Utils.esc(p.nombre)}</div>
                      <div class="product-desc">${Utils.esc(p.descripcion || '')}</div>
                      ${p.dispCantidad ? `<div style="font-size:.75rem;color:var(--warning);margin-top:.25rem">⚡ Quedan ${p.dispCantidad} ${p.unidadVenta}</div>` : ''}
                      ${p.dispLimite ? `<div style="font-size:.75rem;color:var(--muted);margin-top:.1rem">🚫 Máx. ${p.dispLimite} por pedido</div>` : ''}
                    </div>
                    <div class="product-footer">
                      <div class="product-price">
                        ${Utils.formatCurrency(p.dispPrecio)} <span>/ ${Utils.esc(p.unidadVenta)}</span>
                      </div>
                      ${abierto && (!todayPedido || isEditable) ? `
                        ${inCart ? `
                          <div class="cart-item-qty">
                            <button class="qty-btn" onclick="Cliente.changeCartQty('${p.id}',-1)">−</button>
                            <span class="qty-display" id="qty-${p.id}">${inCart.cantidad}</span>
                            <button class="qty-btn" onclick="Cliente.changeCartQty('${p.id}',1)">+</button>
                          </div>
                        ` : `
                          <button class="product-add-btn" onclick="Cliente.addToCart('${p.id}',${p.dispPrecio},'${Utils.esc(p.nombre).replace(/'/g,"\\'")}','${Utils.esc(p.unidadVenta)}',${p.dispLimite||'null'})"
                                  title="Añadir al pedido">+</button>
                        `}
                      ` : `<span class="badge badge--default">No disponible</span>`}
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  filterCatalog(search) {
    const s = search.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
      const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
      card.style.display = (!s || name.includes(s) || desc.includes(s)) ? '' : 'none';
    });
  },

  filterByCategory(catId, btn) {
    document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('btn--primary'));
    if (btn) btn.classList.add('btn--primary');
    document.querySelectorAll('.cat-section').forEach(section => {
      section.style.display = (!catId || section.dataset.cat === catId) ? '' : 'none';
    });
  },

  addToCart(productoId, precio, nombre, unidadVenta, limite) {
    const existing = this._cart.find(c => c.productoId === productoId);
    if (existing) {
      existing.cantidad++;
      if (limite && existing.cantidad > limite) { existing.cantidad = limite; Toast.warning(`Límite: ${limite} ${unidadVenta}`); }
      existing.subtotal = parseFloat((existing.cantidad * existing.precioUnitario).toFixed(2));
    } else {
      this._cart.push({ productoId, nombre, precioUnitario: precio, unidadVenta, cantidad: 1, subtotal: precio, limite });
    }
    this.updateCartUI();
    Toast.success(`${nombre} añadido`);
  },

  changeCartQty(productoId, delta) {
    const idx = this._cart.findIndex(c => c.productoId === productoId);
    if (idx === -1) return;
    this._cart[idx].cantidad += delta;
    if (this._cart[idx].cantidad <= 0) {
      this._cart.splice(idx, 1);
    } else {
      const item = this._cart[idx];
      if (item.limite && item.cantidad > item.limite) { item.cantidad = item.limite; Toast.warning(`Límite: ${item.limite}`); }
      item.subtotal = parseFloat((item.cantidad * item.precioUnitario).toFixed(2));
    }
    this.updateCartUI();
    // Update qty display in catalog
    const qtyEl = document.getElementById('qty-' + productoId);
    const item = this._cart.find(c => c.productoId === productoId);
    if (qtyEl && item) qtyEl.textContent = item.cantidad;
    else if (!item) {
      // Rerender card footer
      const card = document.getElementById('prod-card-' + productoId);
      if (card) {
        const footer = card.querySelector('.product-footer');
        if (footer) {
          const addBtn = footer.querySelector('.qty-btn');
          if (addBtn) {
            const prod = DB.findById('productos', productoId);
            const disp = DB.findOne('disponibilidad', d => d.productoId === productoId);
            footer.innerHTML = `
              <div class="product-price">${Utils.formatCurrency(disp?.precio || prod?.precioBase || 0)} <span>/ ${Utils.esc(prod?.unidadVenta || '')}</span></div>
              <button class="product-add-btn" onclick="Cliente.addToCart('${productoId}',${disp?.precio || prod?.precioBase},'${Utils.esc(prod?.nombre || '')}','${Utils.esc(prod?.unidadVenta || '')}',${disp?.limitePorCliente || 'null'})">+</button>
            `;
          }
        }
      }
    }
  },

  updateCartUI() {
    const total = this._cart.reduce((s, i) => s + i.subtotal, 0);
    const totalEl = document.getElementById('cart-total-amount');
    const footerEl = document.getElementById('cart-footer');
    const countEl = document.getElementById('cart-count');
    if (totalEl) totalEl.textContent = Utils.formatCurrency(total);
    if (footerEl) footerEl.style.display = this._cart.length ? '' : 'none';
    if (countEl) { countEl.textContent = this._cart.length; countEl.classList.toggle('hidden', !this._cart.length); }
    this.renderCartItems();
  },

  renderCartItems() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    if (!this._cart.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>El carrito está vacío</p></div>`;
      return;
    }
    container.innerHTML = this._cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${Utils.esc(item.nombre)}</div>
          <div class="cart-item-price">${Utils.formatCurrency(item.precioUnitario)} / ${Utils.esc(item.unidadVenta)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="Cliente.changeCartQty('${item.productoId}',-1)">−</button>
          <input class="qty-display" type="number" value="${item.cantidad}" min="1" style="width:40px"
                 onchange="Cliente.setCartQty('${item.productoId}',this.value)">
          <button class="qty-btn" onclick="Cliente.changeCartQty('${item.productoId}',1)">+</button>
        </div>
        <div class="cart-item-subtotal">${Utils.formatCurrency(item.subtotal)}</div>
        <button class="remove-cart-item" onclick="Cliente.removeFromCart('${item.productoId}')">✕</button>
      </div>
    `).join('');
  },

  setCartQty(productoId, qty) {
    const item = this._cart.find(c => c.productoId === productoId);
    if (!item) return;
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) { this.removeFromCart(productoId); return; }
    if (item.limite && n > item.limite) { item.cantidad = item.limite; Toast.warning(`Límite: ${item.limite}`); }
    else item.cantidad = n;
    item.subtotal = parseFloat((item.cantidad * item.precioUnitario).toFixed(2));
    this.updateCartUI();
  },

  removeFromCart(productoId) {
    this._cart = this._cart.filter(c => c.productoId !== productoId);
    this.updateCartUI();
  },

  clearCart() { this._cart = []; this._cartObs = ''; this.updateCartUI(); },

  openCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) panel.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
    this.updateCartUI();
  },

  closeCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) panel.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
  },

  // Confirmar pedido — mostrar resumen completo
  checkout() {
    if (!this._cart.length) { Toast.warning('El carrito está vacío'); return; }
    const cli = this._getClienteProfile();
    if (!cli) return;
    const obs = document.getElementById('cart-obs')?.value || '';
    this._cartObs = obs;
    const total = this._cart.reduce((s, i) => s + i.subtotal, 0);

    Modal.show('📋 Confirmar Pedido', `
      <div class="alert alert--info mb-4">
        Por favor revisa tu pedido antes de confirmar. Una vez confirmado, el repartidor comenzará a prepararlo.
      </div>
      <div class="detail-item mb-3">
        <label>Tu Negocio</label>
        <p style="font-weight:600">${Utils.esc(cli.nombreNegocio)}</p>
      </div>
      <div class="detail-item mb-4">
        <label>Dirección de Entrega</label>
        <p>${Utils.esc(cli.direccion)}, ${Utils.esc(cli.localidad)}</p>
      </div>
      <table class="data-table mb-3">
        <thead><tr><th>Producto</th><th style="text-align:right">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>
          ${this._cart.map(item => `<tr>
            <td>${Utils.esc(item.nombre)}</td>
            <td style="text-align:right">${Utils.formatNumber(item.cantidad, 0)} ${Utils.esc(item.unidadVenta)}</td>
            <td style="text-align:right">${Utils.formatCurrency(item.precioUnitario)}</td>
            <td style="text-align:right"><strong>${Utils.formatCurrency(item.subtotal)}</strong></td>
          </tr>`).join('')}
          <tr style="background:var(--primary-50)">
            <td colspan="3" style="font-weight:700">TOTAL ESTIMADO</td>
            <td style="text-align:right;font-weight:800;font-size:1.1rem;color:var(--primary)">${Utils.formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
      ${obs ? `<div class="alert alert--info">💬 ${Utils.esc(obs)}</div>` : ''}
      <div class="alert alert--warning mt-3" style="font-size:.8rem">
        ⚠️ Los precios son orientativos. El precio final puede variar según el peso real del producto.
      </div>
    `, [
      { text: '← Volver al Carrito', cls: 'btn--outline', action: () => { Modal.hide(); this.openCart(); } },
      { text: '✅ Confirmar Pedido', cls: 'btn--primary btn--lg', action: () => this.createOrder() }
    ], 'modal--lg');
  },

  async createOrder() {
    const cli = this._getClienteProfile();
    if (!cli || !this._cart.length) return;
    const today = Utils.today();

    // Verificar pedido ya existente
    const existing = DB.findOne('pedidos', p => p.clienteId === cli.id && p.fecha === today);
    if (existing && existing.estado !== 'pendiente') {
      Toast.error('Ya tienes un pedido en proceso para hoy que no se puede modificar.');
      Modal.hide();
      return;
    }

    const session = this._getSession();
    const lineas = this._cart.map(item => ({ ...item }));
    const total = parseFloat(lineas.reduce((s, l) => s + l.subtotal, 0).toFixed(2));

    if (existing) {
      // Actualizar pedido pendiente
      DB.update('pedidos', existing.id, { lineas, total, observaciones: this._cartObs });
      Audit.log('CAMBIAR_ESTADO_PEDIDO', 'pedido', existing.id, { accion: 'modificado por cliente' });
      Toast.success('Pedido modificado correctamente');
    } else {
      // Nuevo pedido
      const pedido = DB.insert('pedidos', {
        clienteId: cli.id,
        rutaId: cli.rutaId,
        fecha: today,
        estado: 'pendiente',
        lineas,
        observaciones: this._cartObs,
        total,
        historialEstados: [{ estado: 'pendiente', fecha: Utils.now(), usuario: session?.userId }]
      });
      // Notificar al repartidor
      const ruta = DB.findById('rutas', cli.rutaId);
      if (ruta?.repartidorId) {
        Notify.add(ruta.repartidorId, 'Nuevo Pedido Recibido',
          `${cli.nombreNegocio} ha realizado un nuevo pedido por ${Utils.formatCurrency(total)}`, 'info', pedido.id);
      }
      Audit.log('CREAR_PEDIDO', 'pedido', pedido.id, { clienteId: cli.id, total });
      Toast.success('¡Pedido realizado correctamente!');
    }

    this.clearCart();
    Modal.hide();
    Router.go('/cliente/dashboard');
  },

  cancelarPedido(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p || p.estado !== 'pendiente') { Toast.error('Este pedido no se puede cancelar'); return; }
    Modal.show('❌ Cancelar Pedido', `
      <p>¿Estás seguro de que quieres cancelar este pedido?</p>
      <p style="margin-top:.5rem;font-size:.875rem;color:var(--muted)">Total: ${Utils.formatCurrency(p.total)}</p>
    `, [
      { text: 'No, mantenerlo', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '❌ Sí, Cancelar', cls: 'btn--error', action: () => {
        const session = this._getSession();
        const hist = [...(p.historialEstados || []), { estado: 'cancelado', fecha: Utils.now(), usuario: session?.userId }];
        DB.update('pedidos', pedidoId, { estado: 'cancelado', historialEstados: hist });
        const ruta = DB.findById('rutas', p.rutaId);
        if (ruta?.repartidorId) {
          const cli = DB.findById('clientes', p.clienteId);
          Notify.add(ruta.repartidorId, 'Pedido Cancelado', `${cli?.nombreNegocio || 'Un cliente'} ha cancelado su pedido.`, 'warning', pedidoId);
        }
        Audit.log('CANCELAR_PEDIDO', 'pedido', pedidoId, {});
        Toast.success('Pedido cancelado');
        Modal.hide();
        Router.go('/cliente/dashboard');
      }}
    ]);
  },

  repeatPedido(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = this._getClienteProfile();
    if (!cli) return;
    const ruta = DB.findById('rutas', cli.rutaId);
    const today = Utils.today();

    // Cargar líneas al carrito verificando disponibilidad
    const disponibles = DB.find('disponibilidad', d => d.rutaId === cli.rutaId && d.fecha === today && d.disponible);
    const dispMap = {};
    disponibles.forEach(d => dispMap[d.productoId] = d);

    this._cart = [];
    let notAvail = 0;
    (p.lineas || []).forEach(l => {
      const d = dispMap[l.productoId];
      if (d) {
        this._cart.push({
          productoId: l.productoId, nombre: l.nombre || Utils.getProductoNombre(l.productoId),
          precioUnitario: d.precio, unidadVenta: l.unidadVenta || '',
          cantidad: l.cantidad, subtotal: parseFloat((l.cantidad * d.precio).toFixed(2)),
          limite: d.limitePorCliente || null
        });
      } else notAvail++;
    });

    if (notAvail > 0) Toast.warning(`${notAvail} producto(s) no disponibles hoy fueron omitidos`);
    if (this._cart.length) {
      Toast.success('Pedido anterior cargado en el carrito');
      Router.go('/cliente/catalogo');
      setTimeout(() => this.openCart(), 300);
    } else {
      Toast.error('Ningún producto del pedido anterior está disponible hoy');
    }
  },

  // ─── MIS PEDIDOS ─────────────────────────────────────────
  renderPedidos() {
    const cli = this._getClienteProfile();
    document.getElementById('page-title').textContent = 'Mis Pedidos';
    document.getElementById('page-subtitle').textContent = 'Historial completo de pedidos';
    document.getElementById('header-actions').innerHTML = '';

    if (!cli) return '<div class="alert alert--warning">Perfil no encontrado</div>';

    const pedidos = DB.find('pedidos', p => p.clienteId === cli.id).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

    setTimeout(() => {
      const estadoSel = document.getElementById('ped-cli-estado');
      const fechaSel = document.getElementById('ped-cli-fecha');
      const apply = () => {
        const e = estadoSel?.value || '';
        const f = fechaSel?.value || '';
        document.querySelectorAll('#ped-cli-table tbody tr').forEach(row => {
          row.style.display = (!e || row.dataset.estado === e) && (!f || row.dataset.fecha === f) ? '' : 'none';
        });
      };
      [estadoSel, fechaSel].forEach(el => el?.addEventListener('input', apply));
    }, 0);

    return `
      <div class="card">
        <div class="filters-bar">
          <select id="ped-cli-estado" class="filter-select">
            <option value="">Todos los estados</option>
            ${['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado','cancelado','incidencia'].map(e =>
              `<option value="${e}">${e.replace('_',' ')}</option>`
            ).join('')}
          </select>
          <input type="date" id="ped-cli-fecha" class="filter-select" style="min-width:140px">
        </div>
        <div id="ped-cli-list">
          ${pedidos.length ? pedidos.map(p => `
          <div class="order-card" data-estado="${p.estado}" data-fecha="${p.fecha}">
            <div class="order-card-header">
              <div>
                <div class="order-id">Pedido · ${Utils.formatDate(p.fecha, 'medium')}</div>
                <div class="order-fecha">Realizado: ${Utils.formatDate(p.creadoEn, 'datetime')}</div>
              </div>
              <div style="text-align:right">
                ${Utils.statusBadge(p.estado)}
                <div class="order-total">${Utils.formatCurrency(p.total)}</div>
              </div>
            </div>
            <div class="order-lines">
              ${(p.lineas||[]).map(l => `
                <div class="order-line">
                  <span>${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}</span>
                  <span>${Utils.formatNumber(l.cantidad,0)} ${Utils.esc(l.unidadVenta||'')} · ${Utils.formatCurrency(l.subtotal)}</span>
                </div>
              `).join('')}
            </div>
            ${p.observaciones ? `<div style="font-size:.8rem;color:var(--muted);margin-top:.5rem">💬 ${Utils.esc(p.observaciones)}</div>` : ''}
            <div class="order-actions">
              <button class="btn btn--outline btn--sm" onclick="Cliente.showPedidoDetalle('${p.id}')">👁 Ver Detalle</button>
              <button class="btn btn--secondary btn--sm" onclick="Cliente.printPedido('${p.id}')">🖨 Justificante</button>
              <button class="btn btn--primary btn--sm" onclick="Cliente.repeatPedido('${p.id}')">🔄 Repetir</button>
              ${p.estado === 'pendiente' ? `<button class="btn btn--error btn--sm" onclick="Cliente.cancelarPedido('${p.id}')">❌ Cancelar</button>` : ''}
            </div>
          </div>`).join('') : `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Sin pedidos</h3>
            <p>Aún no has realizado ningún pedido.</p>
            <button class="btn btn--primary mt-4" onclick="Router.go('/cliente/catalogo')">Hacer mi primer pedido</button>
          </div>`}
        </div>
      </div>
    `;
  },

  showPedidoDetalle(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    if (!p) return;
    const cli = this._getClienteProfile();
    const estados = ['pendiente','confirmado','en_preparacion','preparado','en_reparto','entregado'];
    const currentIdx = estados.indexOf(p.estado);

    Modal.show('📋 Detalle del Pedido', `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div>
          <div style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase">Fecha</div>
          <div style="font-weight:600">${Utils.formatDate(p.fecha, 'full')}</div>
        </div>
        <div style="text-align:right">
          ${Utils.statusBadge(p.estado)}
          <div style="font-size:1.4rem;font-weight:800;color:var(--primary);margin-top:.25rem">${Utils.formatCurrency(p.total)}</div>
        </div>
      </div>

      <!-- Steps -->
      <div class="status-steps mb-4" style="overflow-x:auto">
        ${estados.map((e, i) => {
          const icons = { pendiente:'🕐', confirmado:'✅', en_preparacion:'🔧', preparado:'📦', en_reparto:'🚚', entregado:'🏠' };
          return `<div class="status-step ${i < currentIdx ? 'done' : i === currentIdx && !['cancelado','incidencia'].includes(p.estado) ? 'current' : ''}">
            <div class="step-dot">${i < currentIdx ? '✓' : icons[e] || ''}</div>
            <div class="step-label" style="font-size:.6rem">${e.replace('_',' ')}</div>
          </div>`;
        }).join('')}
      </div>

      ${p.observaciones ? `<div class="alert alert--info mb-3">💬 ${Utils.esc(p.observaciones)}</div>` : ''}

      <table class="data-table mb-4">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${(p.lineas||[]).map(l => `<tr>
            <td>${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}</td>
            <td>${Utils.formatNumber(l.cantidad,0)} ${Utils.esc(l.unidadVenta||'')}</td>
            <td>${Utils.formatCurrency(l.precioUnitario)}</td>
            <td><strong>${Utils.formatCurrency(l.subtotal)}</strong></td>
          </tr>`).join('')}
          <tr class="summary-total-row"><td colspan="3">Total</td><td><strong>${Utils.formatCurrency(p.total)}</strong></td></tr>
        </tbody>
      </table>

      <div>
        <div style="font-weight:600;font-size:.875rem;margin-bottom:.5rem">📜 Historial</div>
        ${(p.historialEstados||[]).map(h => `
          <div style="display:flex;gap:.75rem;font-size:.8rem;padding:.3rem 0;border-bottom:1px solid var(--border-light)">
            <span style="color:var(--muted)">${Utils.formatDate(h.fecha,'datetime')}</span>
            ${Utils.statusBadge(h.estado)}
          </div>
        `).join('')}
      </div>
    `, [
      { text: 'Cerrar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '🖨 Justificante', cls: 'btn--secondary', action: () => this.printPedido(pedidoId) },
      { text: '🔄 Repetir', cls: 'btn--primary', action: () => { Modal.hide(); this.repeatPedido(pedidoId); } }
    ], 'modal--lg');
  },

  printPedido(pedidoId) {
    const p = DB.findById('pedidos', pedidoId);
    const cli = this._getClienteProfile();
    if (!p) return;
    const lineasHtml = (p.lineas||[]).map(l => `
      <tr><td>${Utils.esc(l.nombre||Utils.getProductoNombre(l.productoId))}</td>
      <td>${l.cantidad} ${l.unidadVenta||''}</td>
      <td>${Utils.formatCurrency(l.precioUnitario)}</td>
      <td>${Utils.formatCurrency(l.subtotal)}</td></tr>
    `).join('');
    Utils.printSection(`
      <h1>Pollos Frescos — Justificante de Pedido</h1>
      <p><strong>Cliente:</strong> ${Utils.esc(cli?.nombreNegocio||'')} | <strong>NIF/CIF:</strong> ${Utils.esc(cli?.nifCif||'')}</p>
      <p><strong>Dirección:</strong> ${Utils.esc(cli?.direccion||'')}, ${Utils.esc(cli?.localidad||'')} (${Utils.esc(cli?.codigoPostal||'')})</p>
      <p><strong>Fecha pedido:</strong> ${Utils.formatDate(p.fecha)} | <strong>Estado:</strong> ${p.estado}</p>
      ${p.observaciones ? `<p><strong>Observaciones:</strong> ${Utils.esc(p.observaciones)}</p>` : ''}
      <table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>${lineasHtml}</tbody></table>
      <div class="total"><strong>TOTAL ESTIMADO: ${Utils.formatCurrency(p.total)}</strong></div>
      <p style="margin-top:12px;font-size:10px;color:#888">Generado el ${Utils.formatDate(new Date(),'datetime')} · Pollos Frescos S.L. · Este documento es un justificante provisional.</p>
    `, 'Justificante de Pedido');
  },

  // ─── PERFIL ──────────────────────────────────────────────
  renderPerfil() {
    const session = this._getSession();
    const cli = this._getClienteProfile();
    const user = session ? DB.findById('users', session.userId) : null;
    document.getElementById('page-title').textContent = 'Mi Perfil';
    document.getElementById('page-subtitle').textContent = 'Datos personales y configuración';
    document.getElementById('header-actions').innerHTML = '';

    if (!cli || !user) return '<div class="alert alert--warning">Perfil no encontrado</div>';

    return `
      <div class="grid-2" style="gap:1.5rem;align-items:start">
        <div>
          <div class="card mb-4">
            <div class="card-header"><h3>🏪 Datos del Negocio</h3></div>
            <div class="card-body">
              <form id="perfil-form">
                <div class="form-group">
                  <label>Nombre del Negocio</label>
                  <input type="text" id="pf-negocio" value="${Utils.esc(cli.nombreNegocio)}">
                </div>
                <div class="form-group">
                  <label>Persona de Contacto</label>
                  <input type="text" id="pf-contacto" value="${Utils.esc(cli.personaContacto)}">
                </div>
                <div class="form-group">
                  <label>NIF/CIF</label>
                  <input type="text" id="pf-nif" value="${Utils.esc(cli.nifCif)}" placeholder="B12345678">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" id="pf-tel" value="${Utils.esc(cli.telefono)}">
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="pf-email" value="${Utils.esc(cli.email)}" readonly style="background:var(--bg)">
                    <span class="form-hint">El email no se puede cambiar</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Dirección</label>
                  <input type="text" id="pf-dir" value="${Utils.esc(cli.direccion)}">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Localidad</label>
                    <input type="text" id="pf-loc" value="${Utils.esc(cli.localidad)}">
                  </div>
                  <div class="form-group">
                    <label>C.P.</label>
                    <input type="text" id="pf-cp" value="${Utils.esc(cli.codigoPostal)}" maxlength="5">
                  </div>
                </div>
                <div class="form-group">
                  <label>Observaciones de Entrega</label>
                  <textarea id="pf-obs">${Utils.esc(cli.observacionesEntrega)}</textarea>
                </div>
                <button type="button" class="btn btn--primary" onclick="Cliente.savePerfil()">💾 Guardar Cambios</button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-4">
            <div class="card-header"><h3>🔑 Cambiar Contraseña</h3></div>
            <div class="card-body">
              <div class="form-group">
                <label>Contraseña Actual</label>
                <div class="input-wrapper">
                  <input type="password" id="pass-actual" placeholder="••••••••">
                  <button type="button" class="toggle-password" data-target="pass-actual">👁</button>
                </div>
              </div>
              <div class="form-group">
                <label>Nueva Contraseña</label>
                <div class="input-wrapper">
                  <input type="password" id="pass-nueva" placeholder="Mín. 8 caracteres">
                  <button type="button" class="toggle-password" data-target="pass-nueva">👁</button>
                </div>
                <span class="form-hint">Al menos 8 caracteres, una mayúscula y un número</span>
              </div>
              <div class="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <div class="input-wrapper">
                  <input type="password" id="pass-confirm" placeholder="Repite la contraseña">
                  <button type="button" class="toggle-password" data-target="pass-confirm">👁</button>
                </div>
              </div>
              <button class="btn btn--secondary" onclick="Cliente.changePassword()">🔑 Cambiar Contraseña</button>
            </div>
          </div>

          <div class="card mb-4">
            <div class="card-header"><h3>🛡️ Sesiones y Dispositivos</h3></div>
            <div class="card-body">
              <p style="font-size:.875rem;color:var(--muted);margin-bottom:.5rem">
                Dispositivo actual: <strong>${Utils.esc(session.deviceInfo || 'Navegador Web')}</strong>
              </p>
              <p style="font-size:.75rem;color:var(--muted);margin-bottom:1rem">
                Si has iniciado sesión en otro teléfono o navegador, puedes invalidar las demás sesiones activas por seguridad.
              </p>
              <button class="btn btn--warning btn--sm" onclick="Cliente.cerrarOtrasSesiones()">
                🔒 Cerrar sesión en los demás dispositivos
              </button>
            </div>
          </div>

          <div class="card mb-4">
            <div class="card-header"><h3>📋 Mis Datos (RGPD)</h3></div>
            <div class="card-body">
              <p style="font-size:.875rem;color:var(--muted);margin-bottom:1rem">
                Tienes derecho a acceder, rectificar y eliminar tus datos personales conforme al RGPD.
              </p>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                <button class="btn btn--outline btn--sm" onclick="Cliente.exportarDatos()">📥 Exportar mis datos</button>
                <button class="btn btn--error btn--sm" onclick="Cliente.solicitarBorrado()">🗑️ Eliminar mi cuenta</button>
              </div>
              <div style="font-size:.75rem;color:var(--muted);margin-top:.75rem">
                Consentimiento RGPD: ✅ Aceptado el ${Utils.formatDate(user.consentimientoFecha, 'datetime')}
              </div>
            </div>
          </div>

          <div class="card" style="border-color:var(--border)">
            <div class="card-body">
              <div class="detail-item mb-2"><label>Ruta Asignada</label><p>${Utils.esc(Utils.getRutaNombre(cli.rutaId))}</p></div>
              <div class="detail-item mb-2"><label>Estado de la Cuenta</label><p>${Utils.clienteEstadoBadge(cli.estado)}</p></div>
              <div class="detail-item"><label>Miembro desde</label><p>${Utils.formatDate(cli.creadoEn, 'medium')}</p></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  savePerfil() {
    const cli = this._getClienteProfile();
    if (!cli) return;
    const updates = {
      nombreNegocio: Utils.sanitize(document.getElementById('pf-negocio').value),
      personaContacto: Utils.sanitize(document.getElementById('pf-contacto').value),
      nifCif: Utils.sanitize(document.getElementById('pf-nif').value).toUpperCase(),
      telefono: Utils.sanitize(document.getElementById('pf-tel').value),
      direccion: Utils.sanitize(document.getElementById('pf-dir').value),
      localidad: Utils.sanitize(document.getElementById('pf-loc').value),
      codigoPostal: Utils.sanitize(document.getElementById('pf-cp').value),
      observacionesEntrega: Utils.sanitize(document.getElementById('pf-obs').value)
    };
    DB.update('clientes', cli.id, updates);
    Audit.log('EDITAR_CLIENTE', 'cliente', cli.id, { accion: 'autoedición perfil' });
    Toast.success('Perfil actualizado correctamente');
  },

  async changePassword() {
    const session = this._getSession();
    const actual = document.getElementById('pass-actual')?.value;
    const nueva = document.getElementById('pass-nueva')?.value;
    const confirm = document.getElementById('pass-confirm')?.value;
    if (!actual || !nueva || !confirm) { Toast.error('Rellena todos los campos'); return; }
    if (nueva !== confirm) { Toast.error('Las contraseñas no coinciden'); return; }
    const result = await Auth.changePassword(session.userId, actual, nueva);
    if (result.success) { Toast.success('Contraseña cambiada correctamente'); document.getElementById('pass-actual').value = ''; document.getElementById('pass-nueva').value = ''; document.getElementById('pass-confirm').value = ''; }
    else Toast.error(result.error);
  },

  exportarDatos() {
    const session = this._getSession();
    const cli = this._getClienteProfile();
    const user = DB.findById('users', session?.userId);
    const pedidos = DB.find('pedidos', p => p.clienteId === cli?.id);
    const data = [{
      'Email': user?.email || '',
      'Nombre Negocio': cli?.nombreNegocio || '',
      'Contacto': cli?.personaContacto || '',
      'NIF/CIF': cli?.nifCif || '',
      'Dirección': cli?.direccion || '',
      'Localidad': cli?.localidad || '',
      'CP': cli?.codigoPostal || '',
      'Teléfono': cli?.telefono || '',
      'Ruta': Utils.getRutaNombre(cli?.rutaId),
      'Estado': cli?.estado || '',
      'Miembro desde': Utils.formatDate(cli?.creadoEn),
      'Total pedidos': pedidos.length,
      'Consentimiento RGPD': user?.consentimientoFecha || ''
    }];
    Utils.exportCSV(data, 'mis_datos_PollosFrescos');
    Toast.success('Datos exportados correctamente');
  },

  solicitarBorrado() {
    Modal.show('⚠️ Eliminar mi Cuenta', `
      <div class="danger-zone">
        <h4>¡Atención!</h4>
        <p>Solicitar la eliminación de tu cuenta implica que tus datos personales serán anonimizados y no podrás acceder al sistema.</p>
        <p>Tus pedidos históricos se mantendrán de forma anonimizada por obligación legal.</p>
      </div>
      <div class="form-group mt-4">
        <label>Para confirmar, escribe: <strong>ELIMINAR MI CUENTA</strong></label>
        <input type="text" id="borrado-confirm" placeholder="ELIMINAR MI CUENTA">
      </div>
    `, [
      { text: 'Cancelar', cls: 'btn--outline', action: () => Modal.hide() },
      { text: '🗑️ Eliminar Definitivamente', cls: 'btn--error', action: () => {
        if (document.getElementById('borrado-confirm')?.value !== 'ELIMINAR MI CUENTA') {
          Toast.error('Escribe exactamente: ELIMINAR MI CUENTA');
          return;
        }
        const session = this._getSession();
        Auth.anonymizeUser(session.userId);
        Toast.success('Cuenta eliminada. Serás desconectado.');
        Modal.hide();
        setTimeout(() => { Auth.logout(); App.showAuth(); }, 2000);
      }}
    ]);
  },

  cerrarOtrasSesiones() {
    const session = this._getSession();
    if (!session) return;
    const res = Auth.invalidateOtherSessions(session.userId);
    if (res.success) {
      Toast.success('🔒 Las sesiones en otros dispositivos han sido cerradas.');
      this.renderPerfil();
    } else {
      Toast.error(res.error || 'Error al cerrar sesiones.');
    }
  }
};
