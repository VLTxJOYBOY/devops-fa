const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: function() {
      return this.username || 'Pixora Creator';
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: function() {
      if (this.username) {
        return this.username.includes('@') ? this.username.toLowerCase() : `${this.username.toLowerCase()}@pixora.app`;
      }
      return undefined;
    }
  },
  password: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  // Backward compatibility fields for test suite & legacy queries
  username: { type: String },
  role: { type: String, default: 'user' },
  designation: { type: String },
  area: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Modern Mongoose synchronous hook (no next callback parameter)
UserSchema.pre('validate', function() {
  if (!this.name && this.username) {
    this.name = this.username;
  }
  if (!this.email && this.username) {
    this.email = this.username.includes('@') ? this.username.toLowerCase() : `${this.username.toLowerCase()}@pixora.app`;
  }
});

UserSchema.index({ username: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
