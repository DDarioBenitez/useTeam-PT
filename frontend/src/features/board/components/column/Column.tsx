import { useRef, useState } from "react";
import Task from "../task/Task";
import type { ColumnModel, TaskModel } from "../../../../types/types";
import { Trash2 } from "lucide-react";
import CreateTaskModal from "../task/modal/CreateTask";

interface ColumnProps {
    column: ColumnModel;
    tasks: TaskModel[];
    onDropTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
    onDropColumn: (columnId: string, toIndex: number) => void;
    onDeleteColumn?: (columnId: string) => void;
    onCreateTask?: (columnId: string, input: { title: string; description: string; tag: string; color: string }) => void;
    onDeleteTask?: (taskId: string) => void;
}

const Column = ({ column, tasks = [], onDropTask, onDropColumn, onDeleteColumn, onCreateTask, onDeleteTask }: ColumnProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [, setOverColumn] = useState(false);
    const colRef = useRef<HTMLDivElement>(null);

    const handleDeleteColumn = (columnId: string) => {
        onDeleteColumn?.(columnId);
    };

    // ——— DnD columnas (igual que ya lo tenías) ———
    const handleColumnDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // <- SIEMPRE
        e.dataTransfer.dropEffect = "move";
    };

    const handleColumnDrop = (e: React.DragEvent) => {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.type !== "column") return;

        const rect = colRef.current?.getBoundingClientRect();
        if (!rect) return;
        const midX = rect.left + rect.width / 2;

        // índice FINAL (no overIndex): before/after según mitad
        const toIndex = e.clientX < midX ? column.index : column.index + 1;

        console.log("[DROP COLUMN wrapper]", { from: data.fromIndex, toIndex, hovered: column.index });
        onDropColumn(data.columnId, toIndex);
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
                const raw = e.dataTransfer.getData("application/json");
                if (!raw) return;
                const data = JSON.parse(raw);

                if (data.type === "column") {
                    // ⚠️ columna: NO detener propagación, dejá que suba al wrapper
                    return; // sin stopPropagation()
                }

                if (data.type === "task") {
                    e.stopPropagation(); // solo para tasks
                    onDropTask(data.taskId, data.fromColumnId, column._id, pos);
                }
            }}
            className="w-full"
        />
    );

    const handleListDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const data = JSON.parse(raw);

        if (data.type === "column") {
            // dejá que burbujee al wrapper
            return; // sin stopPropagation()
        }

        if (data.type === "task") {
            e.stopPropagation(); // solo tasks
            onDropTask(data.taskId, data.fromColumnId, column._id, tasks.length);
        }
    };

    return (
        <div
            ref={colRef}
            onDragOver={handleColumnDragOver}
            onDrop={handleColumnDrop}
            className={`w-[26rem] flex-shrink-0 flex flex-col rounded-lg shadow-md bg-${column.color}/10 h-full overflow-hidden`}
            onDragEnter={() => setOverColumn(true)}
            onDragLeave={() => setOverColumn(false)}
        >
            {/* header draggable para arrastrar la columna */}
            <div
                draggable
                onDragStart={(e) => {
                    const payload = { type: "column", columnId: column._id, fromIndex: column.index };
                    console.log("[DRAGSTART COLUMN]", payload);
                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "move";
                }}
                className={`shrink-0 p-4 flex items-center justify-between bg-${column.color}/20`}
            >
                <h2 className={`text-lg font-semibold text-${column.color}`}>{column.title}</h2>
                <span className="text-red-500 hover:text-red-600 p-1 rounded-full cursor-pointer hover:bg-red-100 ">
                    <Trash2 className="cursor-pointer" onClick={() => handleDeleteColumn(column._id)} />
                </span>
            </div>

            {/* Lista scrolleable (drop de TASKS) */}
            <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-3" onDragOver={handleDragOver} onDrop={handleListDrop}>
                <TaskDropeZone pos={0} />
                {(tasks ?? []).map((task, i) => (
                    <div key={task._id}>
                        <Task
                            title={task.title}
                            description={task.description}
                            color={task.color}
                            tag={task.tag}
                            id={task._id}
                            columnId={column._id}
                            index={task.index}
                            onDelete={onDeleteTask}
                        />
                        <TaskDropeZone pos={i + 1} />
                    </div>
                ))}
            </div>

            <div className="shrink-0 p-3 pt-0">
                <button
                    className={`w-full rounded-full px-4 py-2 font-medium text-white
                        bg-${column.color} hover:bg-${column.color}/80`}
                >
                    + Add Task
                </button>
            </div>

            {isModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={(input) => {
                        // 👇 delegar creación al Board
                        onCreateTask?.(column._id, input);
                    }}
                />
            )}
        </div>
    );
};

export default Column;
