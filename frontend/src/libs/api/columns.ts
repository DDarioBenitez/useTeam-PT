import type { ColumnModel } from "../../types/types";
import { fetcher } from "../api";

export async function fetchColumns() {
    return await fetcher("/columns");
}

export async function createColumn(dto: ColumnModel) {
    return await fetcher("/columns", "POST", dto);
}

export async function moveColumn(dto: { columnId: string; toIndex: number }) {
    return await fetcher("/columns/move", "PATCH", dto);
}

export async function deleteColumn(id: string) {
    return await fetcher(`/columns/${id}`, "DELETE");
}
