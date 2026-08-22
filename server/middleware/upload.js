// middleware/upload.js
// Multer keeps files in memory; routes forward the buffer to Cloudinary (see utils/cloudinary.js).
import multer from 'multer';

const storage = multer.memoryStorage();

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Use JPG, PNG, WEBP, or PDF.'));
    }
    cb(null, true);
  },
});
