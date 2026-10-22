const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Image = require('../models/Image');
const auth = require('../middleware/auth');

// GET /api/collections - Get user's collections (or public collections)
router.get('/', auth, async (req, res) => {
  try {
    const collections = await Collection.find({ owner: req.user.id })
      .populate('owner', 'name email avatarUrl')
      .populate('images')
      .sort({ createdAt: -1 });

    res.json(collections);
  } catch (err) {
    console.error('Fetch Collections Error:', err);
    res.status(500).json({ message: 'Server error retrieving collections' });
  }
});

// POST /api/collections - Create new collection
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, coverImageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Collection name is required' });
    }

    const newCollection = new Collection({
      name: name.trim(),
      description: (description || '').trim(),
      coverImageUrl: coverImageUrl || '',
      owner: req.user.id,
      images: []
    });

    await newCollection.save();
    const populated = await newCollection.populate('owner', 'name email avatarUrl');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create Collection Error:', err);
    res.status(500).json({ message: 'Server error creating collection' });
  }
});

// GET /api/collections/:id - Get collection details
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('owner', 'name email avatarUrl bio')
      .populate({
        path: 'images',
        populate: {
          path: 'uploader',
          select: 'name email avatarUrl'
        }
      });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(collection);
  } catch (err) {
    console.error('Fetch Collection Details Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid collection ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/collections/:id - Update collection details
router.patch('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this collection' });
    }

    const { name, description, coverImageUrl } = req.body;
    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description.trim();
    if (coverImageUrl !== undefined) collection.coverImageUrl = coverImageUrl.trim();

    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error('Update Collection Error:', err);
    res.status(500).json({ message: 'Server error updating collection' });
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this collection' });
    }

    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete Collection Error:', err);
    res.status(500).json({ message: 'Server error deleting collection' });
  }
});

// POST /api/collections/:id/images/:imageId - Add image to collection
router.post('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this collection' });
    }

    const image = await Image.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const exists = collection.images.some(id => id.toString() === req.params.imageId);
    if (exists) {
      return res.status(200).json({ message: 'Image already in collection', collection });
    }

    collection.images.push(image._id);
    if (!collection.coverImageUrl) {
      collection.coverImageUrl = image.imageUrl;
    }

    await collection.save();
    res.status(201).json({ message: 'Image added to collection', collection });
  } catch (err) {
    console.error('Add Image to Collection Error:', err);
    res.status(500).json({ message: 'Server error adding image to collection' });
  }
});

// DELETE /api/collections/:id/images/:imageId - Remove image from collection
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this collection' });
    }

    collection.images = collection.images.filter(
      id => id.toString() !== req.params.imageId
    );

    await collection.save();
    res.json({ message: 'Image removed from collection', collection });
  } catch (err) {
    console.error('Remove Image from Collection Error:', err);
    res.status(500).json({ message: 'Server error removing image from collection' });
  }
});

module.exports = router;
