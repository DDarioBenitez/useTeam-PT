import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from 'src/task/task.schema';
import { CreateColumnDTO } from './dtos/createColumnDTO';
import { MoveColumnDTO } from './dtos/moveColumnDTO';
import { Column } from './column.schema';
import { WSGateway } from 'src/ws/ws.gateway';

@Injectable()
export class ColumnService {
  // Servicio de columnas: operaciones CRUD que mantienen índices consistentes
  // y notifican cambios vía WebSocket.
  constructor(
    @InjectModel(Column.name) private colModel: Model<Column>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @Inject(WSGateway) private wsGateway: WSGateway,
  ) {}

  async list() {
    // Devuelve todas las columnas ordenadas por su índice
    return this.colModel.find().sort({ index: 1 }).lean();
  }

  async create(dto: CreateColumnDTO) {
    // Crear columna en una transacción para mantener índices consistentes
    const count = await this.colModel.countDocuments();
    const index = dto.index ?? count;
    const session = await this.colModel.db.startSession();
    await session.withTransaction(async () => {
      // desplazar índices >= index hacia la derecha
      await this.colModel.updateMany(
        { index: { $gte: index } },
        { $inc: { index: 1 } },
        { session },
      );
      // insertar la nueva columna en la posición "index"
      await this.colModel.create(
        [{ title: dto.title, index, color: dto.color }],
        { session },
      );
    });
    // cerrar la sesión una vez finalizada la transacción
    session.endSession();

    // obtener la columna creada y notificar via WebSocket al cliente
    const col = await this.colModel.findOne({ index }).lean();
    // enviar notificación con opId/clientTs para que el cliente reemplace temporales
    this.wsGateway.columnCreated({
      ...dto,
      index,
      clientTs: dto.clientTs,
      opId: dto.opId,
      _id: col?._id.toString() || '',
    });
  }

  async remove(columnId: string) {
    // Eliminar columna + tareas asociadas en transacción y reindexar
    const session = await this.colModel.db.startSession();
    try {
      session.startTransaction();
      // buscar la columna dentro de la transacción
      const column = await this.colModel.findById(columnId).session(session);
      if (!column) {
        throw new Error('Column not found');
      }
      // borrar tareas que pertenecen a la columna
      await this.taskModel.deleteMany({ columnId }).session(session);

      // borrar la columna y compactar índices superiores
      await this.colModel.deleteOne({ _id: columnId }).session(session);
      await this.colModel.updateMany(
        { index: { $gt: column.index } },
        { $inc: { index: -1 } },
        { session },
      );
      await session.commitTransaction();
      // notificar al cliente que la columna fue eliminada
      this.wsGateway.columnDeleted({
        columnId,
        opId: '',
        clientTs: Date.now(),
      });
      return { ok: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async move(dto: MoveColumnDTO) {
    const session = await this.colModel.db.startSession();
    try {
      // Reubicar columna manteniendo consistencia de índices
      session.startTransaction();

      const column = await this.colModel
        .findById(dto.columnId)
        .session(session);
      if (!column) {
        throw new Error('Column not found');
      }
      const from = column.index;
      const max = await this.colModel.countDocuments();
      // normalizar destino dentro de [0..max-1]
      const to = Math.max(0, Math.min(dto.toIndex, max - 1));
      if (from === to) {
        // sin cambios: confirmar/emitir evento para mantener al cliente informado
        await session.commitTransaction();
        this.wsGateway.columnMove({
          columnId: dto.columnId,
          opId: dto.opId,
          clientTs: dto.clientTs,
          toIndex: to,
        });
        return column;
      }

      if (from < to) {
        // mover indices entre (from..to] una posición a la izquierda (-1)
        await this.colModel.updateMany(
          { index: { $gt: from, $lte: to } },
          { $inc: { index: -1 } },
          { session },
        );
      } else {
        // mover indices entre [to..from) una posición a la derecha (+1)
        await this.colModel.updateMany(
          { index: { $gte: to, $lt: from } },
          { $inc: { index: 1 } },
          { session },
        );
      }

      column.index = to;
      // actualizar, confirmar y notificar al cliente el nuevo índice
      await column.save({ session });
      await session.commitTransaction();
      this.wsGateway.columnMove({
        columnId: dto.columnId,
        opId: dto.opId,
        clientTs: dto.clientTs,
        toIndex: to,
      });
      return column;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
