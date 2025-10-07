interface ColumnModel {
    _id: string;
    title: string;
    color: string; // id del color (ej: "red")
    tasks?: TaskModel[];
    index: number;
    opId?: string; // id de operación (para WS)
    clientTs?: number; // timestamp cliente (para WS)
}

interface TaskModel {
    _id: string;
    title: string;
    description?: string;
    columnId: string;
    index: number;
    color: string; // id del color (ej: "red")
    tag: string; //etiqueta (ej: "frontend")
    opId?: string; // id de operación (para WS)
    clientTs?: number; // timestamp cliente (para WS)
}
export type { ColumnModel, TaskModel };
