const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g., 'Road', 'Garbage', 'Light'
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    imageUrl: { type: String }, // Storing URL string to keep it simple
    status: {
        type: String,
        enum: ['Reported', 'In Progress', 'Resolved', 'Re-opened'],
        default: 'Reported'
    },
    // New fields for community-driven workflow
    taggedRepresentative: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: {
        message: String,
        imageUrl: String,
        resolvedAt: Date
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', IssueSchema);
