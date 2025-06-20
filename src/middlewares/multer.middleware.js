import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory of the backend
const rootDir = path.resolve(__dirname, '../../');

// Create temp directory if it doesn't exist
const tempDir = path.join(rootDir, 'public', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Preserve original filename and add timestamp for uniqueness
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores
        const safeFileName = `${timestamp}-${originalName}`;
        cb(null, safeFileName);
    }
});

// File filter to accept all image formats
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

export { upload };