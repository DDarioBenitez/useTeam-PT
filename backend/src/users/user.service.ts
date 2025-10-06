import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findById(id: string) {
    return this.userModel.findById(id).lean();
  }

  findByUsername(username: string) {
    return this.userModel
      .findOne({ username: username.toLowerCase().trim() })
      .lean();
  }

  async upsertByUsername(username: string) {
    const normalized = username.toLowerCase().trim();
    const now = new Date();
    const doc = await this.userModel
      .findOneAndUpdate(
        { username: normalized },
        { $setOnInsert: { username: normalized, createdAt: now } },
        { new: true, upsert: true },
      )
      .lean();
    return doc;
  }
}
