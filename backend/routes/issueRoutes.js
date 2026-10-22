const express = require('express');
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('taggedRepresentative', 'username designation area')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST create issue
router.post('/', auth, async (req, res) => {
    const { title, description, category, lat, lng, imageUrl } = req.body;
    try {
        const newIssue = new Issue({
            title,
            description,
            category,
            location: { lat, lng },
            imageUrl,
            taggedRepresentative: req.body.taggedRepresentative,
            status: 'Reported'
        });
        const savedIssue = await newIssue.save();
        res.status(201).json(savedIssue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating issue' });
    }
});

// PUT update status (Representative Only)
router.put('/:id/status', auth, async (req, res) => {
    const { status, message, imageUrl } = req.body;

    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        // Check if user is the tagged representative
        if (issue.taggedRepresentative.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized: You are not the tagged representative' });
        }

        issue.status = status;

        // If resolving, add resolution details
        if (status === 'Resolved') {
            issue.resolution = {
                message,
                imageUrl,
                resolvedAt: new Date()
            };
        }

        await issue.save();

        // SOCKET IO: Emit update (no-op in serverless environments like Vercel)
        const io = req.app.get('io');
        if (io) {
            io.emit('statusUpdated', {
                id: issue._id,
                status: issue.status,
                resolution: issue.resolution
            });
        }

        res.json(issue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Update failed' });
    }
});

// PUT upvote
router.put('/:id/upvote', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        // Check if user already upvoted
        if (issue.upvotes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already upvoted' });
        }

        issue.upvotes.push(req.user.id);
        await issue.save();
        res.json(issue);
    } catch (err) {
        res.status(500).json({ message: 'Upvote failed' });
    }
});

// PUT reopen issue (Citizen can dispute "Resolved" status)
router.put('/:id/reopen', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        if (issue.status !== 'Resolved') {
            return res.status(400).json({ message: 'Only resolved issues can be re-opened' });
        }

        issue.status = 'Re-opened';
        // We keep the old resolution data but the status changes
        await issue.save();

        // SOCKET IO: Emit update (no-op in serverless environments like Vercel)
        const io = req.app.get('io');
        if (io) {
            io.emit('statusUpdated', {
                id: issue._id,
                status: issue.status,
                resolution: issue.resolution
            });
        }

        res.json(issue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Re-open failed' });
    }
});

module.exports = router;
