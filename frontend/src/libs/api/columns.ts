import { fetcher } from "../api";

export async function fetchColumns() {
    return await fetcher("/columns");
}

// DTO used when creating a column from the client
export type CreateColumnDTO = { title: string; color: string; opId?: string; clientTs?: number };
export async function createColumn(dto: CreateColumnDTO) {
    return await fetcher("/columns", "POST", dto);
}

export async function moveColumn(dto: { columnId: string; toIndex: number; opId?: string; clientTs?: number }) {
    return await fetcher("/columns/move", "PATCH", dto);
}

export async function deleteColumn(id: string) {
    return await fetcher(`/columns/${id}`, "DELETE");
}
