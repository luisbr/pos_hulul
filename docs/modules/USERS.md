# Modulo Usuarios

## Objetivo

Administrar usuarios operativos del negocio y dejar visible quien realiza acciones clave.

## Alcance Actual

Incluido:

- Listado de usuarios por negocio.
- Alta de usuario con email, nombre, password inicial y rol.
- Asociacion de usuario existente a un negocio por email.
- Edicion de nombre, email, rol y estado de membresia.
- Roles iniciales:
  - `owner`
  - `manager`
  - `cashier`
  - `warehouse`
  - `hulul_admin`
  - `hulul_support`

No incluido todavia:

- Invitaciones por email.
- Reseteo formal de password.
- PIN rapido de cajero.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/users`
- `POST /api/portal/businesses/:business_id/users`
- `PATCH /api/portal/businesses/:business_id/users/:id`

Tablas:

- `users`
- `memberships`

## Trazabilidad Disponible

Ya se puede identificar usuario en operaciones principales:

- Venta: `sales.cashier_id`.
- Pago: `payments.created_by_id`.
- Movimiento de inventario: `inventory_movements.created_by_id`.
- Apertura/cierre de caja: `cash_register_sessions.opened_by_id` y `closed_by_id`.
- Movimiento de caja: `cash_movements.created_by_id`.
- Cancelacion de venta: `sales.cancelled_by_id` y `cancellation_reason`.
- Compra: `purchases.created_by_id`.
- Cancelacion de compra: `purchases.cancelled_by_id` y `cancellation_reason`.

## Auditoria

La trazabilidad operativa responde quien hizo ventas, pagos, caja, inventario y cancelaciones. La bitacora `audit_events` ya registra cambios administrativos iniciales: usuarios, roles, productos, catalogos, clientes, proveedores, configuracion, estado de empresa y acciones sensibles. Falta enriquecerla con filtros avanzados y detalle anterior/nuevo por campo.

## Regla Multiempresa

- Un usuario puede estar en varias empresas mediante `memberships`.
- El frontend puede cambiar empresa activa usando los negocios devueltos por login.
- El backend valida cada request del portal contra la membresia activa del usuario autenticado.
- Las acciones operativas usan el usuario autenticado como responsable, aunque el cliente envie otro `created_by_id`, `cashier_id`, `opened_by_id`, `closed_by_id` o `cancelled_by_id`.
- Si la empresa esta `suspended` o `cancelled`, el portal permite consultas pero bloquea operaciones de escritura.
- Admin Hulul usa roles internos separados: `hulul_admin` y `hulul_support`.

## Permisos Por Rol

Matriz base:

- `owner`: administra configuracion, usuarios, catalogos, productos, clientes, proveedores, ventas, cancelaciones, caja, inventario y compras.
- `manager`: administra operacion completa, excepto usuarios.
- `cashier`: cobra ventas, abre caja y administra clientes.
- `warehouse`: administra catalogos, productos, inventario, proveedores y compras.
- `hulul_admin`: acceso operativo completo para administracion interna.
- `hulul_support`: acceso operativo completo excepto administracion de usuarios.

Acciones protegidas en backend:

- Editar configuracion.
- Crear o editar usuarios.
- Crear o editar catalogos.
- Crear, editar o importar productos.
- Crear o editar clientes.
- Crear o editar proveedores.
- Cobrar ventas.
- Cancelar ventas.
- Abrir caja.
- Cerrar o forzar cierre de caja.
- Registrar movimientos manuales de caja.
- Ajustar inventario.
- Registrar compras.
- Anular compras.

## Pendiente Multiempresa + Usuarios Por Empresa

- Selector de empresa activa cuando el login devuelve mas de una empresa. Estado: completado.
- Guardar la empresa activa elegida en frontend y usarla para cargar contexto, ventas, caja, inventario, compras, clientes, proveedores y usuarios. Estado: completado.
- Permitir administrar membresias por empresa desde el modulo Usuarios sin afectar el acceso del mismo usuario a otras empresas.
- Revisar la matriz despues de uso real para separar permisos mas finos si hace falta.
- Bloquear operacion si la empresa esta suspendida o cancelada. Estado: completado.
- Proteger el Admin Hulul con roles internos (`hulul_admin`, `hulul_support`) y reglas separadas del portal cliente. Estado: completado.
- Crear pantalla Admin Hulul para que `hulul_admin` active o suspenda empresas desde UI. Estado: completado.
- Dejar pagos por empresa para el final: cada empresa puede tener monto/plan distinto y el admin puede activar manualmente mientras no exista automatizacion de cobro.
- Agregar bitacora general de auditoria para cambios administrativos: altas, ediciones, activaciones, desactivaciones, precios, roles y configuracion. Estado: base completada.
- Agregar pruebas de aislamiento entre empresas para cada modulo operativo.

Criterios pendientes:

- Un usuario con dos empresas puede operar cada una sin mezclar productos, ventas, caja ni inventario.
- Cambiar rol o desactivar membresia en Empresa A no cambia su acceso a Empresa B.
- Un usuario sin membresia activa recibe `403` al intentar usar endpoints de otra empresa.
- Los registros operativos guardan el usuario autenticado como responsable.

## Criterios de Aceptacion

- Un negocio puede crear usuarios sin usar seeds.
- Un usuario queda ligado al negocio con un rol.
- El listado muestra nombre, email, rol y estado.
- Las ventas e historial siguen mostrando cajero y usuario de cancelacion.
