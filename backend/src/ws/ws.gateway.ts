import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EVENTS } from 'src/libs/events';
import { CreateTaskDTO } from 'src/tasks/dtos/createTaskDTO';
import { MoveTaskDTO } from 'src/tasks/dtos/moveTaskDTO';
import { MoveColumnDTO } from 'src/columns/dtos/moveColumnDTO';
import { CreateColumnWSDTO } from 'src/columns/dtos/createColumnWSDTO';

@WebSocketGateway({
  namespace: 'boards',
  cors: { origin: '*', credentials: false },
})
export class WSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  handleConnection(socket: Socket) {
    socket.join(EVENTS.BOARD_JOIN);
    console.log('[WS] Client connected:', socket.id);
    socket.emit('connected', {
      ok: true,
      socketId: socket.id,
      ns: '/boards',
      ts: Date.now(),
    });
  }
  handleDisconnect(_socket: Socket) {}

  //Columns

  columnMove(payload: MoveColumnDTO) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.COLUMN_MOVED, payload);
    console.log('[WS] Column moved:', payload);
  }
  columnCreated(payload: CreateColumnWSDTO) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.COLUMN_CREATED, payload);
    console.log('[WS] Column created:', payload);
  }
  columnDeleted(payload: { columnId: string; opId: string; clientTs: number }) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.COLUMN_DELETED, payload);
  }

  //Tasks
  taskMove(payload: MoveTaskDTO) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.TASK_MOVED, payload);
  }
  taskCreated(payload: CreateTaskDTO) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.TASK_CREATED, payload);
    console.log('[WS] Task created:', payload);
  }
  taskDeleted(payload: { taskId: string; opId: string; clientTs: number }) {
    this.io.to(EVENTS.BOARD_JOIN).emit(EVENTS.TASK_DELETED, payload);
  }
}
