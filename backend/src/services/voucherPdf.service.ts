import PDFDocument from 'pdfkit';

interface VoucherData {
  nombre: string;
  apellido: string;
  correo: string;
  evento: string;
  codigoTransaccion: string;
  monto?: string | number;
  fecha: string;
}

export class VoucherPdfService {
  static generarVoucher(data: VoucherData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(12).text('UNIVERSIDAD AUTONOMA JUAN MISAEL SARACHO', { align: 'center' });
      doc.fontSize(10).text('FACULTAD DE INGENIERIA DE RECURSOS NATURALES Y TECNOLOGIAS (FIRNT)', { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text('COMPROBANTE DE PREINSCRIPCION', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Fecha de emision: ${data.fecha}`, { align: 'center' });
      doc.moveDown(2);

      doc.rect(40, doc.y, 515, 180).stroke();
      doc.x = 60;
      doc.fontSize(11);
      doc.font('Helvetica').text('Participante: ', { continued: true }).font('Helvetica-Bold').text(`${data.nombre} ${data.apellido}`);
      doc.moveDown(0.5);
      doc.font('Helvetica').text('Correo electronico: ', { continued: true }).font('Helvetica-Bold').text(data.correo);
      doc.moveDown(0.5);
      doc.font('Helvetica').text('Evento / Congreso: ', { continued: true }).font('Helvetica-Bold').text(data.evento);
      doc.moveDown(0.5);
      doc.font('Helvetica').text('N. de transaccion: ', { continued: true }).font('Helvetica-Bold').text(data.codigoTransaccion);
      doc.moveDown(0.5);
      doc.font('Helvetica').text('Monto registrado: ', { continued: true }).font('Helvetica-Bold').text(`Bs. ${data.monto ?? '0.00'}`);

      doc.moveDown(4);
      doc.fontSize(9).fillColor('gray').text(
        'Este documento sirve como constancia preliminar de preinscripcion. El area administrativa validara el deposito bancario para emitir el certificado oficial.',
        { align: 'center' },
      );

      doc.end();
    });
  }
}