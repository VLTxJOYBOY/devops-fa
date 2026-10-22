const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const representatives = [
    // Nashik Municipal Corporation - Ward Corporators
    { username: "corporator_ward1", designation: "Corporator", area: "Ward 1 (Panchavati)" },
    { username: "corporator_ward5", designation: "Corporator", area: "Ward 5 (Nashik Road)" },
    { username: "corporator_ward10", designation: "Corporator", area: "Ward 10 (College Road)" },
    { username: "corporator_ward15", designation: "Corporator", area: "Ward 15 (CIDCO)" },
    { username: "corporator_ward20", designation: "Corporator", area: "Ward 20 (Satpur)" },

    // Assembly Constituency Level (MLAs)
    { username: "mla_nashik_west", designation: "MLA", area: "Nashik West Assembly" },
    { username: "mla_nashik_central", designation: "MLA", area: "Nashik Central Assembly" },
    { username: "mla_nashik_east", designation: "MLA", area: "Nashik East Assembly" },

    // Municipal Corporation Level
    { username: "nmc_commissioner", designation: "Municipal Commissioner", area: "Nashik Municipal Corporation" },
    { username: "nmc_zonal_officer", designation: "Zonal Officer", area: "Zone 1 (East Nashik)" }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecity');
        console.log("Connected to MongoDB...");

        const password = await bcrypt.hash("password123", 10);

        for (const rep of representatives) {
            const exists = await User.findOne({ username: rep.username });
            if (!exists) {
                await User.create({
                    username: rep.username,
                    password,
                    role: 'representative',
                    designation: rep.designation,
                    area: rep.area
                });
                console.log(`Created: ${rep.username} (${rep.area})`);
            } else {
                console.log(`Skipped: ${rep.username} (Exists)`);
            }
        }

        console.log("Seeding complete!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
