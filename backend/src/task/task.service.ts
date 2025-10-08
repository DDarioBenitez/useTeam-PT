// src/tasks/task.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './task.schema';
import { ClientSession, Model } from 'mongoose';
import { CreateTaskDTO } from './dtos/createTaskDTO';
import { MoveTaskDTO } from './dtos/moveTaskDTO';
import { WSGateway } from 'src/ws/ws.gateway';

@Injectable()
export class TaskService {
  // Servicio para gestionar tareas: CRUD, reindexado y notificaciones via WebSocket
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @Inject(WSGateway) private wsGateway: WSGateway,
  ) {}

  listByColumn(columnId: string) {
    // Listar tareas de una columna ordenadas por índice
    return this.taskModel.find({ columnId }).sort({ index: 1 }).lean();
  }

  listAll() {
    // Listar todas las tareas ordenadas por índice
    return this.taskModel.find().sort({ index: 1 }).lean();
  }

  async create(dto: CreateTaskDTO) {
    // Crear una tarea en columna: insertar y desplazar índices >= destino
    const count = await this.taskModel.countDocuments({
      columnId: dto.columnId,
    });
    const index = dto.index ?? count;

    const session = await this.taskModel.db.startSession();
    await session.withTransaction(async () => {
      await this.taskModel.updateMany(
        { columnId: dto.columnId, index: { $gte: index } },
        { $inc: { index: 1 } },
        { session },
      );
      await this.taskModel.create([{ ...dto, index }], { session });
    });
    await session.endSession();
    this.wsGateway.taskCreated({ ...dto, index });
    return this.taskModel.findOne({ columnId: dto.columnId, index }).lean();
  }

  async remove(taskId: string) {
    // Eliminar tarea y compactar índices de la columna origen
    const session = await this.taskModel.db.startSession();
    try {
      session.startTransaction();

      const task = await this.taskModel.findById(taskId).session(session);
      if (!task) {
        await session.commitTransaction();
        return { ok: true };
      }

      await this.taskModel.deleteOne({ _id: taskId }).session(session);
      await this.taskModel.updateMany(
        { columnId: task.columnId, index: { $gt: task.index } },
        { $inc: { index: -1 } },
        { session },
      );

      await session.commitTransaction();
      this.wsGateway.taskDeleted({ taskId, opId: '', clientTs: Date.now() });
      return { ok: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async move(dto: MoveTaskDTO) {
    // Mover tarea entre/ dentro de columnas preservando índices sin colisiones
    const session = await this.taskModel.db.startSession();
    const BUMP = 100000; // offset grande, fuera de cualquier índice real

    try {
      session.startTransaction();

      const task = await this.taskModel.findById(dto.taskId).session(session);
      if (!task) throw new Error('Task not found');

      const fromColumnId = task.columnId.toString();
      const fromIndex = task.index;

      const maxDest = await this.taskModel
        .countDocuments({ columnId: dto.toColumnId })
        .session(session);

      // MISMA COLUMNA: toIndex ∈ [0..N-1] ; OTRA COLUMNA: slot ∈ [0..N] (append permitido)
      const to = Math.max(
        0,
        Math.min(
          dto.toIndex,
          fromColumnId === dto.toColumnId ? Math.max(0, maxDest - 1) : maxDest,
        ),
      );

      // 0) Si no hay cambio efectivo, devolvé tal cual
      if (fromColumnId === dto.toColumnId && fromIndex === to) {
        await session.commitTransaction();
        this.wsGateway.taskMove({
          taskId: dto.taskId,
          toColumnId: dto.toColumnId,
          toIndex: to,
          opId: dto.opId,
          clientTs: dto.clientTs,
        });
        return task.toObject();
      }

      // 1) Mover la tarea que se reubica a un índice sentinel para liberar su fromIndex
      await this.taskModel
        .updateOne({ _id: task._id }, { $set: { index: -BUMP } }, { session })
        .exec();

      if (fromColumnId === dto.toColumnId) {
        // ======= MISMA COLUMNA =======
        if (fromIndex < to) {
          // mover hacia abajo: rango (fromIndex, to] debe -1 neto
          const q = {
            columnId: fromColumnId,
            index: { $gt: fromIndex, $lte: to },
          };
          await this.taskModel
            .updateMany(q, { $inc: { index: +BUMP } }, { session })
            .exec();
          await this.taskModel
            .updateMany(q, { $inc: { index: -(BUMP + 1) } }, { session })
            .exec(); // neto: -1
        } else {
          // mover hacia arriba: rango [to, fromIndex) debe +1 neto
          const q = {
            columnId: fromColumnId,
            index: { $gte: to, $lt: fromIndex },
          };
          await this.taskModel
            .updateMany(q, { $inc: { index: +BUMP } }, { session })
            .exec();
          await this.taskModel
            .updateMany(q, { $inc: { index: -(BUMP - 1) } }, { session })
            .exec(); // neto: +1
        }

        // Colocar la tarea en su índice final (ya sin colisiones)
        await this.taskModel
          .updateOne({ _id: task._id }, { $set: { index: to } }, { session })
          .exec();
      } else {
        // ======= OTRA COLUMNA =======

        // 2a) Compactar la columna origen (índices > fromIndex bajan -1 neto)
        {
          const qSrc = { columnId: fromColumnId, index: { $gt: fromIndex } };
          await this.taskModel
            .updateMany(qSrc, { $inc: { index: +BUMP } }, { session })
            .exec();
          await this.taskModel
            .updateMany(qSrc, { $inc: { index: -(BUMP + 1) } }, { session })
            .exec(); // neto: -1
        }

        // 2b) Abrir hueco en destino: desplazar índices >= to hacia arriba
        {
          const qDst = { columnId: dto.toColumnId, index: { $gte: to } };
          await this.taskModel
            .updateMany(qDst, { $inc: { index: +BUMP } }, { session })
            .exec();

          // 2c) Mover la tarea a la col destino en el índice 'to' (sin colisiones)
          await this.taskModel
            .updateOne(
              { _id: task._id },
              { $set: { columnId: dto.toColumnId, index: to } },
              { session },
            )
            .exec();

          // 2d) Normalizar destino (neto +1)
          await this.taskModel
            .updateMany(qDst, { $inc: { index: -(BUMP - 1) } }, { session })
            .exec();
        }
      }

      // Commit de la transacción: todos los cambios son atómicos
      await session.commitTransaction();
      this.wsGateway.taskMove({
        taskId: dto.taskId,
        toColumnId: dto.toColumnId,
        toIndex: to,
        opId: dto.opId,
        clientTs: dto.clientTs,
      });
      const updated = await this.taskModel.findById(task._id).lean();
      return updated!;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
