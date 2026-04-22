import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import friendRoutes from './routes/friends.js';
import Message from './models/Message.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REST API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/friends', friendRoutes);

// ========== Socket.io 实时私信 ==========
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('🟢 用户连接:', socket.id);

  // 用户加入自己的房间（用 userId 当房间名）
  socket.on('join_private', (userId) => {
    socket.join(userId);
    console.log(`用户 ${userId} 加入私人房间`);
  });

  // 发送私信
  socket.on('send_private', async (data) => {
    try {
      const { sender, receiver, content } = data;
      
      const message = new Message({ sender, receiver, content });
      await message.save();

      // 发给双方
      io.to(receiver).to(sender).emit('receive_private', {
        ...data,
        _id: message._id,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('私信保存失败:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 用户断开:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 服务运行在 http://localhost:${PORT}`);
  });
});