import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// 确保唯一好友关系
friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model('Friendship', friendshipSchema);