const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);