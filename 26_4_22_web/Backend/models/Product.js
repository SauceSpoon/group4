import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  tag: { 
    type: String, 
    required: true,
    enum: ['数码', '书籍', '出行', '生活', '乐器', '服饰', '美妆', '其他']
  },
  images: [{ type: String }],
  condition: { 
    type: String, 
    enum: ['全新', '九成新', '八成新', '七成新', '战损'],
    default: '九成新'
  },
  status: { 
    type: String, 
    enum: ['在售', '已售', '下架'], 
    default: '在售' 
  },
  location: { type: String, default: '校内' },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ tag: 1, status: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);