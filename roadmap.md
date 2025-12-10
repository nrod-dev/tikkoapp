Requerimientos Funcionales – Versión 1 (MVP Freelancers)
1. Autenticación y Gestión de Cuenta

Registro de Usuario

Vía email + contraseña o Google OAuth.

Inicio de Sesión

Magic Link por email o credenciales.

Onboarding Automático

Crear una Organización Personal por defecto.

El usuario queda asignado como “owner”.

Gestión de Sesión

Mantener sesión persistente.

Redirección automática según estado (login ↔ dashboard).

2. Gestión de Gastos (Tickets)
Visualización

Tabla con todos los tickets del usuario.

Columnas: Comercio, Fecha, Usuario, Importe, Estado, Adjunto.

Orden por creación (descendente).

Carga Manual (Nuevo Gasto)

Botón Nuevo Gasto.

Formulario con campos obligatorios:

Nombre del Comercio

Monto total

Fecha del gasto

Moneda (ej: ARS)

Edición

Abrir ticket desde la tabla.

Editar campos: Comercio, Monto, Fecha.

Estado del Gasto

Estado inicial: pending_review.

Mostrar estado mediante badges en la tabla.

3. Gestión de Comprobantes (Adjuntos)
Subida de Archivos

Permitir JPG, PNG, PDF.

Guardar en Supabase Storage.

Asociación

Enlazar automáticamente la URL del archivo al ticket.

Visualización

Previsualizar el archivo dentro del detalle del ticket.

Botón “Abrir archivo”.

Reemplazo

Posibilidad de cambiar el archivo subido.

4. Interfaz de Usuario (UI) y Navegación

Dashboard /rendiciones como vista principal.

Panel lateral (sheet) para alta/edición sin salir del listado.

Feedback al usuario:

Loaders (subida/guardado)

Alerts de éxito/error

Navegación simple

Menú lateral: Dashboard, Rendiciones, Configuración.

5. Reglas de Negocio y Seguridad

Propiedad de Datos

Usuarios solo ven/crean/editan sus propios tickets o los de su organización.

Validaciones

No permitir guardar sin monto o comercio.

Validar tipos de archivo.

Persistencia

Todos los registros deben guardarse en Supabase (DB + Storage).


Roadmap Evolutivo – Versión 2 (Plan Empresa)

Transformación del MVP a una solución multi-empresa con colaboradores, aprobaciones y automatización.

1. Gestión de Organización y Roles (Multi-tenant Real)
Organización Completa

Crear organizaciones con Nombre, CUIT y Logo.

Migrar datos del usuario si venía usando “Organización Personal”.

Sistema de Invitaciones

Admin invita colaboradores por email.

Flujo de aceptación.

Roles y Permisos

Roles: Admin, Aprobador, Colaborador.

Implementar RLS en Supabase según rol y organización.

2. Flujo de Aprobaciones
Bandeja de Aprobaciones

Vista para Admin/Aprobador.

Mostrar tickets de otros usuarios pendientes.

Acciones

Aprobar.

Rechazar + motivo obligatorio.

Notificaciones

Email/WhatsApp al colaborador con el resultado de la revisión.

3. Automatización vía WhatsApp (Bot)
Onboarding WhatsApp

Vincular número telefónico del colaborador a su usuario.

Ingesta Automática de Tickets

El usuario envía foto del ticket al WhatsApp de la empresa.

IA (Gemini) extrae datos → crea ticket con estado pending_review.

Interacción Conversacional

Bot confirma lectura:

“Leí un gasto de $5000 en Starbucks. ¿Es correcto? (SI/NO)”.

4. Integraciones y Finanzas
Centros de Costos

Asignar gastos a proyectos/departamentos.

Reportes Avanzados

Dashboard para el Admin:

Gastos por empleado

Por categoría

Por mes

Exportación Contable

Generar exportaciones compatibles con sistemas contables (ej: SIAP).

5. Monetización (SaaS B2B)

Pasarela de pagos: Stripe o Mercado Pago.

Planes de suscripción: por usuario, o por volumen de tickets.

Gestión de suscripción:

Ver facturas

Cambiar plan

Estado de suscripción