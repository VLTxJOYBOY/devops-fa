const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Image = require('../models/Image');
const auth = require('../middleware/auth');

// GET /api/favorites - Get current user's favorites
router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'image',
        populate: {
          path: 'uploader',
          select: 'name email avatarUrl'
        }
      });

    // Filter out null images if an image was deleted
    const validFavorites = favorites.filter(f => f.image !== null);

    res.json(validFavorites.map(f => ({
      _id: f._id,
      createdAt: f.createdAt,
      image: {
        ...f.image.toObject(),
        isFavorited: true
      }
    })));
  } catch (err) {
    console.error('Fetch Favorites Error:', err);
    res.status(500).json({ message: 'Server error retrieving favorites' });
  }
});

// POST /api/favorites/:imageId - Add to favorites
router.post('/:imageId', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if already favorited
    let favorite = await Favorite.findOne({
      user: req.user.id,
      image: req.params.imageId
    });

    if (favorite) {
      return res.status(200).json({ message: 'Already favorited', favorite, isFavorited: true });
    }

    favorite = new Favorite({
      user: req.user.id,
      image: req.params.imageId
    });

    await favorite.save();

    // Increment favoritesCount
    image.favoritesCount = (image.favoritesCount || 0) + 1;
    await image.save();

    res.status(201).json({
      message: 'Added to favorites',
      favorite,
      favoritesCount: image.favoritesCount,
      isFavorited: true
    });
  } catch (err) {
    console.error('Add Favorite Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    res.status(500).json({ message: 'Server error adding to favorites' });
  }
});

// DELETE /api/favorites/:imageId - Remove from favorites
router.delete('/:imageId', auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      image: req.params.imageId
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite entry not found' });
    }

    // Decrement favoritesCount
    const image = await Image.findById(req.params.imageId);
    if (image && image.favoritesCount > 0) {
      image.favoritesCount -= 1;
      await image.save();
    }

    res.json({
      message: 'Removed from favorites',
      favoritesCount: image ? image.favoritesCount : 0,
      isFavorited: false
    });
  } catch (err) {
    console.error('Remove Favorite Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    res.status(500).json({ message: 'Server error removing favorite' });
  }
});

module.exports = router;
