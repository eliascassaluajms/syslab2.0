import Tesseract from 'tesseract.js';

export interface DatosTransaccionOCR {
  monto?: string;
  nroOrden?: string;
  fecha?: string;
  nroDocumento?: string;
  ctaDestino?: string;
}

export async function extraerDatosComprobante(filePath: string): Promise<DatosTransaccionOCR> {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'spa', {
      logger: () => {} 
    });

    // Normalizar espacios y saltos de línea múltiples para una lectura robusta de la grilla
    const textoCompleto = text.replace(/\s+/g, ' ');
    const resultado: DatosTransaccionOCR = {};

    // 1. Monto (Ej: "Monto: 10.00")
    const matchMonto = textoCompleto.match(/(?:Monto|Bs\.?|BOB)\W*([\d]+\.[\d]{2})/i);
    if (matchMonto?.[1]) resultado.monto = matchMonto[1];

    // 2. Número de Orden (Ej: "Nro. Orden: 10142026083007527225")
    const matchOrden = textoCompleto.match(/(?:Orden|Nro\.?\s*Orden)\W*(\d{10,})/i);
    if (matchOrden?.[1]) resultado.nroOrden = matchOrden[1];

    // 3. Fecha y Hora (Ej: "30/08/2026 07:52")
    const matchFecha = textoCompleto.match(/(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?)/);
    if (matchFecha?.[1]) resultado.fecha = matchFecha[1];

    // 4. Nro de Documento (Ej: "Nro Documento: 571843969")
    const matchDoc = textoCompleto.match(/(?:Documento|Nro\.?\s*Documento)\W*(\d+)/i);
    if (matchDoc?.[1]) resultado.nroDocumento = matchDoc[1];

    // 5. Cuenta Destino
    const matchCta = textoCompleto.match(/(?:Cta\.?\s*Destino|Destino)\W*(\d{10,})/i);
    if (matchCta?.[1]) resultado.ctaDestino = matchCta[1];

    return resultado;
  } catch (error) {
    console.error('Error al procesar OCR en la imagen:', error);
    return {};
  }
}
