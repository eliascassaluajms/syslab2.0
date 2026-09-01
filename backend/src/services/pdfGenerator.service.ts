import { createRequire } from 'module';
import { AppError } from '../utils/appError.js';

const require = createRequire(import.meta.url);

// Extractor compatible con pdfmake 0.3.x (CJS, ESM, exportaciones nombradas e instancia server)
const getPdfPrinterConstructor = () => {
  const mod = require('pdfmake');
  if (typeof mod === 'function') return mod;
  if (typeof mod.PdfPrinter === 'function') return mod.PdfPrinter;
  if (typeof mod.default === 'function') return mod.default;
  if (mod.default && typeof mod.default.PdfPrinter === 'function') return mod.default.PdfPrinter;

  if (mod && typeof mod.createPdf === 'function') {
    return class {
      private pdfmakeInstance: any;
      constructor(fonts: any) {
        this.pdfmakeInstance = mod;
        if (typeof mod.setFonts === 'function') {
          mod.setFonts(fonts);
        }
      }

      createPdfKitDocument(docDefinition: any) {
        const pdfObj = this.pdfmakeInstance.createPdf(docDefinition);
        return {
          on: (event: string, callback: (...args: any[]) => void) => {
            if (event === 'data') {
              pdfObj.getBuffer().then((buf: Buffer) => {
                callback(buf);
              }).catch(() => {});
            } else if (event === 'end') {
              pdfObj.getBuffer().then(() => {
                callback();
              }).catch(() => {});
            } else if (event === 'error') {
              pdfObj.getBuffer().catch((err: any) => {
                callback(err);
              });
            }
          },
          end: () => {},
        };
      }
    };
  }

  throw new AppError(`No se pudo resolver el constructor de pdfmake. Exportaciones: ${Object.keys(mod || {})}`, 500);
};

// Mapeo de fuentes estándar (Helvetica / Roboto alias)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

export class PdfGeneratorService {
  async generarPlanillaAsistencia(sesionInput: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const PrinterClass = getPdfPrinterConstructor();
        const printer = new PrinterClass(fonts);

        const sesion = sesionInput?.sesion || sesionInput || {};
        const asistenciasList = sesionInput?.asistencias || sesion?.asistencias || [];

        const fechaStr = sesion.fechaInicio || sesion.fecha
          ? new Date(sesion.fechaInicio || sesion.fecha).toLocaleDateString('es-BO')
          : 'N/A';
        const horaInicioStr = sesion.horaInicio || (sesion.fechaInicio
          ? new Date(sesion.fechaInicio).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
          : 'N/A');
        const horaFinStr = sesion.horaFin || (sesion.fechaFin
          ? new Date(sesion.fechaFin).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
          : 'En curso / Sin finalizar');

        const docenteNombre = sesion.docente
          ? `${sesion.docente.nombre || ''} ${sesion.docente.apellido || ''}`.trim()
          : (sesion.nombreAyudante || 'Docente Responsable');
        const materiaNombre = sesion.materiaNombre || sesion.materia?.nombre || 'Práctica Libre / Taller';
        const labNombre = sesion.laboratorio?.nombre || 'Laboratorio';

        const filasAsistentes = (asistenciasList || []).map((asist: any, idx: number) => [
          { text: (idx + 1).toString(), alignment: 'center', fontSize: 9 },
          { text: asist.estudiante?.registroUniversitario || asist.estudiante?.ru || asist.estudiante?.correo || 'S/R', fontSize: 9 },
          { text: `${asist.estudiante?.apellido || ''} ${asist.estudiante?.nombre || ''}`.trim() || asist.estudiante?.nombre || 'Estudiante', fontSize: 9 },
          { text: asist.equipo?.codigoPatrimonial || asist.equipo?.nombre || 'General / Propio', fontSize: 9 },
          { text: (asist.fechaMarcado || asist.fechaHora) ? new Date(asist.fechaMarcado || asist.fechaHora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '-', alignment: 'center', fontSize: 9 },
        ]);

        if (filasAsistentes.length === 0) {
          filasAsistentes.push([
            { text: 'Sin registros de asistencia digital en esta sesión', colSpan: 5, alignment: 'center', italics: true, fontSize: 9 },
            {}, {}, {}, {}
          ]);
        }

        const docDefinition: any = {
          defaultStyle: { font: 'Helvetica' },
          pageSize: 'LETTER',
          pageMargins: [35, 35, 35, 35],
          content: [
            { text: 'UNIVERSIDAD AUTÓNOMA JUAN MISAEL SARACHO', style: 'headerUni', alignment: 'center' },
            { text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA', style: 'headerFac', alignment: 'center' },
            { text: 'PLANILLA OFICIAL DE CONTROL Y USO DE LABORATORIO', style: 'headerDoc', alignment: 'center', margin: [0, 4, 0, 14] },
            {
              table: {
                widths: ['25%', '25%', '25%', '25%'],
                body: [
                  [
                    { text: 'Laboratorio:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: labNombre, fontSize: 9 },
                    { text: 'Fecha:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: fechaStr, fontSize: 9 },
                  ],
                  [
                    { text: 'Docente:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: docenteNombre, fontSize: 9 },
                    { text: 'Materia:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: materiaNombre, fontSize: 9 },
                  ],
                  [
                    { text: 'Hora Inicio:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: horaInicioStr, fontSize: 9 },
                    { text: 'Hora Fin:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: horaFinStr, fontSize: 9 },
                  ],
                  [
                    { text: 'Tema / Práctica:', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                    { text: sesion.practicaRealizada || sesion.temaPractica || 'No especificado', colSpan: 3, fontSize: 9 },
                    {}, {},
                  ],
                ],
              },
              margin: [0, 0, 0, 14],
            },
            { text: `Nómina de Asistencia (${asistenciasList.length} Estudiantes)`, style: 'subHeader', margin: [0, 4, 0, 6] },
            {
              table: {
                headerRows: 1,
                widths: ['6%', '18%', '46%', '18%', '12%'],
                body: [
                  [
                    { text: '#', bold: true, fillColor: '#0f172a', color: '#ffffff', alignment: 'center', fontSize: 9 },
                    { text: 'R.U.', bold: true, fillColor: '#0f172a', color: '#ffffff', fontSize: 9 },
                    { text: 'Apellidos y Nombres', bold: true, fillColor: '#0f172a', color: '#ffffff', fontSize: 9 },
                    { text: 'Equipo / Puesto', bold: true, fillColor: '#0f172a', color: '#ffffff', fontSize: 9 },
                    { text: 'Hora', bold: true, fillColor: '#0f172a', color: '#ffffff', alignment: 'center', fontSize: 9 },
                  ],
                  ...filasAsistentes,
                ],
              },
              margin: [0, 0, 0, 24],
            },
            {
              columns: [
                {
                  stack: [
                    { text: '_______________________________', alignment: 'center' },
                    { text: docenteNombre, alignment: 'center', fontSize: 9, bold: true, margin: [0, 4, 0, 0] },
                    { text: 'Firma Docente', alignment: 'center', fontSize: 8, color: '#64748b' },
                  ],
                },
                {
                  stack: [
                    { text: '_______________________________', alignment: 'center' },
                    { text: 'Jefatura de Laboratorios', alignment: 'center', fontSize: 9, bold: true, margin: [0, 4, 0, 0] },
                    { text: 'Sello y Conformidad', alignment: 'center', fontSize: 8, color: '#64748b' },
                  ],
                },
              ],
            },
          ],
          styles: {
            headerUni: { fontSize: 11, bold: true, color: '#0f172a' },
            headerFac: { fontSize: 10, bold: true, color: '#334155' },
            headerDoc: { fontSize: 11, bold: true, color: '#b91c1c' },
            subHeader: { fontSize: 10, bold: true, color: '#0f172a' },
          },
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err: any) => reject(err));
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
