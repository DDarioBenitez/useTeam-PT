// shared/events.ts
export const EVENTS = {
    BOARD_JOIN: "board:join",
    COLUMN_MOVE: "column:move", // -> server
    COLUMN_MOVED: "column:moved", // <- broadcast
    TASK_MOVE: "task:move", // -> server
    TASK_MOVED: "task:moved", // <- broadcast
} as const;

export type MoveColumnPayload = {
    boardId: string;
    columnId: string;
    toIndex: number;
    opId: string;
    clientTs: number;
};

export type MoveTaskPayload = {
    boardId: string;
    taskId: string;
    toColumnId: string;
    toIndex: number;
    opId: string;
    clientTs: number;
};
