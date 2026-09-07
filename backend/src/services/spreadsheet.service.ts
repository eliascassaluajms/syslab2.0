import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { AppError } from '../utils/appError.js';

export type SpreadsheetCell = string | number | boolean | Date | null | undefined;
export type SpreadsheetRow = SpreadsheetCell[];

const normalizarCelda = (valor: ExcelJS.CellValue): SpreadsheetCell => {
  if (valor instanceof Date || typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean' || valor == null) {
    return valor;
  }

  if (typeof valor === 'object' && 'result' in valor) {
    return normalizarCelda(valor.result);
  }

  if (typeof valor === 'object' && 'text' in valor) {
    return valor.text;
  }

  return String(valor);
};

export const leerFilasHoja = async (buffer: Buffer, nombreArchivo: string, hojaPreferida?: string): Promise<SpreadsheetRow[]> => {
  const extension = nombreArchivo.toLowerCase().split('.').pop();
  if (extension === 'xls') {
    throw new AppError('El formato .xls antiguo no es compatible. Guarda el archivo como .xlsx o .csv.', 400);
  }

  const workbook = new ExcelJS.Workbook();
  if (extension === 'csv') {
    await workbook.csv.read(Readable.from([buffer]));
  } else {
    const datos = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    await workbook.xlsx.load(datos as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  }

  const worksheet = hojaPreferida
    ? workbook.worksheets.find((hoja) => hoja.name.trim().toLowerCase() === hojaPreferida.toLowerCase())
      || workbook.worksheets.find((hoja) => hoja.name.toLowerCase().includes(hojaPreferida.toLowerCase()))
    : undefined;
  const hojaSeleccionada = worksheet || workbook.worksheets[0];
  if (!hojaSeleccionada) {
    throw new AppError('El archivo no contiene hojas de datos procesables.', 400);
  }

  const filas: SpreadsheetRow[] = [];
  hojaSeleccionada.eachRow({ includeEmpty: true }, (row) => {
    const valores = Array.isArray(row.values) ? row.values.slice(1) : [];
    filas.push(valores.map((valor) => normalizarCelda(valor as ExcelJS.CellValue)));
  });

  return filas;
};