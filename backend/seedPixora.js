const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Image = require('./models/Image');
const Collection = require('./models/Collection');
const Favorite = require('./models/Favorite');

dotenv.config();

const sampleUsers = [
  {
    name: 'Elena Vance',
    email: 'elena@pixora.app',
    username: 'elena_vance',
    bio: 'Alpine mountaineer and landscape photographer chasing twilight in the Rockies.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@pixora.app',
    username: 'marcus_chen',
    bio: 'Structural architect and street documentarian documenting brutalism and glass towers.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Sofia Rossi',
    email: 'sofia@pixora.app',
    username: 'sofia_rossi',
    bio: 'Capturing candid human emotion, culinary traditions, and Mediterranean wanderlust.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Leo Novak',
    email: 'leo@pixora.app',
    username: 'leo_novak',
    bio: 'Hardware engineer and visual artist exploring cyberpunk minimalism and neon tones.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Demo Photographer',
    email: 'demo@pixora.app',
    username: 'demo_user',
    bio: 'Welcome to Pixora! Feel free to explore, save favorites, and create personal collections.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
  }
];

const sampleImages = [
  // Nature
  {
    title: 'Misty Alpine Ridge at Dawn',
    description: 'Golden sunlight piercing through low-hanging fog in the Swiss Alps.',
    category: 'Nature',
    tags: ['alps', 'mountains', 'sunrise', 'fog', 'landscape'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 0
  },
  {
    title: 'Emerald Forest Glade',
    description: 'Ancient moss-covered redwoods in the Pacific Northwest rainforest.',
    category: 'Nature',
    tags: ['forest', 'redwoods', 'nature', 'moss', 'greenery'],
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 0
  },
  {
    title: 'Turquoise Glacial Waters',
    description: 'Crystalline waters of Lake Louise surrounded by soaring pine forests.',
    category: 'Nature',
    tags: ['lake', 'canada', 'glacial', 'water', 'wilderness'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 0
  },
  {
    title: 'Solitary Desert Dunes',
    description: 'Windswept geometric sand patterns under late afternoon desert heat.',
    category: 'Nature',
    tags: ['desert', 'dunes', 'sand', 'sahara', 'minimalism'],
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 0
  },

  // Architecture
  {
    title: 'Spiral Monolith Staircase',
    description: 'Mesmerizing geometric spiral concrete staircase with dramatic ambient skylight.',
    category: 'Architecture',
    tags: ['minimalism', 'spiral', 'stairs', 'concrete', 'geometry'],
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 1
  },
  {
    title: 'Glass Tower Horizons',
    description: 'Low-angle reflection of sunset skies on mirrored skyscraper facades.',
    category: 'Architecture',
    tags: ['skyscraper', 'glass', 'metropolis', 'facade', 'modern'],
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 1
  },
  {
    title: 'Nordic Concrete Pavilion',
    description: 'Clean Scandinavian lines juxtaposed with raw weathered timber accents.',
    category: 'Architecture',
    tags: ['nordic', 'timber', 'pavilion', 'design', 'structure'],
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 1
  },
  {
    title: 'Historic Cathedral Vaults',
    description: 'Gothic ribbed stone vaulting bathed in diffused stained glass illumination.',
    category: 'Architecture',
    tags: ['gothic', 'cathedral', 'heritage', 'stone', 'vault'],
    imageUrl: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 1
  },

  // Travel
  {
    title: 'Lantern Alleys of Kyoto',
    description: 'Warm glowing paper lanterns illuminating rain-slicked cobbles in Gion.',
    category: 'Travel',
    tags: ['kyoto', 'japan', 'night', 'lanterns', 'street'],
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Pastel Cliffs of Positano',
    description: 'Cascading coastal villas overlooking the Mediterranean azure waters.',
    category: 'Travel',
    tags: ['amalfi', 'italy', 'positano', 'coast', 'ocean'],
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Hot Air Balloons of Cappadocia',
    description: 'Dozens of colorful hot air balloons floating over fairy chimneys at sunrise.',
    category: 'Travel',
    tags: ['turkey', 'cappadocia', 'balloons', 'sunrise', 'adventure'],
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Neon Crossing at Shinjuku',
    description: 'High-energy Tokyo pedestrian crossing under vibrant illuminated billboards.',
    category: 'Travel',
    tags: ['tokyo', 'neon', 'cityscape', 'shinjuku', 'nightlife'],
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },

  // Portraits
  {
    title: 'Cinematic Golden Hour Portrait',
    description: 'Natural rim lighting accentuating expression during autumn sunset.',
    category: 'Portraits',
    tags: ['portrait', 'goldenhour', 'emotion', 'sunlight', 'candid'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Studio Monochromatic Profile',
    description: 'High-contrast black and white dramatic portrait study.',
    category: 'Portraits',
    tags: ['monochrome', 'studio', 'portrait', 'shadows', 'bw'],
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Urban Street Gaze',
    description: 'Candid expressive portrait captured in ambient downtown neon lighting.',
    category: 'Portraits',
    tags: ['street', 'candid', 'people', 'urban', 'expression'],
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },

  // Food
  {
    title: 'Artisan Sourdough Harvest',
    description: 'Freshly baked rustic sourdough bread dusted with organic flour on dark slate.',
    category: 'Food',
    tags: ['bakery', 'sourdough', 'artisan', 'bread', 'rustic'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Single Origin Pour Over',
    description: 'Precision hand-poured Ethiopian specialty coffee in a minimalist ceramic dripper.',
    category: 'Food',
    tags: ['coffee', 'pourover', 'barista', 'morning', 'cafe'],
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },
  {
    title: 'Handcrafted Rigatoni Pasta',
    description: 'Fresh homemade rigatoni pasta tossed with slow-simmered San Marzano tomatoes.',
    category: 'Food',
    tags: ['pasta', 'italian', 'culinary', 'gourmet', 'homemade'],
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 2
  },

  // Technology
  {
    title: 'Minimal Mechanical Workspace',
    description: 'Custom split mechanical keyboard, walnut desk mat, and ultra-wide curved display.',
    category: 'Technology',
    tags: ['workspace', 'desksetup', 'minimalism', 'hardware', 'keyboard'],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 3
  },
  {
    title: 'Silicon Circuit Topology',
    description: 'Extreme macro photograph of modern microchip processor architecture.',
    category: 'Technology',
    tags: ['semiconductor', 'circuits', 'macro', 'chips', 'hardware'],
    imageUrl: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 3
  },
  {
    title: 'Cyberpunk Fiber Glow',
    description: 'High-speed fiber optic data cables glowing with saturated cyan and violet light.',
    category: 'Technology',
    tags: ['fiberoptics', 'datacenter', 'neon', 'cyberpunk', 'network'],
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 3
  },
  {
    title: 'Analog Synthesizer Modules',
    description: 'Vintage patch cables routed between Eurorack modular audio synthesizer oscillators.',
    category: 'Technology',
    tags: ['synthesizer', 'audio', 'eurorack', 'vintage', 'analog'],
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=85',
    uploaderIndex: 3
  }
];

async function seedPixora() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecity';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // Check if Pixora images already seeded
    const existingCount = await Image.countDocuments();
    if (existingCount >= 10) {
      console.log(`Pixora already has ${existingCount} images seeded. Ensuring demo users exist...`);
    }

    const defaultPassword = await bcrypt.hash('password123', 10);
    const createdUsers = [];

    for (const u of sampleUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create({
          ...u,
          password: defaultPassword
        });
        console.log(`Created User: ${user.name} (${user.email})`);
      } else {
        console.log(`User exists: ${user.name}`);
      }
      createdUsers.push(user);
    }

    // Seed images if less than 15 exist
    if (existingCount < 15) {
      console.log('Seeding curated photography collection...');
      const createdImages = [];

      for (const imgData of sampleImages) {
        const uploader = createdUsers[imgData.uploaderIndex] || createdUsers[0];
        const newImg = await Image.create({
          title: imgData.title,
          description: imgData.description,
          category: imgData.category,
          tags: imgData.tags,
          imageUrl: imgData.imageUrl,
          uploader: uploader._id,
          favoritesCount: Math.floor(Math.random() * 45) + 3,
          views: Math.floor(Math.random() * 320) + 20
        });
        createdImages.push(newImg);
      }
      console.log(`Seeded ${createdImages.length} images.`);

      // Create sample collections for Demo user & Elena
      const demoUser = createdUsers[4];
      const natureCol = await Collection.create({
        name: 'Alpine Escapes',
        description: 'Vast mountain peaks, misty pine valleys, and crystal-clear glacial waters.',
        coverImageUrl: createdImages[0].imageUrl,
        owner: demoUser._id,
        images: [createdImages[0]._id, createdImages[1]._id, createdImages[2]._id]
      });

      const techCol = await Collection.create({
        name: 'Cyberpunk & Hardware',
        description: 'Clean workspaces, neon fiber optics, and modular synthesizers.',
        coverImageUrl: createdImages[18].imageUrl,
        owner: demoUser._id,
        images: [createdImages[18]._id, createdImages[19]._id, createdImages[20]._id]
      });

      console.log(`Created collections: "${natureCol.name}", "${techCol.name}"`);

      // Add demo favorites
      await Favorite.create({ user: demoUser._id, image: createdImages[0]._id });
      await Favorite.create({ user: demoUser._id, image: createdImages[4]._id });
      await Favorite.create({ user: demoUser._id, image: createdImages[8]._id });
      console.log('Created sample favorites for Demo User.');
    }

    console.log('Pixora Seeding successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('Pixora Seeding Error:', err);
    process.exit(1);
  }
}

seedPixora();
