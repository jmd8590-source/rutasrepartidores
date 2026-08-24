-- ============================================================
--  POLLOS FRESCOS — ESQUEMA COMPLETO Y POLÍTICAS RLS (SUPABASE)
--  Control de Acceso Estricto y Prevención de Uso Fraudulento
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'repartidor', 'cliente')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pendiente_aprobacion', 'suspendido', 'bloqueado')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    consentimiento_rgpd BOOLEAN DEFAULT TRUE,
    consentimiento_fecha TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABLA: rutas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    zona TEXT NOT NULL,
    dias_semana TEXT[] NOT NULL DEFAULT ARRAY['Lunes', 'Miércoles', 'Viernes'],
    hora_limite_pedido TEXT NOT NULL DEFAULT '19:00',
    repartidor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABLA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre_negocio TEXT NOT NULL,
    cif_nif TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    coordenadas JSONB,
    ruta_id UUID REFERENCES public.rutas(id) ON DELETE SET NULL,
    orden_en_ruta INTEGER DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pendiente_aprobacion', 'inactivo', 'bloqueado')),
    observaciones_entrega TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABLA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    icono TEXT DEFAULT '📦',
    orden INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 5. TABLA: productos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    precio_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unidad_venta TEXT NOT NULL DEFAULT 'kg' CHECK (unidad_venta IN ('kg', 'unidad', 'caja', 'bandeja')),
    descripcion TEXT,
    imagen TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABLA: disponibilidad (por ruta y fecha)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disponibilidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    precio NUMERIC(10,2) NOT NULL,
    cantidad_disponible INTEGER,
    limite_por_cliente INTEGER,
    UNIQUE(ruta_id, producto_id, fecha)
);

-- ============================================================
-- 7. TABLA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    ruta_id UUID NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'en_preparacion', 'preparado', 'en_reparto', 'entregado', 'cancelado', 'incidencia')),
    lineas JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observaciones TEXT,
    historial_estados JSONB NOT NULL DEFAULT '[]'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TABLA: invitaciones (códigos de registro)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    ruta_id UUID NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,
    creado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    usada BOOLEAN DEFAULT FALSE,
    usada_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    usada_en TIMESTAMPTZ,
    expira_en TIMESTAMPTZ NOT NULL,
    creada_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TABLA: audit_logs (registro inmutable de acciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT,
    detalles JSONB,
    ip_address TEXT,
    user_agent TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) — ACTIVACIÓN
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLÍTICAS RLS DE SEGURIDAD ESTRICTA
-- ============================================================

-- Helper para obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
    SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- --- USUARIOS ---
CREATE POLICY "Superadmin control total usuarios"
ON public.usuarios FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Usuarios ven su propio perfil"
ON public.usuarios FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Usuarios editan su propio perfil básico"
ON public.usuarios FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND rol = (SELECT rol FROM public.usuarios WHERE id = auth.uid()));

-- --- RUTAS ---
CREATE POLICY "Superadmin control total rutas"
ON public.rutas FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Repartidores ven sus rutas asignadas"
ON public.rutas FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'repartidor' AND repartidor_id = auth.uid());

CREATE POLICY "Clientes ven la ruta a la que pertenecen"
ON public.rutas FOR SELECT
TO authenticated
USING (id IN (SELECT ruta_id FROM public.clientes WHERE usuario_id = auth.uid()));

-- --- CLIENTES ---
CREATE POLICY "Superadmin control total clientes"
ON public.clientes FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Repartidor ve clientes de su ruta"
ON public.clientes FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'repartidor' AND ruta_id IN (SELECT id FROM public.rutas WHERE repartidor_id = auth.uid()));

CREATE POLICY "Cliente ve y edita su propio registro de cliente"
ON public.clientes FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- --- PRODUCTOS Y CATEGORÍAS ---
CREATE POLICY "Lectura publica autenticada de productos y categorias"
ON public.productos FOR SELECT
TO authenticated
USING (activo = TRUE OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Superadmin gestion productos"
ON public.productos FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Lectura categorias"
ON public.categorias FOR SELECT
TO authenticated
USING (activa = TRUE OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Superadmin gestion categorias"
ON public.categorias FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

-- --- PEDIDOS ---
CREATE POLICY "Superadmin control total pedidos"
ON public.pedidos FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Repartidores ven y actualizan pedidos de su ruta"
ON public.pedidos FOR ALL
TO authenticated
USING (ruta_id IN (SELECT id FROM public.rutas WHERE repartidor_id = auth.uid()))
WITH CHECK (ruta_id IN (SELECT id FROM public.rutas WHERE repartidor_id = auth.uid()));

CREATE POLICY "Clientes gestionan sus propios pedidos"
ON public.pedidos FOR ALL
TO authenticated
USING (cliente_id IN (SELECT id FROM public.clientes WHERE usuario_id = auth.uid()))
WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE usuario_id = auth.uid()));

-- --- INVITACIONES ---
CREATE POLICY "Superadmin gestion invitaciones"
ON public.invitaciones FOR ALL
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Repartidor crea y ve invitaciones de su ruta"
ON public.invitaciones FOR ALL
TO authenticated
USING (ruta_id IN (SELECT id FROM public.rutas WHERE repartidor_id = auth.uid()))
WITH CHECK (ruta_id IN (SELECT id FROM public.rutas WHERE repartidor_id = auth.uid()));

-- --- AUDIT LOGS ---
CREATE POLICY "Solo superadmin consulta audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Cualquier usuario autenticado puede insertar logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid() OR usuario_id IS NULL);
