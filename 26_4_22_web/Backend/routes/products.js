import express from 'express';
import multer from 'multer';
import path from 'path';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 图片上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// 获取商品列表（支持搜索、筛选、分页）
router.get('/', async (req, res) => {
  try {
    const { 
      keyword, 
      tag, 
      minPrice, 
      maxPrice, 
      sort = 'new', 
      page = 1, 
      limit = 12 
    } = req.query;

    const query = { status: '在售' };

        if (keyword) {
      // ✅【修改】正则模糊搜索：输入"键盘"能匹配"机械键盘"
      const regex = new RegExp(keyword, 'i'); // 'i' = 忽略大小写
      query.$or = [
        { title: { $regex: regex } },       // 标题包含关键词
        { description: { $regex: regex } },   // 描述包含关键词
        { tag: { $regex: regex } }            // 标签包含关键词
      ];
    }

    if (tag && tag !== '全部') {
      query.tag = tag;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case 'price_asc': sortOption = { price: 1 }; break;
      case 'price_desc': sortOption = { price: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'username avatar contact')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      data: products,
      pagination: {
        current: Number(page),
        pageSize: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username avatar contact createdAt');
    
    if (!product) return res.status(404).json({ message: '商品不存在' });

    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 发布商品（需登录）
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, originalPrice, tag, condition, location } = req.body;
    
    const images = req.files?.map(file => `/uploads/${file.filename}`) || [];
    
    const product = new Product({
      title,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      tag,
      condition: condition || '九成新',
      location: location || '校内',
      images: images.length ? images : [],
      seller: req.userId
    });

    await product.save();
    await product.populate('seller', 'username avatar');
    
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 更新商品
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.userId });
    if (!product) return res.status(403).json({ message: '无权操作或商品不存在' });

    const updates = req.body;
    if (req.files?.length) {
      updates.images = req.files.map(file => `/uploads/${file.filename}`);
    }
    updates.updatedAt = new Date();

    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true }
    ).populate('seller', 'username avatar');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 删除商品
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      seller: req.userId 
    });
    
    if (!product) return res.status(403).json({ message: '无权操作或商品不存在' });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取我发布的商品
router.get('/user/my-products', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .sort({ createdAt: -1 })
      .populate('seller', 'username avatar');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;