import { createRequire } from 'module';
import { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces.js';

const require = createRequire(import.meta.url);

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

let _printerInstance: any = null;
function getPrinter() {
  if (!_printerInstance) {
    const pdfmake = require('pdfmake');
    const PrinterClass = pdfmake.Printer || (pdfmake.default && pdfmake.default.Printer) || pdfmake.default || pdfmake;
    _printerInstance = new PrinterClass(fonts);
  }
  return _printerInstance;
}

export interface GenerarPlanillaPDFInput {
  sesion: {
    id: number;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    tipoUso: string;
    materiaNombre?: string | null;
    nombreAyudante?: string | null;
    practicaRealizada?: string | null;
    laboratorio?: { nombre: string; codigo?: string | null } | null;
    materia?: { nombre: string; codigo?: string | null } | null;
    docente?: { nombre: string; apellido?: string | null } | null;
  };
  asistencias: Array<{
    fechaHora: Date;
    estudiante: {
      nombre: string;
      apellido?: string | null;
      correo?: string | null;
    };
  }>;
}

export class PdfGeneratorService {
  async generarPlanillaAsistencia(data: GenerarPlanillaPDFInput): Promise<Buffer> {
    const { sesion, asistencias } = data;

    // Formateo de fecha DD/MM/YYYY
    const d = new Date(sesion.fecha);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();
    const fechaFormateada = `${dayStr}/${monthStr}/${yearStr}`;

    const nombreEncargado = sesion.docente
      ? `${sesion.docente.nombre} ${sesion.docente.apellido || ''}`.trim()
      : sesion.nombreAyudante || 'Docente / Auxiliar';

    const nombreMateria = sesion.materiaNombre || sesion.materia?.nombre || 'Uso de Laboratorio';

    // Construcción de la tabla de estudiantes
    const tablaEstudiantesBody: TableCell[][] = [
      [
        { text: 'N°', style: 'tableHeader', alignment: 'center' },
        { text: 'Nombres y Apellidos', style: 'tableHeader', alignment: 'left' },
        { text: 'Correo Institucional / Identificación', style: 'tableHeader', alignment: 'center' },
        { text: 'Hora de Marcado', style: 'tableHeader', alignment: 'center' },
      ],
    ];

    if (asistencias.length === 0) {
      tablaEstudiantesBody.push([
        { text: '1', alignment: 'center' },
        { text: 'Sin registros de estudiantes marcados', colSpan: 3, italics: true, alignment: 'center' },
        {},
        {},
      ]);
    } else {
      asistencias.forEach((a, idx) => {
        const horaDate = new Date(a.fechaHora);
        const hh = String(horaDate.getHours()).padStart(2, '0');
        const mm = String(horaDate.getMinutes()).padStart(2, '0');
        const ss = String(horaDate.getSeconds()).padStart(2, '0');
        const horaMarcado = `${hh}:${mm}:${ss}`;

        const identificacion = a.estudiante.correo || 'S/N';
        const nombreEstudiante = `${a.estudiante.nombre} ${a.estudiante.apellido || ''}`.trim();

        tablaEstudiantesBody.push([
          { text: String(idx + 1), alignment: 'center' },
          { text: nombreEstudiante, alignment: 'left' },
          { text: identificacion, alignment: 'center' },
          { text: horaMarcado, alignment: 'center' },
        ]);
      });
    }

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 40],
      content: [
        // 1. Encabezado Institucional
        {
          text: 'UNIVERSIDAD AUTÓNOMA "JUAN MISAEL SARACHO"',
          style: 'headerMain',
          alignment: 'center',
        },
        {
          text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA',
          style: 'headerSub',
          alignment: 'center',
        },
        {
          text: 'PLANILLA DE CONTROL Y ASISTENCIA DE LABORATORIO',
          style: 'headerTitle',
          alignment: 'center',
          margin: [0, 8, 0, 15],
        },

        // 2. Bloque Informativo de la Sesión
        {
          style: 'infoTable',
          table: {
            widths: ['25%', '75%'],
            body: [
              [
                { text: 'Laboratorio:', bold: true },
                { text: sesion.laboratorio?.nombre || 'Laboratorio' },
              ],
              [
                { text: 'Fecha y Horario:', bold: true },
                { text: `${fechaFormateada} | ${sesion.horaInicio} - ${sesion.horaFin || 'En curso'}` },
              ],
              [
                { text: 'Materia / Evento:', bold: true },
                { text: nombreMateria },
              ],
              [
                { text: 'Encargado:', bold: true },
                { text: nombreEncargado },
              ],
              [
                { text: 'Tipo de Uso:', bold: true },
                { text: sesion.tipoUso },
              ],
              [
                { text: 'Práctica / Tema:', bold: true },
                { text: sesion.practicaRealizada || 'Práctica regular / Uso de instalaciones' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15],
        },

        // 3. Título Sección Asistencias
        {
          text: `REGISTRO DE ASISTENCIA (${asistencias.length} Estudiante${asistencias.length === 1 ? '' : 's'})`,
          style: 'sectionTitle',
          margin: [0, 5, 0, 8],
        },

        // Tabla de Asistencia
        {
          table: {
            headerRows: 1,
            widths: ['8%', '47%', '27%', '18%'],
            body: tablaEstudiantesBody,
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return rowIndex === 0 ? '#1E293B' : rowIndex % 2 === 0 ? '#F8FAFC' : null;
            },
          },
          margin: [0, 0, 0, 40],
        },

        // 4. Sección Pie de Página (Área de Firmas)
        {
          columns: [
            {
              width: '45%',
              stack: [
                { text: '_________________________________', alignment: 'center' },
                { text: 'Firma del Docente / Ayudante', alignment: 'center', bold: true, margin: [0, 4, 0, 2] },
                { text: `Nombre: ${nombreEncargado}`, alignment: 'center', fontSize: 9 },
              ],
            },
            {
              width: '10%',
              text: '',
            },
            {
              width: '45%',
              stack: [
                { text: '_________________________________', alignment: 'center' },
                { text: 'Firma Jefe / Dir. Laboratorio', alignment: 'center', bold: true, margin: [0, 4, 0, 2] },
                { text: 'Nombre: Autoridad de Laboratorio', alignment: 'center', fontSize: 9 },
              ],
            },
          ],
          margin: [0, 30, 0, 0],
        },
      ],
      styles: {
        headerMain: {
          fontSize: 13,
          bold: true,
          color: '#0F172A',
        },
        headerSub: {
          fontSize: 10,
          bold: true,
          color: '#334155',
        },
        headerTitle: {
          fontSize: 12,
          bold: true,
          color: '#1E40AF',
          decoration: 'underline',
        },
        sectionTitle: {
          fontSize: 11,
          bold: true,
          color: '#0F172A',
        },
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: '#FFFFFF',
        },
      },
      defaultStyle: {
        fontSize: 9,
        font: 'Roboto',
      },
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = getPrinter().createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err: Error) => reject(err));
        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
