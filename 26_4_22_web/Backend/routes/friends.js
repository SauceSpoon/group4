import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 搜索用户（加好友用）
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.userId }
    }).select('username avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 发送好友申请（简化版：直接成为好友，不需要对方同意）
router.post('/add', auth, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ message: '缺少好友ID' });

    // 检查是否已经是好友
    const existing = await Friendship.findOne({
      $or: [
        { userA: req.userId, userB: friendId },
        { userA: friendId, userB: req.userId }
      ]
    });
    if (existing) return res.status(400).json({ message: '已经是好友' });

    // 创建双向好友关系
    await Friendship.create({ userA: req.userId, userB: friendId });

    res.json({ message: '添加好友成功' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取好友列表
router.get('/', auth, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ userA: req.userId }, { userB: req.userId }]
    }).populate('userA userB', 'username avatar');

    const friends = friendships.map(f => {
      const isUserA = f.userA._id.toString() === req.userId;
      return isUserA ? f.userB : f.userA;
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取和某个好友的聊天记录
router.get('/messages/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: friendId },
        { sender: friendId, receiver: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender receiver', 'username avatar');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;