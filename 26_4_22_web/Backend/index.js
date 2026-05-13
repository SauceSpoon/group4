const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB } = require('./config/db.js');
const authRoutes = require('./routes/auth.js');
const productRoutes = require('./routes/products.js');
const friendRoutes = require('./routes/friends.js');
const { getPool } = require('./config/db.js');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/friends', friendRoutes);

// 发送消息（支持图片）
app.post('/api/messages', async (req, res) => {
  try {
    const pool = getPool();
    const { sender, receiver, content, images } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO messages (sender_id, receiver_id, content, images) VALUES (?, ?, ?, ?)',
      [sender, receiver, content || '', JSON.stringify(images || [])]
    );
    
    const [messages] = await pool.execute(
      `SELECT m.*, su.username as sender_username, su.avatar as sender_avatar,
        ru.username as receiver_username, ru.avatar as receiver_avatar
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.receiver_id = ru.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(messages[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

let dbReady = false;

const start = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
  return serverless(app);
};

exports.main = async (event, context) => {
  const handler = await start();
  return handler(event, context);
};