import { VITE } from "../env";

export async function exportBacklog({ email }: { email: string }) {
    try {
        const webhookBase = VITE.N8N_WEBHOOK_URL ?? "";
        const response = await fetch(webhookBase + "/export-backlog", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                fields: ["_id", "title", "description", "column", "createdAt"],
                columnName: "Backlog",
                backendBaseUrl: VITE.BACKEND_BASE_URL ?? "http://localhost:3000",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to export backlog");
        }
    } catch (error) {
        console.error("Error exporting backlog:", error);
        throw error;
    }
}
