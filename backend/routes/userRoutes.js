const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Image = require('../models/Image');
const Collection = require('../models/Collection');

// GET /api/users/:id - Public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const uploadCount = await Image.countDocuments({ uploader: user._id });
    const collectionsCount = await Collection.countDocuments({ owner: user._id });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      uploadCount,
      collectionsCount
    });
  } catch (err) {
    console.error('Fetch User Profile Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/images - Images uploaded by user
router.get('/:id/images', async (req, res) => {
  try {
    const images = await Image.find({ uploader: req.params.id })
      .populate('uploader', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(images);
  } catch (err) {
    console.error('Fetch User Images Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
