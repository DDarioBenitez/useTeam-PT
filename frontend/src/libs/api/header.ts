import { VITE } from "../env";

export async function exportBacklog({ email }: { email: string }) {
    try {
        // Enviar la petición al backend, que será el responsable de disparar N8N
        const apiBase = VITE.API_URL ?? "http://localhost:3000";
        const response = await fetch(apiBase + "/export/backlog", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                fields: ["_id", "title", "description", "column", "createdAt"],
                columnName: "Backlog",
            }),
        });

        if (!response.ok) {
            // Intentar leer JSON de error, si existe
            let errorMsg = "Failed to export backlog";
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch {
                // ignore
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error("Error exporting backlog:", error);
        throw error;
    }
}
