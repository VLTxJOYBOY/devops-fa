const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  imageUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['Nature', 'Architecture', 'Travel', 'Portraits', 'Food', 'Technology', 'Other'],
    default: 'Nature'
  },
  tags: [{ type: String, trim: true }],
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  favoritesCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for search and category filtering
ImageSchema.index({ category: 1, createdAt: -1 });
ImageSchema.index({ title: 'text', description: 'text', tags: 'text' });
ImageSchema.index({ uploader: 1, createdAt: -1 });

module.exports = mongoose.model('Image', ImageSchema);
