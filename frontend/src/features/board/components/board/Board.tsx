import { useEffect, useMemo, useState } from "react";
import Column from "../column/Column";
import { moveColumnLocal, moveTaskLocal } from "../../libs/dnd-helpers";
import type { ColumnModel, TaskModel } from "../../../../types/types";
import { Plus } from "lucide-react";
import CreateColumnModal from "../column/modal/CreateColumnModal";
import { createColumn, deleteColumn, fetchColumns, moveColumn } from "../../../../libs/api/columns";
import { createTask, deleteTask, fetchTasks, moveTask } from "../../../../libs/api/tasks";

export default function Board() {
    const [columns, setColumns] = useState<ColumnModel[]>([]);
    const [tasks, setTasks] = useState<TaskModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const formatColumns = async () => {
            const cols = await fetchColumns();
            if (!cols || Array.isArray(cols) === false || cols.length === 0) {
                console.error("Error: Expected data to be an array, but got", cols);
                return;
            }
            const colsFormatedId = cols.map((col) => {
                return {
                    ...col,
                    id: col._id,
                };
            });
            for (let i = 0; i < colsFormatedId.length; i++) {
                const tasksInCol = await fetchTasks(colsFormatedId[i]._id);
                if (!tasksInCol || Array.isArray(tasksInCol) === false) {
                    console.error("Error: Expected tasks to be an array, but got", tasksInCol);
                    continue;
                }
                const tasksFormatedId = tasksInCol.map((task) => ({
                    ...task,
                    id: task._id,
                }));
                colsFormatedId[i].tasks = tasksFormatedId;
            }
            setColumns(colsFormatedId);
            setTasks(colsFormatedId.flatMap((c) => c.tasks ?? []));
            console.log("[LOAD BOARD]", { columns: colsFormatedId, tasks });
        };
        formatColumns();
    }, []);

    async function handleDropColumn(columnId: string, toIndex: number) {
        try {
            // 1) Persistir en servidor (conversión slot -> índice final)
            const finalIndexForServer = Math.max(0, Math.min(toIndex, columns.length - 1));
            const res = await moveColumn({ columnId, toIndex: finalIndexForServer });
            if (!res) {
                console.error("Error moving column:", res);
                return;
            }

            // 2) Actualizar UI (slot 0..N, el helper compensa si from<toIndex)
            setColumns((prev) => moveColumnLocal(prev, columnId, toIndex));
        } catch (error) {
            console.error("Error moving column:", error);
        }
    }

    async function handleDropTask(taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) {
        const res = await moveTask({ taskId, toIndex, toColumnId });
        if (!res) {
            console.error("Error moving task:", res);
            return;
        }
        console.log("[DROP TASK]", { taskId, fromColumnId, toColumnId, toIndex });

        setTasks((prev) => {
            const next = moveTaskLocal(prev as Required<TaskModel>[], taskId, toColumnId, toIndex);
            console.log(
                "[STATE tasks]",
                next.map((t) => `${t._id}:${t.columnId}@${t.index}`)
            );
            return next;
        });
    }

    async function handleCreateTask(columnId: string, input: { title: string; description: string; tag: string; color: string }) {
        try {
            const res = (await createTask({
                title: input.title,
                description: input.description,
                columnId,
                color: input.color,
                tag: input.tag,
                // no mandes index si tu backend lo calcula
            } as TaskModel)) as TaskModel;

            setTasks((prev) => {
                const next = [
                    ...prev,
                    {
                        _id: res._id,
                        title: res.title,
                        description: res.description,
                        columnId: res.columnId,
                        color: res.color,
                        tag: res.tag,
                        index: res.index, // <- usar el que devuelve el server
                    },
                ];
                return next;
            });
        } catch (e) {
            console.error("Error creating task:", e);
        }
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

    async function handleCreateColumn(input: { title: string; color: string }) {
        try {
            const res = (await createColumn({ title: input.title, color: input.color, index: columns.length } as ColumnModel)) as ColumnModel;

            setColumns((prev) => {
                const newCol: ColumnModel = { _id: res._id, title: input.title, color: input.color, index: prev.length };
                const next = [...prev, newCol];
                return next;
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating column:", error);
        }
    }

    async function handleDeleteTask(taskId: string) {
        try {
            await deleteTask(taskId);

            setTasks((prev) => {
                const victim = prev.find((t) => t._id === taskId);
                if (!victim) return prev;

                const remaining = prev.filter((t) => t._id !== taskId);

                const sameCol = remaining
                    .filter((t) => t.columnId === victim.columnId)
                    .sort((a, b) => a.index - b.index)
                    .map((t, i) => ({ ...t, index: i }));

                const others = remaining.filter((t) => t.columnId !== victim.columnId);
                const next = [...others, ...sameCol];

                console.log("[DELETE TASK]", { taskId, columnId: victim.columnId });
                console.log(
                    "[STATE tasks]",
                    next.map((t) => `${t._id}:${t.columnId}@${t.index}`)
                );

                return next;
            });
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }

    async function handleDeleteColumn(columnId: string) {
        try {
            const res = await deleteColumn(columnId);
            if (!res) {
                console.error("Error deleting column:", res);
                return;
            }
            setColumns((prev) => prev.filter((c) => c._id !== columnId));
            setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
        } catch (error) {
            console.error("Error deleting column:", error);
        }
    }

    return (
        <main className="h-screen overflow-hidden p-6 flex flex-col">
            <div className="mb-6 shrink-0 flex items-center justify-between">
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

            <section className="flex-1 flex gap-4 overflow-x-auto pb-4 items-stretch">
                {columns
                    .slice()
                    .sort((a, b) => a.index - b.index)
                    .map((col) => (
                        <Column
                            key={col._id}
                            column={col}
                            tasks={tasksByColumn.get(col._id) ?? []}
                            onDropTask={handleDropTask}
                            onDropColumn={handleDropColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onCreateTask={handleCreateTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    ))}
            </section>

            {isModalOpen && <CreateColumnModal onClose={() => setIsModalOpen(false)} onSubmit={handleCreateColumn} />}
        </main>
    );
}
