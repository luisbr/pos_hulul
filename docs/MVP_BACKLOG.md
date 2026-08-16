# Hulul POS Ferretero - Backlog MVP

## Fase 0 - Base tecnica y visual

Objetivo: dejar el producto navegable con identidad Hulul, login, estructura multi-tenant y base lista para construir modulos.

- Crear monorepo `backend/`, `frontend/`, `docs/`.
- Crear Rails API con PostgreSQL.
- Crear React + Vite.
- Configurar estilos base con paleta Hulul.
- Crear layout autenticado: sidebar, header, contenido principal.
- Crear login.
- Crear mocks centralizados para negocio, sucursal y usuario.
- Crear Admin Hulul basico.
- Crear Portal Cliente basico.
- Crear seeds de demo para Ferreteria El Tornillo.

Criterios de aceptacion:

- La app abre login.
- Un usuario puede entrar al Admin Hulul.
- Desde Admin Hulul se ve Ferreteria El Tornillo.
- Se puede entrar al portal operativo del negocio.
- La UI respeta brandbook Hulul.

## Fase 1 - Operacion minima POS

Objetivo: permitir venta real simple con caja abierta.

- Crear negocios y sucursales.
- Crear usuarios, roles y membresias.
- Crear cajas.
- Abrir caja.
- Crear categorias, marcas y unidades.
- Crear productos.
- Buscar producto por nombre, SKU o codigo de barras.
- Crear ticket de venta.
- Agregar, quitar y modificar cantidades.
- Cobrar con efectivo.
- Cobrar con tarjeta.
- Cobrar con transferencia.
- Cobro mixto.
- Imprimir ticket desde navegador.
- Cerrar caja.

Criterios de aceptacion:

- No se puede vender sin caja abierta.
- Venta pagada genera pago.
- Pago en efectivo calcula cambio.
- Venta descuenta inventario.
- Todo movimiento de caja queda auditado.
- La venta no se borra.

## Fase 2 - Inventario, clientes y credito

Objetivo: completar operacion ferretera diaria.

- Registrar clientes.
- Configurar limite y dias de credito.
- Vender a credito.
- Registrar abonos.
- Bloquear cliente por saldo vencido o limite excedido.
- Registrar entradas de inventario.
- Registrar ajustes positivos.
- Registrar ajustes negativos.
- Registrar merma.
- Ver historial de movimientos por producto.

Criterios de aceptacion:

- Venta a credito requiere cliente.
- Credito genera movimiento y saldo.
- Abono efectivo impacta caja.
- Inventario solo cambia por movimientos.
- Ajuste negativo requiere motivo y permiso.

## Fase 3 - Compras y proveedores

Objetivo: controlar proveedores, ordenes y recepcion de mercancia.

- Crear proveedores.
- Asociar proveedor principal a producto.
- Crear orden de compra.
- Editar borrador.
- Marcar orden como solicitada.
- Recibir parcial.
- Recibir completa.
- Actualizar costo actual del producto al recibir.
- Generar movimiento de inventario por recepcion.

Criterios de aceptacion:

- Orden recibida aumenta inventario.
- Recepcion parcial conserva pendiente.
- Proveedor con compras no se borra; se desactiva.

## Fase 4 - Importacion Excel

Objetivo: permitir arranque rapido de ferreterias reales.

- Descargar plantilla.
- Subir archivo Excel.
- Validar columnas requeridas.
- Validar SKU unico por negocio.
- Validar precios, costos, unidades y categorias.
- Mostrar preview.
- Mostrar errores por fila.
- Descargar errores.
- Confirmar importacion.
- Crear productos, catalogos y stock inicial.

Criterios de aceptacion:

- No se importa si hay errores criticos.
- El usuario puede corregir usando reporte de errores.
- La importacion crea movimientos de stock inicial.

## Fase 5 - Permisos y reportes basicos

Objetivo: proteger operaciones sensibles y dar visibilidad minima.

- Implementar permisos backend.
- Permisos para descuento.
- Permisos para cambio de precio.
- Permisos para cancelar venta.
- Permisos para ajuste de inventario.
- Permisos para cierre de caja.
- Reporte de ventas del dia.
- Reporte por metodo de pago.
- Reporte de productos mas vendidos.
- Reporte de stock bajo.
- Reporte de creditos vencidos.
- Exportacion CSV simple.

Criterios de aceptacion:

- Las acciones sensibles fallan desde API si el usuario no tiene permiso.
- Reportes basicos cargan por fecha.
- Mobile muestra tarjetas resumen en lugar de tablas pesadas.

## Fase 6 - Preparacion sync etapa 2

Objetivo: dejar trazabilidad para futuro modo local.

- Agregar `sync_events`.
- Generar eventos en ventas.
- Generar eventos en pagos.
- Generar eventos en caja.
- Generar eventos en inventario.
- Generar eventos en productos.
- Generar eventos en clientes.
- Agregar `idempotency_key` en operaciones criticas.
- Documentar payloads de eventos.

Criterios de aceptacion:

- Cada operacion critica genera evento.
- Eventos tienen UUID, tipo, entidad, payload y estado.
- Reintentar una operacion con la misma idempotency key no duplica venta/pago.

## Fuera de alcance MVP

- CFDI real.
- Timbrado SAT/PAC.
- Carta Porte.
- Terminal bancaria integrada.
- WhatsApp automatico.
- App movil nativa.
- BI avanzado.
- Multi-sucursal avanzada con traspasos.
- Modo local instalable.
- Sync bidireccional activo.
- Impresion directa ESC/POS.
