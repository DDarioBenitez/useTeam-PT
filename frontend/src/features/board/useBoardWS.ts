// useBoardWS.ts
import type React from "react";
import type { ColumnModel, TaskModel } from "../../types/types";
import { useEffect, useRef } from "react";
import { connectToBoard, off, on } from "../../libs/sockets"; // <- sin shared
import { createColumnLocal, createTaskLocal, deleteColumnLocal, deleteTaskLocal, moveColumnLocal, moveTaskLocal } from "./libs/dnd-helpers";
import { EVENTS } from "../../shared/events";
import { createColumn, deleteColumn, moveColumn } from "../../libs/api/columns";
import { createTask, deleteTask, moveTask } from "../../libs/api/tasks";

type MoveColumnPayload = { columnId: string; toIndex: number; opId?: string; clientTs?: number };
type MoveTaskPayload = { taskId: string; toColumnId: string; toIndex: number; opId?: string; clientTs?: number };

export function useBoardWS(
    setColumns: React.Dispatch<React.SetStateAction<ColumnModel[]>>,
    setTasks: React.Dispatch<React.SetStateAction<TaskModel[]>>
) {
    const myOps = useRef<Set<string>>(new Set());

    useEffect(() => {
        connectToBoard();

        const onColumnMoved = (p: MoveColumnPayload) => {
            // si es nuestra propia operación, ignoramos (ya aplicamos optimista)
            if (p.opId && myOps.current.delete(p.opId)) return;
            setColumns((prev) => moveColumnLocal(prev, p.columnId, p.toIndex));
        };
        const onColumnCreated = (p: ColumnModel) => {
            // Si recibimos la creación asociada a una op propia, reemplazamos el temporal
            if (p.opId && myOps.current.has(p.opId)) {
                myOps.current.delete(p.opId);
                setColumns((prev) => prev.map((c) => (c._id === p.opId ? p : c)));
                return;
            }
            setColumns((prev) => (prev.some((c) => c._id === p._id) ? prev : [...prev, p]));
        };
        const onColumnDeleted = (p: { columnId: string; opId?: string; clientTs?: number }) => {
            if (p.opId && myOps.current.delete(p.opId)) return;
            setColumns((prev) => prev.filter((c) => c._id !== p.columnId));
        };

        const onTaskMoved = (p: MoveTaskPayload) => {
            if (p.opId && myOps.current.delete(p.opId)) return;
            setTasks((prev) => moveTaskLocal(prev, p.taskId, p.toColumnId, p.toIndex));
        };
        const onTaskCreated = (p: TaskModel & { opId?: string; clientTs?: number }) => {
            if (p.opId && myOps.current.has(p.opId)) {
                myOps.current.delete(p.opId);
                setTasks((prev) => prev.map((t) => (t._id === p.opId ? p : t)));
                return;
            }
            setTasks((prev) => [...prev, p]);
        };
        const onDeleteTask = (p: { taskId: string; opId?: string; clientTs?: number }) => {
            if (p.opId && myOps.current.delete(p.opId)) return;
            setTasks((prev) => prev.filter((t) => t._id !== p.taskId));
        };

        on(EVENTS.COLUMN_MOVED, onColumnMoved);
        on(EVENTS.COLUMN_CREATED, onColumnCreated);
        on(EVENTS.COLUMN_DELETED, onColumnDeleted);

        on(EVENTS.TASK_MOVED, onTaskMoved);
        on(EVENTS.TASK_CREATED, onTaskCreated);
        on(EVENTS.TASK_DELETED, onDeleteTask);

        return () => {
            off(EVENTS.COLUMN_MOVED, onColumnMoved);
            off(EVENTS.COLUMN_CREATED, onColumnCreated);
            off(EVENTS.COLUMN_DELETED, onColumnDeleted);

            off(EVENTS.TASK_MOVED, onTaskMoved);
            off(EVENTS.TASK_CREATED, onTaskCreated);
            off(EVENTS.TASK_DELETED, onDeleteTask);
        };
    }, [setColumns, setTasks]);

    async function moveColumnWS(columnId: string, toIndex: number) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // optimistic
        setColumns((prev) => moveColumnLocal(prev, columnId, toIndex));
        try {
            await moveColumn({ columnId, toIndex, opId, clientTs: Date.now() });
        } catch (e) {
            myOps.current.delete(opId);
            console.error("COLUMN_MOVE error:", e);
        }
    }

    async function createColumnWS(title: string, color: string) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // temp column uses opId as _id so server reply can replace it
        setColumns((prev) => createColumnLocal(prev, { _id: opId, title, color, index: prev.length } as ColumnModel));
        try {
            // send minimal payload to API (server will assign final _id)
            await createColumn({ title, color, opId, clientTs: Date.now() });
        } catch (e) {
            myOps.current.delete(opId);
            // remove temp
            setColumns((prev) => prev.filter((c) => c._id !== opId));
            console.error("COLUMN_CREATE error:", e);
        }
    }

    async function deleteColumnWS(columnId: string) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // optimistic remove
        setColumns((prev) => deleteColumnLocal(prev, columnId));
        try {
            await deleteColumn(columnId);
        } catch (e) {
            myOps.current.delete(opId);
            console.error("COLUMN_DELETE error:", e);
        }
    }

    async function moveTaskWS(taskId: string, toColumnId: string, toIndex: number) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // optimistic
        setTasks((prev) => moveTaskLocal(prev, taskId, toColumnId, toIndex));
        try {
            await moveTask({ taskId, toColumnId, toIndex, opId, clientTs: Date.now() }); // persistir en servidor
        } catch (e) {
            myOps.current.delete(opId);
            console.error("TASK_MOVE error:", e);
        }
    }

    async function createTaskWS(dto: TaskModel) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // temp task
        setTasks((prev) => createTaskLocal(prev, { ...(dto as Omit<TaskModel, "_id">), _id: opId } as TaskModel));
        try {
            await createTask({ ...dto, opId, clientTs: Date.now() });
        } catch (e) {
            myOps.current.delete(opId);
            // remove temp
            setTasks((prev) => prev.filter((t) => t._id !== opId));
            console.error("TASK_CREATE error:", e);
        }
    }

    async function deleteTaskWS(taskId: string) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        // optimistic remove
        setTasks((prev) => deleteTaskLocal(prev, taskId));
        try {
            await deleteTask(taskId);
        } catch (e) {
            myOps.current.delete(opId);
            console.error("TASK_DELETE error:", e);
        }
    }

    return { moveColumnWS, createColumnWS, deleteColumnWS, moveTaskWS, createTaskWS, deleteTaskWS };
}
