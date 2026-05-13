const express = require('express');
const { getPool } = require('../config/db.js');
const { auth } = require('../middleware/auth.js');

const router = express.Router();

router.get('/search', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { q } = req.query;
    
    const [users] = await pool.execute(
      `SELECT id, username, avatar FROM users 
       WHERE (username LIKE ? OR email LIKE ?) AND id != ?`,
      [`%${q}%`, `%${q}%`, req.userId]
    );
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { friendId } = req.body;
    
    if (!friendId) return res.status(400).json({ message: '缺少好友ID' });
    
    const [smaller, larger] = [parseInt(req.userId), parseInt(friendId)].sort((a, b) => a - b);
    
    const [existing] = await pool.execute(
      'SELECT id FROM friendships WHERE user_a = ? AND user_b = ?',
      [smaller, larger]
    );
    
    if (existing.length > 0) return res.status(400).json({ message: '已经是好友' });
    
    await pool.execute(
      'INSERT INTO friendships (user_a, user_b) VALUES (?, ?)',
      [smaller, larger]
    );
    
    res.json({ message: '添加好友成功' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    const [friendships] = await pool.execute(
      `SELECT f.*, 
        ua.username as user_a_username, ua.avatar as user_a_avatar,
        ub.username as user_b_username, ub.avatar as user_b_avatar
       FROM friendships f
       JOIN users ua ON f.user_a = ua.id
       JOIN users ub ON f.user_b = ub.id
       WHERE f.user_a = ? OR f.user_b = ?`,
      [req.userId, req.userId]
    );
    
    const friends = friendships.map(f => {
      const isUserA = f.user_a === parseInt(req.userId);
      return {
        _id: isUserA ? f.user_b : f.user_a,
        username: isUserA ? f.user_b_username : f.user_a_username,
        avatar: isUserA ? f.user_b_avatar : f.user_a_avatar
      };
    });
    
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取未读消息统计（必须放在 /messages/:friendId 前面）
router.get('/unread', auth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT sender_id as senderId, COUNT(*) as count 
       FROM messages 
       WHERE receiver_id = ? AND \`read\` = 0
       GROUP BY sender_id`,
      [req.userId]
    );
    
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const byFriend = {};
    rows.forEach(r => {
      byFriend[r.senderId] = r.count;
    });
    
    res.json({ total, byFriend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 标记某好友的消息已读（必须放在 /messages/:friendId 前面）
router.put('/messages/read/:friendId', auth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE messages SET `read` = 1 WHERE sender_id = ? AND receiver_id = ? AND `read` = 0',
      [req.params.friendId, req.userId]
    );
    res.json({ message: '已标记已读' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/messages/:friendId', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { friendId } = req.params;
    
    const [messages] = await pool.execute(
      `SELECT m.*, 
        su.username as sender_username, su.avatar as sender_avatar,
        ru.username as receiver_username, ru.avatar as receiver_avatar
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.receiver_id = ru.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [req.userId, friendId, friendId, req.userId]
    );
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;