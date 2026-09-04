import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/appError.js';

const uploadDir = 'public/uploads/comprobantes';

// Asegurar que el directorio exista físicamente en el contenedor
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `comprobante-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Formato no soportado. Suba una imagen (JPG/PNG/WEBP) o un PDF.', 400), false);
  }
};

export const uploadComprobante = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

export const uploadComprobanteMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

export const uploadComprobanteMiddleware = uploadComprobante;

