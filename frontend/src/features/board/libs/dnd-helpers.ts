// import type { ColumnModel, TaskModel } from "../../../types/types";

// export function reindex<T extends { index: number }>(arr: T[]): T[] {
//     return arr
//         .slice()
//         .sort((a, b) => a.index - b.index)
//         .map((item, index) => ({ ...item, index: index }));
// }

// export function moveColumnLocal(cols: ColumnModel[], columnId: string, toIndex: number) {
//     const list = cols.map((col) => ({ ...col }));
//     const from = list.findIndex((col) => col.id === columnId);
//     if (from < 0) return cols;
//     const [col] = list.splice(from, 1);
//     const index = Math.max(0, Math.min(toIndex, list.length));
//     list.splice(index, 0, { ...col, index: index });
//     return reindex(list);
// }

// export function moveTaskLocal(tasks: TaskModel[], taskId: string, toColumnId: string, toIndex: number) {
//     const next = tasks.map((task) => ({ ...task }));
//     const fromTask = next.find((task) => task.id === taskId);
//     if (!fromTask) return tasks;

//     let origin = next.filter((task) => task.columnId === fromTask.columnId && task.id !== taskId);
//     origin = reindex(origin);

//     let dest = next.filter((task) => task.columnId === toColumnId);
//     const insertAt = Math.max(0, Math.min(toIndex, dest.length));
//     const moved = { ...fromTask, columId: toColumnId, index: insertAt };
//     dest.splice(insertAt, 0, moved);
//     dest = reindex(dest);

//     const others = next.filter((task) => task.columnId !== fromTask.columnId && task.columnId !== toColumnId);

//     return [...others, ...origin, ...dest];
// }

// Reindex genérico
export function reindex<T extends { index: number }>(arr: T[]): T[] {
    return arr
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((it, i) => ({ ...it, index: i }));
}

/* ---- Columnas ---- */
export function moveColumnLocal<C extends { id: string; index: number }>(cols: C[], columnId: string, toIndex: number) {
    const list = cols.map((c) => ({ ...c }));
    const from = list.findIndex((c) => c.id === columnId);
    if (from < 0) return cols;
    const [col] = list.splice(from, 1);
    const idx = Math.max(0, Math.min(toIndex, list.length));
    list.splice(idx, 0, { ...col, index: idx });
    return reindex(list);
}

/* ---- Tasks ---- */
export function moveTaskLocal<T extends { id: string; columnId: string; index: number }>(
    tasks: T[],
    taskId: string,
    toColumnId: string,
    toIndex: number
): T[] {
    // Clonar para no mutar
    const list = tasks.map((t) => ({ ...t }));

    // Ubicar y extraer la task original
    const fromPos = list.findIndex((t) => t.id === taskId);
    if (fromPos < 0) return tasks;

    const fromTask = list[fromPos];
    const fromColumnId = fromTask.columnId;
    const fromIndex = fromTask.index;

    // Quitar del array global
    list.splice(fromPos, 1);

    // Si es misma columna y el índice destino está "después" del origen,
    // al quitar el elemento original, el destino se corre una posición a la izquierda.
    let insertAt = toIndex;
    if (fromColumnId === toColumnId && toIndex > fromIndex) {
        insertAt = toIndex - 1;
    }

    // Construir la lista destino SIN la tarea
    const dest = list.filter((t) => t.columnId === toColumnId);

    // Normalizar el índice destino dentro del rango
    insertAt = Math.max(0, Math.min(insertAt, dest.length));

    // Insertar en destino con el nuevo columnId
    dest.splice(insertAt, 0, { ...fromTask, columnId: toColumnId });

    // Reindex helpers
    const reindex = <U extends { index: number }>(arr: U[]) => arr.map((it, i) => ({ ...it, index: i }));

    let result: T[];

    if (fromColumnId === toColumnId) {
        // Misma columna: reemplazar esa columna por 'dest' reindexada
        const others = list.filter((t) => t.columnId !== toColumnId);
        result = [...others, ...reindex(dest)] as T[];
    } else {
        // Entre columnas: reindexar origen y destino, mantener el resto
        const origin = list.filter((t) => t.columnId === fromColumnId);
        const others = list.filter((t) => t.columnId !== fromColumnId && t.columnId !== toColumnId);
        result = [...others, ...reindex(origin), ...reindex(dest)] as T[];
    }

    // 🔒 Deduplicar por id (por si la lista venía “sucia” por drops previos)
    const seen = new Set<string>();
    result = result.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
    });

    return result;
}
