# Pollos Fuentes — Sistema de Gestión de Pedidos

Sistema de gestión de pedidos y rutas de reparto para **Pollos Fuentes**, empresa dedicada al sacrificio, despiece y distribución de pollos.

## 🚀 Despliegue en Cloudflare Pages

### Requisitos
- Cuenta en [Cloudflare](https://dash.cloudflare.com)
- Repositorio en GitHub: `jmd8590-source/rutasrepartidores`

### Pasos para desplegar

1. Ir a **Cloudflare Dashboard → Pages → Create a project**
2. Conectar el repositorio de GitHub `jmd8590-source/rutasrepartidores`
3. Configurar el build con los siguientes valores:

| Parámetro | Valor |
|---|---|
| **Framework preset** | `None` |
| **Build command** | *(dejar vacío)* |
| **Build output directory** | `/` (raíz del repositorio) |
| **Root directory** | *(dejar vacío)* |

4. Hacer clic en **Save and Deploy**

> ✅ Los ficheros `_redirects` y `_headers` ya están configurados en el repositorio para:
> - Redirigir todas las rutas al `index.html` (SPA routing)
> - Añadir cabeceras de seguridad HTTPS necesarias para la Web Crypto API

---

## 🛠️ Desarrollo Local

### Servidor local (Node.js)
```bash
node server.js
# Abre: http://127.0.0.1:8099
```

> **Importante:** La app usa Web Crypto API (SHA-256 para contraseñas), que requiere HTTPS o localhost. No abrir directamente como `file://`.

---

## 🔐 Credenciales de Demo

| Rol | Email | Contraseña |
|---|---|---|
| Superadministrador | `admin@pollosfuentes.es` | `Admin1234!` |
| Repartidor Ruta 1 | `ruta1@pollosfuentes.es` | `Rep1234!` |
| Cliente Demo | `cliente1@demo.es` | `Cliente1234!` |

---

## 📦 Tecnologías

- **Frontend**: HTML5, CSS3 Vanilla, JavaScript ES2022 (SPA)
- **PWA**: Service Worker, Web App Manifest
- **Persistencia local**: localStorage / IndexedDB
- **Autenticación**: SHA-256 (Web Crypto API) + sesiones con token rotatorio
- **Seguridad**: RLS en Supabase, control anti-concurrencia de sesiones
- **Base de datos cloud**: [Supabase](https://supabase.com) (PostgreSQL)

---

## 📱 Roles del sistema

| Rol | Descripción |
|---|---|
| **Superadministrador** | Gestión completa de rutas, usuarios, productos, clientes y pedidos |
| **Repartidor** | Gestión de clientes y pedidos de su ruta, generación de QR de registro |
| **Cliente** | Realización de pedidos, historial, perfil y justificantes |
