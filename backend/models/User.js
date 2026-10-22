const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['citizen', 'representative'],
    default: 'citizen'
  },
  // New fields for community representatives
  designation: { type: String }, // e.g., "MLA", "Corporator", "Municipal Officer"
  area: { type: String }         // e.g., "Ward 1", "North Zone"
});

module.exports = mongoose.model('User', UserSchema);
