import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExportBacklogDTO } from './dtos/ExportBacklogDTO';

@Injectable()
export class ExportsService {
  // Servicio que dispara el flujo de exportación en N8N
  // y delega la generación/envío de CSV por correo.
  constructor(private readonly config: ConfigService) {}

  async triggerExportBacklog(dto: ExportBacklogDTO) {
    // obtener URL del webhook de N8N desde configuración
    const webhook = this.config.get<string>('N8N_EXPORT_WEBHOOK_URL');

    // base URL del backend (se pasa a N8N para que pueda llamar al API si hace falta)
    const backendBaseUrl = this.config.get<string>('BACKEND_BASE_URL');

    const payload = {
      email: dto.email,
      fields: dto.fields,
      backendBaseUrl,
      columnId: dto.columnId,
      columnName: dto.columnName || 'Backlog',
      requestedAt: new Date().toISOString(),
    };

    // payload mínimo que N8N usará para obtener datos, construir CSV y enviar email

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);

    if (!webhook) {
      throw new Error(
        'N8N_EXPORT_WEBHOOK_URL is not defined in the configuration.',
      );
    }

    // llamar al webhook de N8N y esperar respuesta (con timeout)
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .catch((err) => {
        // manejar timeout y otros errores de fetch
        if (err.name === 'AbortError') {
          throw new Error('Request to n8n webhook timed out');
        }
        throw err;
      })
      .finally(() => clearTimeout(t));

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `Failed to trigger export workflow. Status: ${res.status}, Response: ${text}`,
      );
    }
  }
}
