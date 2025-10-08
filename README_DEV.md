# Instrucciones de desarrollo — useTeam-PT

Este archivo explica cómo levantar el entorno de desarrollo y cómo usar Docker (opcional).

## Opción A — Usar Docker Compose (recomendado para el examinador)

Levantará:

-   MongoDB en modo replica-set (necesario para transacciones)
-   Backend en modo `start:dev` (hot-reload)
-   Frontend en modo Vite dev
-   n8n (UI)

Comando:

```bash
docker compose up --build
```

Notas:

-   Si prefieres usar un MongoDB externo (por ejemplo ya tienes uno local o en la nube), exporta la variable `MONGODB_URI` antes de ejecutar `docker compose up`:

```bash
export MONGODB_URI="mongodb://mi-host:27017/kanban-board"
docker compose up --build
```

El backend por defecto apunta a `mongodb://mongodb:27017/kanban-board` dentro de la red de Docker.

## Opción B — Ejecutar manualmente (sin Docker)

1. Levanta MongoDB en modo replica-set para soportar transacciones. Ejemplo mínimo:

```bash
# iniciar mongod (ajusta paths según tu sistema)
mongod --dbpath /path/to/db --replSet rs0 --bind_ip localhost

# desde otra terminal inicializar el replSet:
mongosh --eval 'rs.initiate()'
```

2. Levanta backend:

```bash
cd backend
npm install
npm run start:dev
```

3. Levanta frontend:

```bash
cd frontend
npm install
npm run dev
```

4. Levanta n8n si lo necesitas (opcional):

```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n:latest
```

## Testing rápido

-   Importa `n8n/workflow.json` en n8n.
-   Usa el payload de ejemplo en `n8n/setup-instructions.md` para disparar el webhook.

## Debug rápido

Si algo falla, estos comandos ayudan a identificar problemas comunes:

-   Ver logs del backend (dentro del contenedor Docker):

```bash
docker compose logs -f backend
```

-   Ver logs del frontend (contenedor):

```bash
docker compose logs -f frontend
```

-   Comprobar el estado del replica-set de MongoDB (si estás usando `mongosh` localmente):

```bash
mongosh --eval 'rs.status()'
```

-   Probar la exportación con curl (sin UI):

```bash
export BACKEND_URL=http://localhost:3000
curl -X POST "$BACKEND_URL/export/backlog" \
	-H 'Content-Type: application/json' \
	-d '{"email":"tu@ejemplo.com","backendBaseUrl":"http://localhost:3000"}'
```

Estos pasos te ayudarán a localizar si el problema está en el backend, en n8n o en la conexión a MongoDB.

**_ Fin _**
