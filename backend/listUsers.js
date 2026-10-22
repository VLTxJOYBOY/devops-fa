const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const users = await User.find({}, { password: 0 });
        console.log('Users:', users);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
