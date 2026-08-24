# 🛡️ Guía de Seguridad, Ofuscación y Control Anti-Robo

Esta guía documenta la infraestructura de seguridad implementada para proteger el código de la aplicación, controlar el registro de usuarios, restringir accesos en Supabase y blindar la entrega en Cloudflare.

---

## 1. 🔒 Ofuscación de Código Fuente (Anti-Robo y Anti-Copia)

Para evitar que cualquier persona a la que le compartas el enlace pueda copiar o robar el código JavaScript de la aplicación:

### Ejecución de la Ofuscación:
```bash
npm run build:protect
```
o
```bash
npm run build
```

### ¿Qué hace el ofuscador?
1. Copia la estructura del proyecto al directorio **`dist/`**.
2. Procesa cada archivo JavaScript (`js/`, `demo/`, `sw.js`):
   - **Transforma nombres de variables y funciones** en secuencias hexadecimales ininteligibles (`_0x4f12`, `_0x8ab9`).
   - **Aplanamiento de flujo de control (*Control Flow Flattening*)**: Rompe la secuencia lógica en bucles y switches confusos.
   - **Cifrado de cadenas**: Convierte todos los textos y URLs en arrays cifrados en Base64 con rotación dinámica.
   - **Inyección de código muerto (*Dead Code*)**: Añade bifurcaciones ficticias para frustrar descompiladores.
   - **Protección Self-Defending**: El código se autodestruye o falla si es modificado externamente.
3. El contenido de la carpeta **`dist/`** es la versión lista para desplegar en tu hosting o Cloudflare Pages.

---

## 2. 🗄️ Configuración de Seguridad en Supabase (Row Level Security - RLS)

El archivo **`supabase/schema_and_rls.sql`** contiene la definición completa de base de datos PostgreSQL con aislamiento estricto por fila.

### Pasos para aplicar en Supabase:
1. Entra a tu consola de [Supabase](https://supabase.com/dashboard).
2. Ve a **SQL Editor**.
3. Copia y pega el contenido del archivo [`supabase/schema_and_rls.sql`](../supabase/schema_and_rls.sql).
4. Haz clic en **Run**.

### Reglas de seguridad aplicadas:
- **SuperAdmin**: Control total sobre todas las tablas, usuarios, pedidos y registros.
- **Repartidores**: Únicamente pueden consultar y gestionar los clientes y pedidos de su ruta asignada. Imposible consultar datos de otras rutas.
- **Clientes**: Únicamente pueden consultar su propio perfil y sus propios pedidos. No tienen visibilidad sobre otros clientes ni sobre datos internos.
- **Usuarios no autenticados**: Bloqueo 100% de lectura y escritura.

---

## 3. 🌐 Configuración Recomendada en Cloudflare

Para proteger el dominio contra descargas masivas, bots, scrapers y fraude:

### A. Cabeceras Web (`_headers`)
El archivo `_headers` ya está configurado con:
- **`X-Frame-Options: DENY`**: Impide que terceros incrusten la app en un iframe para clonarla.
- **`Content-Security-Policy (CSP)`**: Bloquea la inyección de scripts externos maliciosos.
- **`Strict-Transport-Security (HSTS)`**: Obliga a que toda la navegación sea por HTTPS seguro.

### B. Opciones a Activar en el Panel de Cloudflare:
1. **Security > Bots**: Activar **Bot Fight Mode** (bloquea herramientas automatizadas de scraping y clonación de código).
2. **Security > WAF > Rate Limiting**:
   - Crear una regla de límite de peticiones (ej. máx. 30 peticiones por minuto por IP en rutas de autenticación) para evitar ataques de fuerza bruta.
3. **SSL/TLS > Edge Certificates**: Activar **Always Use HTTPS** y **Automatic HTTPS Rewrites**.
4. **Scrape Shield**: Activar **Hotlink Protection** y **Email Address Obfuscation**.

---

## 4. 👥 Control de Registros y Prevención de Fraude

### Modo Demo:
- Cualquier usuario que entre por el enlace público verá la versión de demostración aislada.

### Modo Producción:
- **Registro restringido por invitación**: Solo los usuarios que cuenten con un token de invitación válido (generado por el SuperAdmin o Repartidor) pueden completar el registro.
- **Control y Suspensión**: En el panel de **SuperAdmin > Usuarios**, puedes activar, suspender o bloquear cualquier cuenta en tiempo real para revocar el acceso de inmediato si detectas un uso fraudulento.
