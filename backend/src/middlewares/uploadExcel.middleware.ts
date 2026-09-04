import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError.js';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
  ];
  const allowedExtensions = /\.(xlsx|xls|csv)$/i;

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
    cb(null, true);
    return;
  }

  cb(new AppError(
    'Formato inválido. Solo se admiten archivos Excel (.xlsx, .xls) o CSV del extracto bancario.',
    400,
  ));
};

export const uploadExtracto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
