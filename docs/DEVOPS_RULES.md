# Reglas DevOps Hulul POS

## 1. Ambientes

- `local`: desarrollo diario.
- `staging`: validacion previa a produccion.
- `production`: uso real del negocio.

No se trabaja directo en `production`.

## 2. Git

- Rama principal: `main`.
- Todo cambio entra con commit claro y pequeño.
- Antes de hacer push:
  - frontend: `npm run lint` y `npm run build`
  - backend: `bin/rails test`
- No hacer force push sobre `main`.

## 3. Base de datos

- La base actual es `PostgreSQL`.
- Todo cambio estructural va por migracion Rails.
- Nunca editar `schema.rb` manualmente.
- Toda migracion nueva debe probarse en:
  - desarrollo
  - test
  - staging antes de produccion

## 4. Deploy

- Orden de deploy:
  1. respaldar base
  2. actualizar codigo
  3. instalar dependencias
  4. correr migraciones
  5. compilar frontend
  6. reiniciar servicios
  7. validar login, ventas, compras y caja

- Si falla migracion o boot, se detiene el release.

## 5. Validacion minima post deploy

- login con usuario operativo
- carga de contexto de empresa
- apertura de caja
- venta de prueba
- compra de prueba
- cancelacion de venta
- cancelacion de compra con validacion de stock
- impresion de ticket

## 6. Seguridad

- no subir secretos al repo
- credenciales solo por variables de entorno
- separar credenciales por ambiente
- acceso SSH solo a usuarios autorizados
- backups cifrados si salen del servidor

## 7. Operacion

- logs de app y servidor deben conservarse
- cada deploy debe quedar registrado con:
  - fecha
  - commit
  - responsable
  - resultado

## 8. Regla de negocio para cambios delicados

- cancelacion de ventas y compras no se modifica manualmente en base
- cualquier correccion debe pasar por flujo de aplicacion o script auditado
- no se hacen fixes directos en produccion sin dejar bitacora
