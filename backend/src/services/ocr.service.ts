import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs/promises';

export interface ResultadoOCR {
  codigoTransaccion: string | null;
  monto: number | null;
  comprobanteUrl: string;
  fechaTexto?: string | null;
  textoCompleto: string;
}

export interface DatosTransaccionOCR {
  monto?: string;
  nroOrden?: string;
  fecha?: string;
  nroDocumento?: string;
  ctaDestino?: string;
}

export const guardarComprobante = async (buffer: Buffer, filename: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes');
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);
  
  // Retorna la URL relativa que se almacena en la base de datos
  return `/comprobantes/${filename}`;
};

export class OcrParserService {
  /**
   * Extrae el código de transacción o número de operación bancaria
   */
  static extraerCodigoTransaccion(texto: string): string | null {
    const regexTransaccion = /(?:transacci[oó]n|operaci[oó]n|nro\.?\s*orden|nro\.?\s*doc(?:umento)?|nro\.?|comprobante|c[oó]digo|id|ref(?:erencia)?)\s*[:#=\-]?\s*([A-Z0-9]{6,25})/i;
    const match = texto.match(regexTransaccion);
    if (match && match[1]) {
      const val = match[1].trim();
      if (!/^(transaccion|operacion|comprobante|codigo|numero|orden)$/i.test(val)) {
        return val;
      }
    }

    // Respaldo para secuencias numéricas largas típicas de transferencias QR
    const matchDigitos = texto.match(/\b\d{6,25}\b/);
    return matchDigitos ? matchDigitos[0] : null;
  }

  /**
   * Extrae el importe/monto transferido
   */
  static extraerMonto(texto: string): number | null {
    // Normalizar saltos de línea y dobles espacios
    const cleanText = texto.replace(/\r\n/g, ' ').replace(/\s+/g, ' ');

    // 1. Patrón prioritario: Palabra clave + Moneda opcional + Cifra decimal
    // Ej: "Importe: 50.00", "Monto: Bs. 120,50", "Total pagado: BOB 35.00"
    const regexConEtiqueta = /(?:monto|importe|total|pagado|transferido|valor)\s*(?:transferencia)?\s*[:=\-]?\s*(?:bs\.?|bob)?\s*([0-9]{1,5}(?:[.,][0-9]{2}))/i;
    const matchEtiqueta = cleanText.match(regexConEtiqueta);

    if (matchEtiqueta && matchEtiqueta[1]) {
      const valorNormalizado = matchEtiqueta[1].replace(',', '.');
      const num = parseFloat(valorNormalizado);
      if (!isNaN(num) && num > 0) return num;
    }

    // 2. Patrón secundario: Prefijo de moneda directo
    // Ej: "Bs. 50.00", "Bs 100", "BOB 25.50"
    const regexMoneda = /(?:bs\.?|bob)\s*([0-9]{1,5}(?:[.,][0-9]{2})?)/gi;
    let matchMoneda;
    const montosEncontrados: number[] = [];

    while ((matchMoneda = regexMoneda.exec(cleanText)) !== null) {
      if (matchMoneda[1]) {
        const valorNormalizado = matchMoneda[1].replace(',', '.');
        const num = parseFloat(valorNormalizado);
        if (!isNaN(num) && num > 0) montosEncontrados.push(num);
      }
    }

    // Retorna el primer monto válido encontrado con prefijo de moneda
    return montosEncontrados.length > 0 ? montosEncontrados[0] : null;
  }

  /**
   * Procesa la respuesta global de OCR y estructura los datos
   */
  static procesarTexto(textoOCR: string, comprobanteUrl: string): ResultadoOCR {
    return {
      codigoTransaccion: this.extraerCodigoTransaccion(textoOCR),
      monto: this.extraerMonto(textoOCR),
      comprobanteUrl,
      textoCompleto: textoOCR,
    };
  }
}

export async function extraerDatosComprobante(filePath: string): Promise<DatosTransaccionOCR> {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'spa', {
      logger: () => {} 
    });

    const textoCompleto = text.replace(/\s+/g, ' ');
    const resultado: DatosTransaccionOCR = {};

    const montoNum = OcrParserService.extraerMonto(text);
    if (montoNum !== null) resultado.monto = montoNum.toFixed(2);

    const transaccion = OcrParserService.extraerCodigoTransaccion(text);
    if (transaccion) {
      resultado.nroOrden = transaccion;
      resultado.nroDocumento = transaccion;
    }

    const matchFecha = textoCompleto.match(/(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?)/);
    if (matchFecha?.[1]) resultado.fecha = matchFecha[1];

    const matchCta = textoCompleto.match(/(?:Cta\.?\s*Destino|Destino)\W*(\d{10,})/i);
    if (matchCta?.[1]) resultado.ctaDestino = matchCta[1];

    return resultado;
  } catch (error) {
    console.error('Error al procesar OCR en la imagen:', error);
    return {};
  }
}
