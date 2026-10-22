const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, avatarUrl, bio } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Determine normalized email and name
    const finalEmail = (email || (username ? (username.includes('@') ? username : `${username}@pixora.app`) : '')).trim().toLowerCase();
    const finalName = (name || username || finalEmail.split('@')[0] || 'User').trim();
    const finalUsername = (username || finalEmail.split('@')[0]).trim();

    if (!finalEmail) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    // Check if user already exists
    const query = { $or: [{ email: finalEmail }] };
    if (finalUsername) {
      query.$or.push({ username: finalUsername });
    }
    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: finalName,
      email: finalEmail,
      username: finalUsername,
      password: hashedPassword,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalName)}`,
      bio: bio || '',
      role: req.body.role || 'citizen'
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email },
      process.env.JWT_SECRET || 'test_secret_key_12345',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      userId: newUser._id,
      role: newUser.role,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
        bio: newUser.bio
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide credentials' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'test_secret_key_12345',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      userId: user._id,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CURRENT USER (/api/auth/me)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Fetch Current User Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all representatives (backward compatibility for civic tests)
router.get('/representatives', async (req, res) => {
  try {
    const reps = await User.find({ role: 'representative' }).select('username designation area');
    res.json(reps);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
