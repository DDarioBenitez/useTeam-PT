import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from 'src/tasks/task.schema';
import { CreateColumnDTO } from './dtos/createColumnDTO';
import { MoveColumnDTO } from './dtos/moveColumnDTO';
import { Column } from './column.schema';

@Injectable()
export class ColumnService {
  constructor(
    @InjectModel(Column.name) private colModel: Model<Column>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  async list() {
    return this.colModel.find().sort({ index: 1 }).lean();
  }

  async create(dto: CreateColumnDTO) {
    const count = await this.colModel.countDocuments();
    const index = dto.index ?? count;
    const session = await this.colModel.db.startSession();
    await session.withTransaction(async () => {
      await this.colModel.updateMany(
        { index: { $gte: index } },
        { $inc: { index: 1 } },
        { session },
      );
      await this.colModel.create(
        [{ title: dto.title, index, color: dto.color }],
        { session },
      );
    });
    session.endSession();
    return this.colModel.findOne({ index }).lean();
  }

  async remove(columnId: string) {
    const session = await this.colModel.db.startSession();
    try {
      session.startTransaction();
      const column = await this.colModel.findById(columnId).session(session);
      if (!column) {
        throw new Error('Column not found');
      }
      await this.taskModel.deleteMany({ columnId }).session(session);

      await this.colModel.deleteOne({ _id: columnId }).session(session);
      await this.colModel.updateMany(
        { index: { $gt: column.index } },
        { $inc: { index: -1 } },
        { session },
      );
      await session.commitTransaction();
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
      session.startTransaction();

      const column = await this.colModel
        .findById(dto.columnId)
        .session(session);
      if (!column) {
        throw new Error('Column not found');
      }
      const from = column.index;
      const max = await this.colModel.countDocuments();
      const to = Math.max(0, Math.min(dto.toIndex, max - 1));
      if (from === to) {
        await session.commitTransaction();
        return column;
      }

      if (from < to) {
        await this.colModel.updateMany(
          { index: { $gt: from, $lte: to } },
          { $inc: { index: -1 } },
          { session },
        );
      } else {
        await this.colModel.updateMany(
          { index: { $gte: to, $lt: from } },
          { $inc: { index: 1 } },
          { session },
        );
      }

      column.index = to;
      await column.save({ session });
      await session.commitTransaction();
      return column;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
