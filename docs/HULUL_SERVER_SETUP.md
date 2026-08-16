# Hulul POS server setup

Dominios:

- Frontend: `https://pos.hulul.com.mx`
- Backend: `https://posapi.hulul.com.mx`

Contenedor PostgreSQL:

- nombre: `hulul-postgres`
- red: `hulul-network`
- usuario: `backend`
- bases:
  - `backend_production`
  - `backend_production_cache`
  - `backend_production_queue`
  - `backend_production_cable`

Variables esperadas para backend:

```bash
RAILS_MASTER_KEY=<valor actual de backend/config/master.key>
BACKEND_DATABASE_PASSWORD=<tomar de /Users/osx/Documents/HULUL/hulul-pos-server.env>
DB_HOST=hulul-postgres
DB_PORT=5432
RAILS_ENV=production
RAILS_LOG_LEVEL=info
```

Variable esperada para frontend:

```bash
VITE_API_BASE_URL=https://posapi.hulul.com.mx
VITE_API_BASE_URL=https://posapi.hulul.com.mx
```
