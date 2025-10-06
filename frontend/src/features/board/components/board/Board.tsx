import { useEffect, useMemo, useState } from "react";
import Column from "../column/Column";
import { moveColumnLocal, moveTaskLocal } from "../../libs/dnd-helpers";
import type { ColumnModel, TaskModel } from "../../../../types/types";
import { Plus } from "lucide-react";
import CreateColumnModal from "../column/modal/CreateColumnModal";

export default function Board() {
    const [columns, setColumns] = useState<ColumnModel[]>([]);
    const [tasks, setTasks] = useState<TaskModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const c1: ColumnModel = { id: "col-1", title: "To Do", color: "blue-500", index: 0 };
        const c2: ColumnModel = { id: "col-2", title: "Doing", color: "yellow-500", index: 1 };
        const c3: ColumnModel = { id: "col-3", title: "Done", color: "green-500", index: 2 };
        setColumns([c1, c2, c3]);

        setTasks([
            { id: "t1", title: "Task A", description: "Desc A", columnId: c1.id, index: 0, color: "red-500", tag: "backend" },
            { id: "t2", title: "Task B", description: "Desc B", columnId: c1.id, index: 1, color: "blue-500", tag: "frontend" },
            { id: "t3", title: "Task C", description: "Desc C", columnId: c2.id, index: 0, color: "green-500", tag: "design" },
        ]);
    }, []);

    function handleDropColumn(columnId: string, toIndex: number) {
        console.log("[DROP COLUMN]", { columnId, toIndex });
        setColumns((prev) => {
            const next = moveColumnLocal(prev, columnId, toIndex);
            console.log(
                "[STATE columns]",
                next.map((c) => `${c.id}@${c.index}`)
            );
            return next;
        });
    }

    function handleDropTask(taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) {
        console.log("[DROP TASK]", { taskId, fromColumnId, toColumnId, toIndex });
        setTasks((prev) => {
            const next = moveTaskLocal(prev as Required<TaskModel>[], taskId, toColumnId, toIndex);
            console.log(
                "[STATE tasks]",
                next.map((t) => `${t.id}:${t.columnId}@${t.index}`)
            );
            return next;
        });
    }

    // 👇 NUEVO: crear task en el estado del Board
    function handleCreateTask(columnId: string, input: { title: string; description: string; tag: string; color: string }) {
        setTasks((prev) => {
            const nextIndex = prev.filter((t) => t.columnId === columnId).length;
            const newTask: TaskModel = {
                id: crypto.randomUUID(),
                title: input.title,
                description: input.description,
                tag: input.tag,
                color: input.color,
                columnId,
                index: nextIndex,
            };
            const next = [...prev, newTask];
            console.log("[CREATE TASK -> BOARD]", newTask);
            return next;
        });
    }

    const tasksByColumn = useMemo(() => {
        const map = new Map<string, TaskModel[]>();
        for (const t of tasks) {
            if (!map.has(t.columnId)) map.set(t.columnId, []);
            map.get(t.columnId)!.push(t);
        }
        for (const [, arr] of map) arr.sort((a, b) => a.index - b.index);
        return map;
    }, [tasks]);

    function handleCreateColumn(input: { title: string; color: string }) {
        setColumns((prev) => {
            const newCol: ColumnModel = { id: crypto.randomUUID(), title: input.title, color: input.color, index: prev.length };
            const next = [...prev, newCol];
            console.log("[CREATE COLUMN -> BOARD]", newCol);
            return next;
        });
        setIsModalOpen(false);
    }

    function handleDeleteTask(taskId: string) {
        setTasks((prev) => {
            const victim = prev.find((t) => t.id === taskId);
            if (!victim) return prev;

            const remaining = prev.filter((t) => t.id !== taskId);

            const sameCol = remaining
                .filter((t) => t.columnId === victim.columnId)
                .sort((a, b) => a.index - b.index)
                .map((t, i) => ({ ...t, index: i }));

            const others = remaining.filter((t) => t.columnId !== victim.columnId);
            const next = [...others, ...sameCol];

            console.log("[DELETE TASK]", { taskId, columnId: victim.columnId });
            console.log(
                "[STATE tasks]",
                next.map((t) => `${t.id}:${t.columnId}@${t.index}`)
            );

            return next;
        });
    }

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">useTeam Board</h1>
                    <p className="text-gray-600">Drag & drop: columnas y tareas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 rounded-lg flex items-center hover:bg-blue-600 transition cursor-pointer"
                >
                    <span>
                        <Plus className="text-white" />
                    </span>
                    <span className="ml-2 text-white font-medium">Add Column</span>
                </button>
            </div>

            <section className="flex gap-4 overflow-x-auto pb-4">
                {columns
                    .slice()
                    .sort((a, b) => a.index - b.index)
                    .map((col) => (
                        <Column
                            key={col.id}
                            column={col}
                            tasks={tasksByColumn.get(col.id) ?? []}
                            onDropTask={handleDropTask}
                            onDropColumn={handleDropColumn}
                            onDeleteColumn={() => {
                                setColumns((prev) => prev.filter((c) => c.id !== col.id));
                            }}
                            onCreateTask={handleCreateTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    ))}
            </section>

            {/* Nota: el modal CreateColumnModal va en App.tsx */}
            {isModalOpen && <CreateColumnModal onClose={() => setIsModalOpen(false)} onSubmit={handleCreateColumn} />}
        </main>
    );
}
