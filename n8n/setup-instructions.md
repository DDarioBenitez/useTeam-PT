# Instrucciones para n8n (exportación de backlog)

Este documento explica cómo importar y ejecutar el `workflow.json` provisto en una instancia local de n8n.

## Requisitos

-   n8n (docker o instalación local). Ejecución rápida con Docker:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```

## Importar el workflow

1. Abre la UI de n8n en http://localhost:5678
2. Haz clic en "Import" (arriba a la derecha)
3. Pega el JSON de `n8n/workflow.json` o selecciona "Import from file" y súbelo
4. Guarda el workflow

## Configuración esperada

-   El webhook de entrada (nodo `Entrada`) espera que el body incluya al menos los campos `backendBaseUrl` y `email`. Si no se proveen, el workflow usará `http://localhost:3000` por defecto.
-   Endpoints que debe exponer el backend:
    -   GET `${BACKEND_BASE_URL}/columns` → lista de columnas (cada columna con `_id` y `name`).
    -   GET `${BACKEND_BASE_URL}/tasks/all` → lista de tareas (cada tarea con campo `column` que referencia la columna).
    -   POST `${BACKEND_BASE_URL}/export/notify` → endpoint para notificar finalización (n8n hará POST aquí al terminar).

## Ajustes del workflow

-   El nodo `Set Columns Map` guarda el mapeo de columnas devuelto por `${BACKEND_BASE_URL}/columns`.
-   El nodo `Get Tasks` consulta `${BACKEND_BASE_URL}/tasks/all`.
-   El nodo `Map Tasks` debe producir objetos con: `_id`, `title`, `description`, `column` (nombre o id) y `createdAt`.
-   El nodo `Send Email` toma la dirección desde `{{$node["Entrada"].json.body?.email}}` y adjunta el CSV.

## Payload de ejemplo

Usa este JSON como body cuando llames al webhook de n8n (o cuando el backend llame al webhook):

```json
{
    "backendBaseUrl": "http://localhost:3000",
    "email": "tu@correo.com",
    "fields": ["_id", "title", "description", "column", "createdAt"],
    "columnName": "Backlog",
    "requestedAt": "2025-10-08T00:00:00.000Z"
}
```

## Credenciales de ejemplo para Send Email (Ethereal)

Para pruebas se usó Ethereal (https://ethereal.email). Puedes usar estas credenciales temporales para revisar que los emails se envían correctamente (nota: las cuentas de Ethereal expiran 48 horas desde el último uso):

-   Host: smtp.ethereal.email
-   Port: 587
-   Security: STARTTLS
-   Username: chester.schneider15@ethereal.email
-   Password: FwNa1dEQAkUaQuJVbs

Instrucciones rápidas: después de crear la cuenta en Ethereal, haz clic en "Open mailbox" en la web para ver los mensajes recibidos en esa cuenta.

## Pruebas

1. Levanta backend y frontend.
2. Importa `n8n/workflow.json` en n8n y habilita el workflow.
3. Desde frontend, solicita la exportación (botón Exportar). Si tu frontend llama al backend, el backend hará POST al webhook de n8n usando el payload de ejemplo.
4. Observa la ejecución en n8n, confirma que el nodo `Send Email` ejecutó correctamente y revisa el buzón de Ethereal.
5. Comprueba que n8n hizo POST a `${BACKEND_BASE_URL}/export/notify` y que el backend emitió la notificación por websocket.

## Notas finales

-   Ajusta las funciones y el mapeo si tus modelos de datos usan otros nombres de campo.
-   Para producción reemplaza Ethereal por un SMTP real y añade controles de seguridad según sea necesario.

# n8n setup instructions for useTeam-PT export workflow

This document explains how to import and run the provided `workflow.json` in a local n8n instance.

## Requirements

-   n8n (docker or local install). Example quick run:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```

## Importing the workflow

1. Open n8n UI at http://localhost:5678
2. Click the "Import" button (top right)
3. Paste the JSON from `n8n/workflow.json` or click "Import from file" and select it
4. Save the workflow

## Configure environment & credentials

-   The workflow expects that the incoming webhook payload includes `backendBaseUrl` and `email` fields. If not provided, defaults to `http://localhost:3000`.
-   Ensure the backend API endpoints exist:
    -   GET `${BACKEND_BASE_URL}/column` -- returns list of columns (array with `_id` and `name` fields)
    -   GET `${BACKEND_BASE_URL}/task` -- returns list of tasks with `column` field referencing column id
    -   POST `${BACKEND_BASE_URL}/export/notify` -- accept notification request (used to signal completion)

## Security

-   It's recommended to protect the webhook with a header token or similar. You can configure n8n to require a header and the backend to include it when calling the webhook.

## Adjustments

-   The CSV generation node expects an incoming array of task objects with fields: `_id`, `title`, `description`, `column`, `createdAt`.
-   Edit the `Map Tasks` function if your task or column fields differ.

## Testing

1. Start backend and frontend.
2. From frontend, trigger export (after we change frontend to call backend's `/export/backlog`).
3. Monitor n8n execution in the UI and check email.
4. Verify that backend receives POST to `/export/notify` and emits websocket notification.
