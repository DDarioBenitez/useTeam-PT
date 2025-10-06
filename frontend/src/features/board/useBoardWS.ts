import type React from "react";
import type { ColumnModel, TaskModel } from "../../types/types";
import { useEffect, useRef } from "react";
import { connectToBoard, emitWithAck, off, on } from "../../libs/sockets";
import { EVENTS, type MoveColumnPayload, type MoveTaskPayload } from "../../../../shared/events";
import { moveColumnLocal, moveTaskLocal } from "./libs/dnd-helpers";

export function useBoardWS(
    boardId: string,
    setColumns: React.Dispatch<React.SetStateAction<ColumnModel[]>>,
    setTasks: React.Dispatch<React.SetStateAction<TaskModel[]>>
) {
    const myOps = useRef<Set<string>>(new Set());

    useEffect(() => {
        connectToBoard(boardId);

        const onColumnMoved = (payload: MoveColumnPayload) => {
            if (myOps.current.has(payload.opId)) return;
            setColumns((prev) => moveColumnLocal(prev, payload.columnId, payload.toIndex));
        };

        const onTaskMoved = (payload: MoveTaskPayload) => {
            if (myOps.current.has(payload.opId)) return;
            setTasks((prev) => moveTaskLocal(prev, payload.taskId, payload.toColumnId, payload.toIndex));
        };

        on(EVENTS.COLUMN_MOVED, onColumnMoved);
        on(EVENTS.TASK_MOVED, onTaskMoved);

        return () => {
            off(EVENTS.COLUMN_MOVED, onColumnMoved);
            off(EVENTS.TASK_MOVED, onTaskMoved);
        };
    }, [boardId, setColumns, setTasks]);

    function moveColumn(columnId: string, toIndex: number) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        setColumns((prev) => moveColumnLocal(prev, columnId, toIndex));
        emitWithAck(EVENTS.COLUMN_MOVE, { boardId, columnId, toIndex, opId, clientTs: Date.now() }).catch(() => myOps.current.delete(opId));
    }

    function moveTask(taskId: string, toColumnId: string, toIndex: number) {
        const opId = crypto.randomUUID();
        myOps.current.add(opId);
        setTasks((prev) => moveTaskLocal(prev, taskId, toColumnId, toIndex));
        emitWithAck(EVENTS.TASK_MOVE, { boardId, taskId, toColumnId, toIndex, opId, clientTs: Date.now() }).catch(() => myOps.current.delete(opId));
    }

    return { moveColumn, moveTask };
}
