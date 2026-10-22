const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  coverImageUrl: { type: String, default: '' },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  createdAt: { type: Date, default: Date.now }
});

CollectionSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Collection', CollectionSchema);
