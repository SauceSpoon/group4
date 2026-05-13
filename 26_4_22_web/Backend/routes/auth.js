const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db.js');
const { auth } = require('../middleware/auth.js');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus_secret_key_2024';

// 注册
router.post('/register', [
  body('username').trim().isLength({ min: 2, max: 20 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = getPool();
    const { username, email, password } = req.body;
    
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { id: result.insertId, username, email } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const pool = getPool();
    const { email, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT id, username, email, password, avatar FROM users WHERE email = ?',
      [email]
    );
    
    const user = users[0];
    if (!user) return res.status(400).json({ message: '用户不存在' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '密码错误' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email, avatar: user.avatar } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, contact, created_at as createdAt FROM users WHERE id = ?',
      [req.userId]
    );
    
    if (users.length === 0) return res.status(404).json({ message: '用户不存在' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 更新用户资料（直接存 Base64）
router.put('/profile', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { username, avatar } = req.body;
    
    await pool.execute(
      'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
      [username, avatar, req.userId]
    );
    
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, contact FROM users WHERE id = ?',
      [req.userId]
    );
    
    res.json(users[0]);
  } catch (err) {
    console.error('更新资料失败:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;