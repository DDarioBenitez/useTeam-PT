// src/tasks/task.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './task.schema';
import { ClientSession, Model } from 'mongoose';
import { CreateTaskDTO } from './dtos/createTaskDTO';
import { MoveTaskDTO } from './dtos/moveTaskDTO';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  listByColumn(columnId: string) {
    return this.taskModel.find({ columnId }).sort({ index: 1 }).lean();
  }

  async create(dto: CreateTaskDTO) {
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

    return this.taskModel.findOne({ columnId: dto.columnId, index }).lean();
  }

  async remove(taskId: string) {
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
      return { ok: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async move(dto: MoveTaskDTO) {
    const session = await this.taskModel.db.startSession();
    try {
      session.startTransaction();

      const task = await this.taskModel.findById(dto.taskId).session(session);
      if (!task) throw new Error('Task not found');

      const fromColumnId = task.columnId.toString();
      const fromIndex = task.index;

      const maxDest = await this.taskModel.countDocuments({
        columnId: dto.toColumnId,
      });
      const to = Math.max(
        0,
        Math.min(
          dto.toIndex,
          fromColumnId === dto.toColumnId ? maxDest - 1 : maxDest,
        ),
      );

      if (fromColumnId === dto.toColumnId) {
        if (fromIndex !== to) {
          if (fromIndex < to) {
            await this.taskModel.updateMany(
              { columnId: fromColumnId, index: { $gt: fromIndex, $lte: to } },
              { $inc: { index: -1 } },
              { session },
            );
          } else {
            await this.taskModel.updateMany(
              { columnId: fromColumnId, index: { $gte: to, $lt: fromIndex } },
              { $inc: { index: 1 } },
              { session },
            );
          }
          task.index = to;
          await task.save({ session });
        }
      } else {
        await this.taskModel.updateMany(
          { columnId: fromColumnId, index: { $gt: fromIndex } },
          { $inc: { index: -1 } },
          { session },
        );
        await this.taskModel.updateMany(
          { columnId: dto.toColumnId, index: { $gte: to } },
          { $inc: { index: 1 } },
          { session },
        );
        task.columnId = dto.toColumnId as any; // o new Types.ObjectId(dto.toColumnId)
        task.index = to;
        await task.save({ session });
      }

      await session.commitTransaction();
      return task.toObject();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
