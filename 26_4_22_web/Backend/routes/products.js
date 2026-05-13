const express = require('express');
const multer = require('multer');
const { getPool } = require('../config/db.js');
const { auth } = require('../middleware/auth.js');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// 处理各种奇怪的 images 格式
const safeParseImages = (images) => {
  // 如果已经是数组
  if (Array.isArray(images)) {
    return images.filter(item => typeof item === 'string');
  }
  
  // 如果是对象
  if (images && typeof images === 'object') {
    const arr = Object.values(images);
    return arr.filter(item => typeof item === 'string');
  }
  
  if (!images || images === '' || images === 'null') return [];
  
  if (typeof images === 'string') {
    // 处理单引号 JSON（MySQL 可能返回单引号）
    const normalized = images.replace(/'/g, '"');
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      if (typeof parsed === 'string') return [parsed];
    } catch {
      // 如果还是失败，尝试直接解析原始字符串
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [images];
      }
    }
  }
  
  return [];
};

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { keyword, tag, minPrice, maxPrice, sort = 'new', page = 1, limit = 12 } = req.query;
    
    let whereClause = 'WHERE status = "在售"';
    const params = [];
    
    if (keyword) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR tag LIKE ?)';
      const pattern = `%${keyword}%`;
      params.push(pattern, pattern, pattern);
    }
    
    if (tag && tag !== '全部') {
      whereClause += ' AND tag = ?';
      params.push(tag);
    }
    
    if (minPrice) {
      whereClause += ' AND price >= ?';
      params.push(Number(minPrice));
    }
    
    if (maxPrice) {
      whereClause += ' AND price <= ?';
      params.push(Number(maxPrice));
    }
    
    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY price ASC';
    if (sort === 'price_desc') orderBy = 'ORDER BY price DESC';
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const [products] = await pool.execute(
      `SELECT p.*, u.username, u.avatar, u.contact 
       FROM products p 
       JOIN users u ON p.seller_id = u.id 
       ${whereClause} ${orderBy} LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );
    
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    
    res.json({
      data: products.map(item => ({
        ...item,
        images: safeParseImages(item.images)
      })),
      pagination: {
        current: Number(page),
        pageSize: Number(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/my-products', auth, async (req, res) => {
  try {
    const pool = getPool();
    const [products] = await pool.execute(
      `SELECT p.*, u.username, u.avatar 
       FROM products p 
       JOIN users u ON p.seller_id = u.id 
       WHERE p.seller_id = ? ORDER BY p.created_at DESC`,
      [req.userId]
    );
    
    res.json(products.map(item => ({
      ...item,
      images: safeParseImages(item.images)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== 修改：加了 u.id as seller_user_id ====================
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [products] = await pool.execute(
      `SELECT p.*, u.id as seller_user_id, u.username, u.avatar, u.contact, u.created_at as seller_created_at
       FROM products p 
       JOIN users u ON p.seller_id = u.id 
       WHERE p.id = ?`,
      [req.params.id]
    );
    
    if (products.length === 0) return res.status(404).json({ message: '商品不存在' });
    
    const product = products[0];
    product.images = safeParseImages(product.images);
    
    await pool.execute('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 改用 JSON 接收 Base64 图片（带日志）
router.post('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    
    // 加日志
    console.log('=== 发布商品 ===');
    console.log('req.body:', req.body);
    console.log('images:', req.body.images);
    console.log('images类型:', typeof req.body.images);
    console.log('images是数组?', Array.isArray(req.body.images));
    
    const { title, description, price, originalPrice, tag, condition, location, images } = req.body;
    
    // 检查 userId
    const userId = parseInt(req.userId);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ message: '用户ID无效' });
    }
    
    // 确保 images 是数组
    const imagesArray = Array.isArray(images) ? images : [];
    const imagesJson = JSON.stringify(imagesArray);
    
    console.log('imagesArray:', imagesArray);
    console.log('imagesJson:', imagesJson);
    
    const [result] = await pool.execute(
      `INSERT INTO products (title, description, price, original_price, tag, images, \`condition\`, location, seller_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || '',
        description || null,
        Number(price) || 0,
        Number(originalPrice) || 0,
        tag || '其他',
        imagesJson,
        condition || '九成新',
        location || '校内',
        userId
      ]
    );
    
    const [products] = await pool.execute(
      `SELECT p.*, u.username, u.avatar FROM products p JOIN users u ON p.seller_id = u.id WHERE p.id = ?`,
      [result.insertId]
    );
    
    const product = products[0];
    product.images = safeParseImages(product.images);
    
    console.log('返回的product.images:', product.images);
    
    res.status(201).json(product);
  } catch (err) {
    console.error('发布错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 编辑也改用 JSON（带日志）
router.put('/:id', auth, async (req, res) => {
  try {
    const pool = getPool();
    
    console.log('=== 编辑商品 ===');
    console.log('req.body:', req.body);
    console.log('images:', req.body.images);
    
    const [check] = await pool.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (check.length === 0 || check[0].seller_id !== parseInt(req.userId)) {
      return res.status(403).json({ message: '无权操作或商品不存在' });
    }

    const { title, description, price, originalPrice, tag, condition, location, status, images } = req.body;
    const updates = [];
    const params = [];
    
    if (title) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
    if (price) { updates.push('price = ?'); params.push(Number(price)); }
    if (originalPrice !== undefined) { updates.push('original_price = ?'); params.push(Number(originalPrice)); }
    if (tag) { updates.push('tag = ?'); params.push(tag); }
    if (condition) { updates.push('`condition` = ?'); params.push(condition); }
    if (location) { updates.push('location = ?'); params.push(location); }
    if (status) { updates.push('status = ?'); params.push(status); }
    
    // 如果有新图片
    if (images && Array.isArray(images)) {
      updates.push('images = ?');
      params.push(JSON.stringify(images));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: '没有要更新的内容' });
    }
    
    params.push(req.params.id);
    
    await pool.execute(
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    const [products] = await pool.execute(
      `SELECT p.*, u.username, u.avatar FROM products p JOIN users u ON p.seller_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    
    const product = products[0];
    product.images = safeParseImages(product.images);
    res.json(product);
  } catch (err) {
    console.error('编辑错误:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = getPool();
    
    const [check] = await pool.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (check.length === 0 || check[0].seller_id !== parseInt(req.userId)) {
      return res.status(403).json({ message: '无权操作或商品不存在' });
    }
    
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;