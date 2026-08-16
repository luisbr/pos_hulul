# Hulul POS Ferretero

MVP web para POS ferretero con backend Ruby on Rails API, PostgreSQL y frontend React + Vite.

## Estructura

```txt
backend/   Rails API
frontend/  React + Vite
docs/      arquitectura, modelo de datos y backlog
```

## Decisiones cerradas

- Producto inicial: POS ferretero.
- Etapa 1: 100% web en nube.
- Etapa 2: local instalable + sync.
- Backend: Rails API.
- Frontend: React + Vite.
- Base de datos: PostgreSQL.
- Multi-tenant desde el dia 1.
- Precios con IVA incluido.
- Importacion Excel en MVP.

## Correr frontend

```bash
cd frontend
npm run dev
```

## Correr backend

```bash
cd backend
RBENV_VERSION=3.4.5 bin/rails db:create
RBENV_VERSION=3.4.5 bin/rails server
```

## Documentos tecnicos

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/MVP_BACKLOG.md`
