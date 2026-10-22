const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const Favorite = require('../models/Favorite');
const Collection = require('../models/Collection');
const auth = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

// GET /api/images/search?q=...
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q = '', page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const regex = new RegExp(q.trim(), 'i');
    const filter = {
      $or: [
        { title: regex },
        { description: regex },
        { tags: { $in: [regex] } },
        { category: regex }
      ]
    };

    const total = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .populate('uploader', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    let userFavorites = new Set();
    if (req.user && req.user.id) {
      const favs = await Favorite.find({ user: req.user.id }).select('image');
      userFavorites = new Set(favs.map(f => f.image.toString()));
    }

    const enhancedImages = images.map(img => ({
      ...img,
      isFavorited: userFavorites.has(img._id.toString())
    }));

    res.json({
      images: enhancedImages,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (err) {
    console.error('Search Images Error:', err);
    res.status(500).json({ message: 'Server error searching images' });
  }
});

// GET /api/images - Explore feed with search, category filtering, and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, q, search, sort = 'newest', page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    const searchTerm = (q || search || '').trim();
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { tags: { $in: [regex] } },
        { category: regex }
      ];
    }

    const sortOption = sort === 'popular'
      ? { favoritesCount: -1, views: -1, createdAt: -1 }
      : { createdAt: -1 };

    const total = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .populate('uploader', 'name email avatarUrl bio')
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    let userFavorites = new Set();
    if (req.user && req.user.id) {
      const favs = await Favorite.find({ user: req.user.id }).select('image');
      userFavorites = new Set(favs.map(f => f.image.toString()));
    }

    const enhancedImages = images.map(img => ({
      ...img,
      isFavorited: userFavorites.has(img._id.toString())
    }));

    res.json({
      images: enhancedImages,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (err) {
    console.error('Fetch Images Error:', err);
    res.status(500).json({ message: 'Server error retrieving images' });
  }
});

// GET /api/images/:id - Image details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('uploader', 'name email avatarUrl bio');

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    let isFavorited = false;
    if (req.user && req.user.id) {
      const fav = await Favorite.findOne({ user: req.user.id, image: image._id });
      isFavorited = Boolean(fav);
    }

    res.json({
      ...image.toObject(),
      isFavorited
    });
  } catch (err) {
    console.error('Fetch Image Details Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/images - Upload image (multipart/form-data or body imageUrl)
router.post('/', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, description, category, tags, imageUrl } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let finalImageUrl = imageUrl;
    let cloudinaryPublicId = '';

    if (req.file) {
      // Authenticated Cloudinary upload with dev fallback
      const uploadResult = await uploadImage(req.file);
      finalImageUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } else if (!finalImageUrl) {
      return res.status(400).json({ message: 'Please upload an image file or provide an imageUrl' });
    }

    // Process tags
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      processedTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const validCategories = ['Nature', 'Architecture', 'Travel', 'Portraits', 'Food', 'Technology', 'Other'];
    const finalCategory = validCategories.includes(category) ? category : 'Nature';

    const newImage = new Image({
      title: title.trim(),
      description: (description || '').trim(),
      imageUrl: finalImageUrl,
      cloudinaryPublicId,
      category: finalCategory,
      tags: processedTags,
      uploader: req.user.id
    });

    await newImage.save();
    const populated = await newImage.populate('uploader', 'name email avatarUrl bio');

    // Notify connected clients via WebSocket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('image:created', populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('Image Upload Error:', err);
    res.status(500).json({ message: 'Server error processing image upload' });
  }
});

// DELETE /api/images/:id - Delete image (Only owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check ownership
    if (image.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own images' });
    }

    // Remove asset from Cloudinary or local dev storage
    if (image.cloudinaryPublicId) {
      await deleteImage(image.cloudinaryPublicId);
    }

    // Cleanup favorites and collection references
    await Favorite.deleteMany({ image: image._id });
    await Collection.updateMany(
      { images: image._id },
      { $pull: { images: image._id } }
    );

    await Image.findByIdAndDelete(image._id);

    // Notify connected clients via WebSocket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('image:deleted', { id: req.params.id });
    }

    res.json({ message: 'Image deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete Image Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    res.status(500).json({ message: 'Server error deleting image' });
  }
});

module.exports = router;
