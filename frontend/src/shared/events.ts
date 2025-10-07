// shared/events.ts
export const EVENTS = {
    BOARD_JOIN: "board:join",
    //Move
    COLUMN_MOVE: "column:move", // -> server
    COLUMN_MOVED: "column:moved", // <- broadcast
    TASK_MOVE: "task:move", // -> server
    TASK_MOVED: "task:moved", // <- broadcast

    //Create
    COLUMN_CREATED: "column:created", // <- broadcast
    COLUMN_CREATE: "column:create", // -> server
    TASK_CREATE: "task:create", // -> server
    TASK_CREATED: "task:created", // <- broadcast

    //Delete
    COLUMN_DELETE: "column:delete", // -> server
    COLUMN_DELETED: "column:deleted", // <- broadcast
    TASK_DELETE: "task:delete", // -> server
    TASK_DELETED: "task:deleted", // <- broadcast
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
