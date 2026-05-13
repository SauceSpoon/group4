import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import friendRoutes from './routes/friends.js';
import Message from './models/Message.js';
import serverless from 'serverless-http';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// 中间件
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/friends', friendRoutes);

// ✅【新增】发送消息 API（不用 Socket.io，直接存数据库）
app.post('/api/messages', async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    const message = new Message({ sender, receiver, content });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const start = async () => {
  await connectDB();
  return serverless(app);
};

export const main = start();