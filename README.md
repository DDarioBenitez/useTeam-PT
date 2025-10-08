# useTeam-PT

Aplicación de tablero Kanban colaborativo en tiempo real (prueba técnica).

Este repositorio contiene:

-   `backend/` — API en NestJS con soporte WebSockets (Socket.IO) y endpoints para exportación.
-   `frontend/` — cliente React + Vite con UI de tablero y botón para exportar backlog.
-   `n8n/` — carpeta con ejemplo de workflow `workflow.json` y `setup-instructions.md` para automatizar la exportación a CSV y envío por email.
-   `docker-compose.yml` y `README_DEV.md` — opciones para levantar todo en modo desarrollo.

Nota para desarrolladores: para instrucciones más detalladas de desarrollo y despliegue (replica-set de MongoDB, variables de entorno, comandos Docker y pasos de debugging), consulte `README_DEV.md` en la raíz del repositorio.

## Contenidos

-   Instalación y ejecución
-   Cómo probar la exportación de Backlog
-   Configuración y variables de entorno
-   n8n (workflow)
-   Credenciales de prueba (Ethereal)

## Resumen rápido (qué hace la app)

-   Gestión de columnas y tareas en un tablero Kanban.
-   Sincronización en tiempo real mediante WebSockets (namespace `/boards`).
-   Exportación de backlog vía flujo automatizado en n8n: CSV adjunto por email y notificación al frontend por websocket.

Requisitos

-   Node.js 20+ (para desarrollo local)
-   Docker & Docker Compose (opcional, recomendado para el examinador)
-   n8n (opcional si usas Docker Compose ya incluido)

## Instalación y ejecución

Opción A — Usar Docker Compose (recomendado)

1. Desde la raíz del repositorio:

```bash
docker compose up --build
```

Esto levantará:

-   MongoDB (replica-set, para soportar transacciones)
-   Backend (http://localhost:3000)
-   Frontend (http://localhost:5173)
-   n8n (http://localhost:5678)

Notas:

-   Si deseas usar un Mongo externo, exporta `MONGODB_URI` antes de ejecutar el comando:

```bash
export MONGODB_URI="mongodb://mi-host:27017/kanban-board"
docker compose up --build
```

Opción B — Ejecutar manualmente (sin Docker)

1. MongoDB (replica-set necesario para transacciones):

```bash
# iniciar mongod (ajusta paths según tu sistema)
mongod --dbpath /path/to/db --replSet rs0 --bind_ip localhost

# desde otra terminal inicializar el replSet:
mongosh --eval 'rs.initiate()'
```

2. Backend:

```bash
cd backend
npm install
npm run start:dev
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

4. n8n (opcional si no usas Docker):

```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n:latest
```

Cómo probar la exportación de Backlog

1. En la UI del tablero, haz clic en el botón Exportar (icono en el header).
2. Ingresa un email válido en el modal y confirma.
3. El frontend enviará la solicitud al backend: `POST /export/backlog`.
4. El backend llamará al webhook de n8n (configurado por `N8N_EXPORT_WEBHOOK_URL`).
5. n8n extraerá columnas y tareas, generará un CSV, enviará el email y hará POST a `/export/notify`.
6. El backend emitirá un evento websocket (`EVENTS.NOTIFICATION`) que el frontend escucha para mostrar el toast de éxito.

Comprobación rápida (sin UI)

Si quieres probar el flujo sin usar la interfaz, puedes usar curl para disparar la exportación directamente al backend (ejemplo):

```bash
export BACKEND_URL=http://localhost:3000
curl -X POST "$BACKEND_URL/export/backlog" \
	-H 'Content-Type: application/json' \
	-d '{"email":"tu@ejemplo.com","backendBaseUrl":"http://localhost:3000"}'
```

Esto enviará la petición que normalmente hace el frontend; si todo está configurado (n8n webhook, n8n workflow importado y backend accesible), recibirás el email de prueba y la notificación websocket.

## Configuración y variables de entorno

Consulta `.env.example` para las variables mínimas. Importantes:

-   `MONGODB_URI` — URI de conexión a MongoDB
-   `PORT` — puerto del backend (por defecto 3000)
-   `N8N_EXPORT_WEBHOOK_URL` — URL del webhook en n8n que dispara el workflow
-   `VITE_API_URL` / `VITE_WS_URL` — configuraciones del frontend (Vite)

## n8n (workflow)

Importa `n8n/workflow.json` en la UI de n8n (o sigue `n8n/setup-instructions.md`). El workflow usa los endpoints:

-   `{{$json.body.backendBaseUrl}}/columns` — para obtener columnas
-   `{{($node["Entrada"].json.body?.backendBaseUrl) + '/tasks/all'}}` — para obtener tareas
-   `{{$node["Entrada"].json.body?.email}}` — para enviar el correo
-   `{{($node["Entrada"].json.body?.backendBaseUrl) + '/export/notify'}}` — para notificar al backend

Nota rápida sobre cómo obtener la URL del webhook en n8n

1. En la UI de n8n crea un nuevo workflow.
2. Añade un nodo `Webhook` (tipo `POST`) y pide que guarde el workflow.
3. En la sección del nodo Webhook copia la `Webhook URL` que n8n muestra (algo como `http://localhost:5678/webhook/xxxx`).
4. Usa esa URL como valor para la variable `N8N_EXPORT_WEBHOOK_URL` en tu entorno o en la configuración de Docker.

También puedes importar directamente `n8n/workflow.json` desde la UI (Import → seleccionar archivo) y activar el workflow.

Credenciales para pruebas de email (Ethereal)

Para pruebas se puede usar Ethereal (https://ethereal.email). Ejemplo proporcionado en `n8n/setup-instructions.md`:

-   Host: smtp.ethereal.email
-   Port: 587
-   Security: STARTTLS
-   Username: chester.schneider15@ethereal.email
-   Password: FwNa1dEQAkUaQuJVbs

Nota: las cuentas de Ethereal son temporales; usa "Open mailbox" en la web para ver los mensajes.

Seguridad y buenas prácticas

-   Las credenciales mostradas son de ejemplo para pruebas; no las uses en producción.
-   Añade `/.env` a `.gitignore` (si no está) y nunca comites valores reales de producción.
-   `N8N_EXPORT_WEBHOOK_URL` es sensible (permite disparar el workflow). Si el entorno es público, considera proteger este webhook (token simple, IP whitelist o firewall).

Archivos importantes

-   `backend/src/export` — controlador y servicio que disparan N8N (`export.controller.ts`, `export.service.ts`).
-   `backend/src/ws/ws.gateway.ts` — gateway Socket.IO que emite `EVENTS.NOTIFICATION`.
-   `frontend/src/features/board/components/header/Header.tsx` — botón/UX de exportación.
-   `n8n/workflow.json` — ejemplo de workflow para importación en n8n.
