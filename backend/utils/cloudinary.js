const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads an image buffer or file to Cloudinary, with local filesystem dev fallback
 * @param {Object} file - Multer file object
 * @returns {Promise<{ url: string, publicId: string, isFallback: boolean }>}
 */
async function uploadImage(file) {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pixora_uploads',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            isFallback: false
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Development Fallback: write to uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFileSync(filepath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: `local_${filename}`,
    isFallback: true
  };
}

/**
 * Deletes an image asset from Cloudinary or local dev storage
 * @param {string} publicId - Cloudinary publicId or local filename
 */
async function deleteImage(publicId) {
  if (!publicId) return;

  if (isCloudinaryConfigured && !publicId.startsWith('local_')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn(`[Cloudinary] Failed to delete asset ${publicId}:`, err.message);
    }
    return;
  }

  // Local cleanup if dev fallback
  if (publicId.startsWith('local_')) {
    const filename = publicId.replace('local_', '');
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.warn(`[Local Dev Upload] Failed to delete file ${filename}:`, err.message);
      }
    }
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadImage,
  deleteImage
};
