import { PrismaClient } from '@prisma/client';
import { prisma } from '../../src/config/prisma.js';
import * as path from 'path';
import * as fs from 'fs';
import XLSX from 'xlsx';

interface AsignacionHorario {
  sigla: string;
  grupo: number;
  nivel: number;
  aula: string;
  docenteNombre: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

function limpiarTexto(val: unknown): string {
  if (!val) return '';
  return String(val).trim();
}

export async function seedHorarios(prismaClient: PrismaClient = prisma) {
  console.log('🚀 Iniciando sembrado de horarios de laboratorios desde Excel...');

  const rutaExcel = path.resolve(process.cwd(), 'PERIODO 2 GESTION 2026.xlsx');
  if (!fs.existsSync(rutaExcel)) {
    console.error(`❌ No se encontró el archivo Excel en: ${rutaExcel}`);
    return;
  }

  const workbook = XLSX.readFile(rutaExcel);
  const sheet = workbook.Sheets['29-07'];
  if (!sheet) {
    console.error('❌ No se encontró la hoja "29-07" en el archivo Excel.');
    return;
  }

  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (data.length < 5) return;

  const header = data[3].map((c: any) => String(c).trim());
  const idxNiv = header.indexOf('Niv');
  const idxSigla = header.indexOf('Sigla');
  const idxGrupo = header.indexOf('G');
  const idxAulas = header.indexOf('Aulas');
  const idxDocente = header.indexOf('DOCENTE');

  const colDias: { dia: string; index: number }[] = [];
  header.forEach((h, idx) => {
    const hClean = h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
    if (['Lunes', 'Martes', 'Miercoles', 'Miércoles', 'Jueves', 'Viernes', 'Sabado', 'Sábado', 'SABADO'].includes(hClean) || h.toUpperCase() === 'SABADO') {
      let diaNorm = hClean.replace('Á', 'A').replace('á', 'a');
      if (diaNorm.toUpperCase().includes('MIER')) diaNorm = 'Miércoles';
      else if (diaNorm.toUpperCase().includes('SAB')) diaNorm = 'Sábado';
      colDias.push({ dia: diaNorm, index: idx });
    }
  });

  const asignaciones: AsignacionHorario[] = [];
  const regexHora = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/;

  for (let r = 4; r < data.length; r++) {
    const row = data[r];
    const sigla = limpiarTexto(row[idxSigla]).toUpperCase();
    if (!sigla || sigla.length < 3) continue;

    const nivel = parseInt(row[idxNiv], 10) || 1;
    const grupo = parseInt(row[idxGrupo], 10) || 1;
    const aula = limpiarTexto(row[idxAulas]);
    const docenteNombre = limpiarTexto(row[idxDocente]);

    if (!aula.toUpperCase().includes('LAB')) continue;

    for (const cd of colDias) {
      const cellVal = limpiarTexto(row[cd.index]);
      if (!cellVal || cellVal.toLowerCase() === 'nan') continue;

      const match = cellVal.match(regexHora);
      if (match) {
        asignaciones.push({
          sigla,
          grupo,
          nivel,
          aula,
          docenteNombre,
          dia: cd.dia,
          horaInicio: match[1].padStart(5, '0'),
          horaFin: match[2].padStart(5, '0'),
        });
      }
    }
  }

  console.log(`📄 Se detectaron ${asignaciones.length} bloques horarios en laboratorios.`);

  let horariosCreados = 0;
  const gestion = 2026;

  for (const item of asignaciones) {
    const materia = await prismaClient.materia.findUnique({
      where: { codigo: item.sigla },
    });

    if (!materia) continue;

    let laboratorio = await prismaClient.laboratorio.findFirst({
      where: { codigo: { equals: item.aula, mode: 'insensitive' } },
    });

    if (!laboratorio) {
      const facultad = await prismaClient.facultad.findFirst();
      if (!facultad) continue;

      laboratorio = await prismaClient.laboratorio.create({
        data: {
          codigo: item.aula,
          nombre: `Laboratorio ${item.aula}`,
          facultadId: facultad.id,
          activo: true,
        },
      });
    }

    const docentes = await prismaClient.usuario.findMany({
      where: { rol: { nombre: { equals: 'Docente', mode: 'insensitive' } } },
    });

    let docenteId = docentes[0]?.id;
    if (item.docenteNombre && docentes.length > 0) {
      const partesDoc = item.docenteNombre.toLowerCase().split(/\s+/);
      const docMatch = docentes.find((d) => {
        const nombreCompleto = `${d.nombre} ${d.apellido}`.toLowerCase();
        return partesDoc.some((p) => p.length > 3 && nombreCompleto.includes(p));
      });
      if (docMatch) docenteId = docMatch.id;
    }

    if (!docenteId) {
      const anyUser = await prismaClient.usuario.findFirst();
      if (!anyUser) continue;
      docenteId = anyUser.id;
    }

    await prismaClient.horario.create({
      data: {
        laboratorioId: laboratorio.id,
        materiaId: materia.id,
        docenteId,
        diaSemana: item.dia,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
        grupo: item.grupo,
        semestre: item.nivel,
        gestion,
      },
    }).catch(() => {});

    horariosCreados++;
  }

  console.log(`✨ Se sembraron ${horariosCreados} horarios de laboratorio con éxito.\n`);
}

seedHorarios()
  .catch((e) => {
    console.error('❌ Error en seeder de horarios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
