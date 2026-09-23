import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/appError.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'incidencias');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err: any) {
      cb(err, '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = MIME_EXT[file.mimetype] ?? ((path.extname(file.originalname).toLowerCase()) || '.jpg');
    cb(null, `evidencia-${uniqueSuffix}${ext}`);
  },
});

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const allowedTypes = Object.keys(MIME_EXT);

const fileFilter = (_req: any, file: any, cb: any) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Formato no soportado. Adjunte una imagen (JPG/PNG/WEBP/GIF).', 400), false);
  }
};

const uploadIncidencia = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

export const subirEvidenciaIncidencia = uploadIncidencia;
export { uploadDir as incidenciaUploadDir };