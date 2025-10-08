import { useEffect, useMemo, useState } from "react";
import Column from "../column/Column";
import type { ColumnModel, TaskModel } from "../../../../types/types";
import { Plus } from "lucide-react";
import CreateColumnModal from "../column/modal/CreateColumnModal";
import { fetchColumns } from "../../../../libs/api/columns";
import { fetchTasks } from "../../../../libs/api/tasks";
import { useBoardWS } from "../../useBoardWS";

export default function Board() {
    const [columns, setColumns] = useState<ColumnModel[]>([]);
    const [tasks, setTasks] = useState<TaskModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { moveColumnWS, createColumnWS, deleteColumnWS, moveTaskWS, createTaskWS, deleteTaskWS } = useBoardWS(setColumns, setTasks);

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
        moveColumnWS(columnId, toIndex);
    }

    async function handleDropTask(taskId: string, _fromColumnId: string, toColumnId: string, toIndex: number) {
        moveTaskWS(taskId, toColumnId, toIndex);
    }

    async function handleCreateTask(columnId: string, input: { title: string; description: string; tag: string; color: string }) {
        createTaskWS({
            title: input.title,
            description: input.description,
            columnId,
            color: input.color,
            tag: input.tag,
            index: tasks.filter((t) => t.columnId === columnId).length, // <- optimista
        } as TaskModel);
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
        createColumnWS(input.title, input.color);
    }

    async function handleDeleteTask(taskId: string) {
        deleteTaskWS(taskId);
    }

    async function handleDeleteColumn(columnId: string) {
        deleteColumnWS(columnId);
    }

    return (
        <main className="h-screen overflow-hidden p-6 flex flex-col">
            <div className="mb-6 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">useTeam Board</h1>
                    <p className="text-gray-600">Drag & drop: columns and tasks</p>
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
