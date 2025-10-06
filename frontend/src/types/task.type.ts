interface TaskProps {
    id: string;
    title: string;
    columnId: string;
    index?: number;
    color?: string;
    description?: string;
    tag?: string;
    onDelete?: (taskId: string) => void;
}

export type { TaskProps };
