const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only favorite an image once
FavoriteSchema.index({ user: 1, image: 1 }, { unique: true });
FavoriteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', FavoriteSchema);
