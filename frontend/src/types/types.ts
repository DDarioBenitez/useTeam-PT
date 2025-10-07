interface ColumnModel {
    _id: string;
    title: string;
    color: string; // id del color (ej: "red")
    tasks?: TaskModel[];
    index: number;
}

interface TaskModel {
    _id: string;
    title: string;
    description?: string;
    columnId: string;
    index: number;
    color: string; // id del color (ej: "red")
    tag: string; //etiqueta (ej: "frontend")
}
export type { ColumnModel, TaskModel };
