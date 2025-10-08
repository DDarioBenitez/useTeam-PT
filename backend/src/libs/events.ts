// shared/events.ts
export const EVENTS = {
  BOARD_JOIN: 'board:join',
  //Move
  COLUMN_MOVE: 'column:move', // -> server
  COLUMN_MOVED: 'column:moved', // <- broadcast
  TASK_MOVE: 'task:move', // -> server
  TASK_MOVED: 'task:moved', // <- broadcast

  //Create
  COLUMN_CREATED: 'column:created', // <- broadcast
  COLUMN_CREATE: 'column:create', // -> server
  TASK_CREATE: 'task:create', // -> server
  TASK_CREATED: 'task:created', // <- broadcast

  //Delete
  COLUMN_DELETE: 'column:delete', // -> server
  COLUMN_DELETED: 'column:deleted', // <- broadcast
  TASK_DELETE: 'task:delete', // -> server
  TASK_DELETED: 'task:deleted', // <- broadcast

  //Notifications
  NOTIFICATION: 'notification', // <- broadcast
  NOTIFICATION_TRIGGERED: 'notification:triggered', // -> server
} as const;
