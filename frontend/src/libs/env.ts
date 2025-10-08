// Small helper to access Vite import.meta.env without using `any`
export const env: Record<string, string | undefined> = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const VITE = {
    API_URL: env.VITE_API_URL ?? undefined,
    BACKEND_BASE_URL: env.VITE_BACKEND_BASE_URL ?? undefined,
    N8N_WEBHOOK_URL: env.VITE_N8N_WEBHOOK_URL ?? undefined,
    WS_URL: env.VITE_WS_URL ?? undefined,
};
