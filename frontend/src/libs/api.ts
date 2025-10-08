export type FetchMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

/** Base de la API (solo Vite) */
import { VITE } from "./env";
export const apiurl: string = VITE.API_URL ?? "http://localhost:3000";

export async function fetcher<T = unknown>(
    url: string,
    method: FetchMethod = "GET",
    body?: unknown,
    headers: Record<string, string> = {},
    signal?: AbortSignal
): Promise<T> {
    const baseUrl = apiurl + url;
    const res = await fetch(baseUrl, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
    });
    if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `Error ${res.status} (${res.statusText})`;
        try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.message) {
                errorMessage += `: ${errorJson.message}`;
            }
        } catch {
            if (errorBody) {
                errorMessage += `: ${errorBody}`;
            }
        }
        throw new Error(errorMessage);
    }
    return res.json() as Promise<T>;
}
