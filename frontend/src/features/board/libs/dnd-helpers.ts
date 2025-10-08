// Reordenar un array de objetos con propiedad 'index' para que queden 0..N respectando orden original
export function reindex<T extends { index: number }>(arr: T[]): T[] {
    return arr.map((it, i) => ({ ...it, index: i }));
}

//Columns

export function moveColumnLocal<C extends { _id: string; index: number }>(
    cols: C[],
    columnId: string,
    toIndex: number // <-- slot destino (0..N)
) {
    const list = cols.map((c) => ({ ...c }));
    const from = list.findIndex((c) => c._id === columnId);
    if (from < 0) return cols;

    const [col] = list.splice(from, 1);

    // compensar si ibas hacia la derecha
    let idx = toIndex;
    if (from < toIndex) idx -= 1;

    idx = Math.max(0, Math.min(idx, list.length));
    list.splice(idx, 0, col);

    // reindex sin ordenar
    return list.map((c, i) => ({ ...c, index: i }));
}

export function createColumnLocal<C extends { _id: string; title: string; color: string; index: number }>(cols: C[], newCol: C): C[] {
    return [...cols, newCol];
}

export function deleteColumnLocal<C extends { _id: string }>(cols: C[], columnId: string): C[] {
    return cols.filter((c) => c._id !== columnId);
}

// Tasks
export function moveTaskLocal<T extends { _id: string; columnId: string; index: number }>(
    tasks: T[],
    taskId: string,
    toColumnId: string,
    toIndex: number
): T[] {
    // Clonar para no mutar
    const list = tasks.map((t) => ({ ...t }));

    // Ubicar y extraer la task original
    const fromPos = list.findIndex((t) => t._id === taskId);
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

    //  Deduplicar por id (por si la lista venía “sucia” por drops previos)
    const seen = new Set<string>();
    result = result.filter((t) => {
        if (seen.has(t._id)) return false;
        seen.add(t._id);
        return true;
    });

    return result;
}

export function createTaskLocal<T extends { _id: string; columnId: string; index: number }>(tasks: T[], newTask: T): T[] {
    const list = tasks.map((t) => ({ ...t }));
    list.push(newTask);
    return list;
}

export function deleteTaskLocal<T extends { _id: string }>(tasks: T[], taskId: string): T[] {
    return tasks.filter((t) => t._id !== taskId);
}
