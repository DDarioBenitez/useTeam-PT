import { useRef, useState } from "react";
import Task from "../task/Task";
import type { ColumnModel } from "../../../../types/types";
import { Trash2 } from "lucide-react";
import CreateTaskModal from "../task/modal/CreateTask";

type TaskModel = {
    id: string;
    title: string;
    description?: string;
    columnId: string;
    index: number;
    color: string;
    tag: string;
};

interface ColumnProps {
    column: ColumnModel;
    tasks: TaskModel[];
    onDropTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
    onDropColumn: (columnId: string, toIndex: number) => void;
    onDeleteColumn?: (columnId: string) => void;
    // 👇 NUEVO
    onCreateTask?: (columnId: string, input: { title: string; description: string; tag: string; color: string }) => void;
    onDeleteTask?: (taskId: string) => void;
}

const Column = ({ column, tasks = [], onDropTask, onDropColumn, onDeleteColumn, onCreateTask, onDeleteTask }: ColumnProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [overColumn, setOverColumn] = useState(false);
    const colRef = useRef<HTMLDivElement>(null);

    const handleDeleteColumn = (columnId: string) => {
        onDeleteColumn?.(columnId);
    };

    // ——— DnD columnas (igual que ya lo tenías) ———
    const handleColumnDragOver = (e: React.DragEvent) => {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.type !== "column") return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        } catch {}
    };

    const handleColumnDrop = (e: React.DragEvent) => {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.type !== "column") return;

            const rect = colRef.current?.getBoundingClientRect();
            if (!rect) return;

            const midX = rect.left + rect.width / 2;
            const toIndex = e.clientX < midX ? column.index : column.index + 1;

            console.log("[DROP COLUMN (whole wrapper)]", {
                fromColumnId: data.columnId,
                hoveredColumnId: column.id,
                toIndex,
            });

            onDropColumn(data.columnId, toIndex);
        } catch (err) {
            console.warn("DROP COLUMN parse error", err);
        }
    };

    // ——— DnD tasks ———
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const TaskDropeZone = ({ pos }: { pos: number }) => (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const raw = e.dataTransfer.getData("application/json");
                if (!raw) return;
                const data = JSON.parse(raw);
                console.log("[DROP TASK-ZONE]", { pos, data, toColumnId: column.id });
                if (data.type === "task") {
                    onDropTask(data.taskId, data.fromColumnId, column.id, pos);
                }
            }}
            className="w-full"
        />
    );

    const handleListDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const data = JSON.parse(raw);
        console.log("[DROP LIST-CONTAINER]", { data, toColumnId: column.id, toIndex: tasks.length });
        if (data.type === "task") {
            onDropTask(data.taskId, data.fromColumnId, column.id, tasks.length); // usar props.tasks
        }
    };

    return (
        <div
            ref={colRef}
            onDragOver={handleColumnDragOver}
            onDrop={handleColumnDrop}
            className={`relative w-[26rem] flex-shrink-0 flex flex-col rounded-lg shadow-md bg-${column.color}/10 h-[40rem]`}
            onDragEnter={() => setOverColumn(true)}
            onDragLeave={() => setOverColumn(false)}
        >
            {/* header draggable para arrastrar la columna */}
            <div
                draggable
                onDragStart={(e) => {
                    const payload = { type: "column", columnId: column.id, fromIndex: column.index };
                    console.log("[DRAGSTART COLUMN]", payload);
                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "move";
                }}
                className={`rounded-t-lg p-4 flex items-center justify-between bg-${column.color}/20`}
            >
                <h2 className={`text-lg font-semibold text-${column.color}`}>{column.title}</h2>
                <span className="text-red-500 hover:text-red-600 p-1 rounded-full cursor-pointer hover:bg-red-100 ">
                    <Trash2 className="cursor-pointer" onClick={() => handleDeleteColumn(column.id)} />
                </span>
            </div>

            {/* Lista scrolleable (drop de TASKS) */}
            <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-3" onDragOver={handleDragOver} onDrop={handleListDrop}>
                <TaskDropeZone pos={0} />
                {(tasks ?? []).map((task, i) => (
                    <div key={task.id}>
                        <Task
                            title={task.title}
                            description={task.description}
                            color={task.color}
                            tag={task.tag}
                            id={task.id}
                            columnId={column.id}
                            index={task.index}
                            onDelete={onDeleteTask}
                        />
                        <TaskDropeZone pos={i + 1} />
                    </div>
                ))}
            </div>

            <div className="absolute left-3 right-3 bottom-3">
                <button
                    className={`w-full rounded-full px-4 py-2 font-medium text-white border border-gray-300 bg-${column.color} hover:bg-${column.color}/80 cursor-pointer`}
                    onClick={() => setIsModalOpen(true)}
                >
                    + Add Task
                </button>
            </div>

            {isModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={(input) => {
                        // 👇 delegar creación al Board
                        onCreateTask?.(column.id, input);
                    }}
                />
            )}
        </div>
    );
};

export default Column;
