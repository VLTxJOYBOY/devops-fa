const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // Create admin user
        const adminUsername = 'admin';
        const adminPassword = 'admin123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin
        const admin = new User({
            username: adminUsername,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
