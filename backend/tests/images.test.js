const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./testApp');
const User = require('../models/User');
const Image = require('../models/Image');
const Favorite = require('../models/Favorite');
const Collection = require('../models/Collection');

process.env.JWT_SECRET = 'test_secret_key_12345';

let mongoServer;
let user1Token, user1Id;
let user2Token, user2Id;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Image.deleteMany({});
  await Favorite.deleteMany({});
  await Collection.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  const u1 = await User.create({
    name: 'Alice Photographer',
    email: 'alice@example.com',
    username: 'alice',
    password: hashedPassword,
    bio: 'Landscape enthusiast'
  });
  user1Id = u1._id.toString();
  user1Token = jwt.sign({ id: user1Id, email: u1.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

  const u2 = await User.create({
    name: 'Bob Urban',
    email: 'bob@example.com',
    username: 'bob',
    password: hashedPassword,
    bio: 'City explorer'
  });
  user2Id = u2._id.toString();
  user2Token = jwt.sign({ id: user2Id, email: u2.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
});

describe('Pixora Platform API Endpoints', () => {

  describe('GET /api/auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('alice@example.com');
      expect(res.body.name).toBe('Alice Photographer');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Images Management (/api/images)', () => {
    let testImageId;

    beforeEach(async () => {
      const img = await Image.create({
        title: 'Alpine Sunrise',
        description: 'Golden morning light over snow peaks',
        category: 'Nature',
        tags: ['mountains', 'sunrise', 'snow'],
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        uploader: user1Id
      });
      testImageId = img._id.toString();

      await Image.create({
        title: 'Modern Skyscraper',
        description: 'Architectural lines in glass and steel',
        category: 'Architecture',
        tags: ['urban', 'building', 'city'],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        uploader: user2Id
      });
    });

    it('should list all images on the explore route', async () => {
      const res = await request(app).get('/api/images');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('images');
      expect(res.body.images.length).toBe(2);
      expect(res.body.total).toBe(2);
    });

    it('should filter images by category', async () => {
      const res = await request(app).get('/api/images?category=Architecture');
      expect(res.statusCode).toBe(200);
      expect(res.body.images.length).toBe(1);
      expect(res.body.images[0].title).toBe('Modern Skyscraper');
    });

    it('should search images by query', async () => {
      const res = await request(app).get('/api/images/search?q=sunrise');
      expect(res.statusCode).toBe(200);
      expect(res.body.images.length).toBe(1);
      expect(res.body.images[0].title).toBe('Alpine Sunrise');
    });

    it('should retrieve individual image details and increment views', async () => {
      const res = await request(app).get(`/api/images/${testImageId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Alpine Sunrise');
      expect(res.body.uploader).toHaveProperty('name', 'Alice Photographer');
      expect(res.body.views).toBe(1);
    });

    it('should create a new image when authenticated', async () => {
      const res = await request(app)
        .post('/api/images')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Forest Trail',
          description: 'Misty redwoods path',
          category: 'Nature',
          tags: 'forest, trees, fog',
          imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Forest Trail');
      expect(res.body.tags).toEqual(['forest', 'trees', 'fog']);
      expect(res.body.uploader._id.toString()).toBe(user1Id);
    });

    it('should allow image owner to delete their image', async () => {
      const res = await request(app)
        .delete(`/api/images/${testImageId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      const inDb = await Image.findById(testImageId);
      expect(inDb).toBeNull();
    });

    it('should prevent non-owners from deleting an image', async () => {
      const res = await request(app)
        .delete(`/api/images/${testImageId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Favorites System (/api/favorites)', () => {
    let image;

    beforeEach(async () => {
      image = await Image.create({
        title: 'Night Sky Panorama',
        description: 'Milky way over desert rock',
        category: 'Nature',
        tags: ['stars', 'galaxy'],
        imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
        uploader: user1Id
      });
    });

    it('should add an image to favorites and increment favoritesCount', async () => {
      const res = await request(app)
        .post(`/api/favorites/${image._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.favoritesCount).toBe(1);

      const favsRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(favsRes.statusCode).toBe(200);
      expect(favsRes.body.length).toBe(1);
      expect(favsRes.body[0].image.title).toBe('Night Sky Panorama');
    });

    it('should remove an image from favorites and decrement count', async () => {
      await request(app)
        .post(`/api/favorites/${image._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      const removeRes = await request(app)
        .delete(`/api/favorites/${image._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(removeRes.statusCode).toBe(200);
      expect(removeRes.body.favoritesCount).toBe(0);
    });
  });

  describe('Collections System (/api/collections)', () => {
    let image;

    beforeEach(async () => {
      image = await Image.create({
        title: 'Tokyo Rain',
        description: 'Neon reflections on wet asphalt',
        category: 'Travel',
        tags: ['tokyo', 'japan', 'neon'],
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
        uploader: user2Id
      });
    });

    it('should create and retrieve user collections', async () => {
      const createRes = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Urban Aesthetics',
          description: 'A curated selection of modern city life'
        });

      expect(createRes.statusCode).toBe(201);
      const colId = createRes.body._id;

      // Add image to collection
      const addRes = await request(app)
        .post(`/api/collections/${colId}/images/${image._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(addRes.statusCode).toBe(201);

      // Fetch collection details
      const detailRes = await request(app).get(`/api/collections/${colId}`);
      expect(detailRes.statusCode).toBe(200);
      expect(detailRes.body.images.length).toBe(1);
      expect(detailRes.body.images[0].title).toBe('Tokyo Rain');
    });
  });

  describe('User Profile and Uploads (/api/users)', () => {
    it('should return user stats and their uploads', async () => {
      await Image.create({
        title: 'Desert Dunes',
        category: 'Travel',
        imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9',
        uploader: user1Id
      });

      const profileRes = await request(app).get(`/api/users/${user1Id}`);
      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.uploadCount).toBe(1);

      const imagesRes = await request(app).get(`/api/users/${user1Id}/images`);
      expect(imagesRes.statusCode).toBe(200);
      expect(imagesRes.body.length).toBe(1);
      expect(imagesRes.body[0].title).toBe('Desert Dunes');
    });
  });
});
