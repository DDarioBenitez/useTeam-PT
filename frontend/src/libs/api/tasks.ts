import type { TaskModel } from "../../types/types";
import { fetcher } from "../api";

export async function fetchTasks(id: string) {
    return await fetcher(`/tasks/column/${id}`);
}

export async function createTask(dto: TaskModel) {
    return await fetcher(`/tasks`, "POST", dto);
}

export async function moveTask(dto: { taskId: string; toIndex: number; toColumnId: string }) {
    return await fetcher("/tasks/move", "PATCH", dto);
}

export async function deleteTask(id: string) {
    return await fetcher(`/tasks/${id}`, "DELETE");
}
