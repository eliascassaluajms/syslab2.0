import fs from 'fs';
import path from 'path';
import readline from 'readline';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EstadoInscripcionMateria } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Catálogo oficial de materias (Plan 2007 y Plan 2024) de Informática UAJMS
const CATALOGO_MATERIAS: Record<string, { nombre: string; semestre: number }> = {
  // Plan 2024
  DIC111: { nombre: 'PROGRAMACION I', semestre: 1 },
  DIC112: { nombre: 'ARQUITECTURA DE COMPUTADORAS I', semestre: 1 },
  EST116: { nombre: 'PROBABILIDAD Y ESTADISTICAS', semestre: 1 },
  FIS113: { nombre: 'FISICA I', semestre: 1 },
  MAT114: { nombre: 'CALCULO I', semestre: 1 },
  MAT115: { nombre: 'ALGEBRA', semestre: 1 },
  DIC121: { nombre: 'PROGRAMACION II', semestre: 2 },
  DIC122: { nombre: 'ARQUITECTURA DE COMPUTADORAS II', semestre: 2 },
  DIC123: { nombre: 'ADMINISTRACION DE SISTEMAS OPERATIVOS', semestre: 2 },
  DIC126: { nombre: 'METODOLOGIA DE INVESTIGACION EN INFORMATICA APLICADA', semestre: 2 },
  FIS124: { nombre: 'FISICA II', semestre: 2 },
  MAT125: { nombre: 'CALCULO II', semestre: 2 },
  DIC211: { nombre: 'PROGRAMACION III', semestre: 3 },
  DIC212: { nombre: 'TEORIA DE AUTOMATAS Y LENGUAJES FORMALES', semestre: 3 },
  DIC213: { nombre: 'ESTRUCTURAS DE DATOS COMPLEJAS', semestre: 3 },
  MAT215: { nombre: 'CALCULO III', semestre: 3 },
  MAT216: { nombre: 'MODELACION Y SIMULACION EN INGENIERIA INFORMATICA', semestre: 3 },
  DIC214: { nombre: 'FUNDAMENTOS DE LOS SISTEMAS DE INFORMACION GEOGRAFICA', semestre: 3 },
  DIC221: { nombre: 'PROGRAMACION IV', semestre: 4 },
  DIC222: { nombre: 'REDES I', semestre: 4 },
  DIC223: { nombre: 'BASE DE DATOS I', semestre: 4 },
  DIC224: { nombre: 'ANALISIS DE SISTEMAS I', semestre: 4 },
  MAT225: { nombre: 'ANALISIS NUMERICO', semestre: 4 },
  DIC226: { nombre: 'INTERNET DE LAS COSAS', semestre: 4 },

  // Plan 2007
  MAT221: { nombre: 'CALCULO IV', semestre: 4 },
  INF311: { nombre: 'BASE DE DATOS I', semestre: 5 },
  INF312: { nombre: 'ANALISIS DE SISTEMAS I', semestre: 5 },
  MAT311: { nombre: 'INVESTIGACION OPERATIVA I', semestre: 5 },
  IEL311: { nombre: 'REDES I', semestre: 5 },
  ECO311: { nombre: 'ECONOMIA GENERAL', semestre: 5 },
  INF301: { nombre: 'TALLER I', semestre: 5 },
  ECO321: { nombre: 'PREPARACION Y EVALUAC. DE PROYECTOS', semestre: 6 },
  IEL321: { nombre: 'REDES II', semestre: 6 },
  INF321: { nombre: 'BASE DE DATOS II', semestre: 6 },
  INF322: { nombre: 'ANALISIS DE SISTEMAS II', semestre: 6 },
  MAT322: { nombre: 'INVESTIGACION OPERATIVA II', semestre: 6 },
  IEL411: { nombre: 'REDES III', semestre: 7 },
  INF411: { nombre: 'BASES DE DATOS III', semestre: 7 },
  INF412: { nombre: 'INGENIERIA DE SOFTWARE I', semestre: 7 },
  INF413: { nombre: 'TECNOLOGIA MULTIMEDIA', semestre: 7 },
  INF401: { nombre: 'TALLER II', semestre: 7 },
  TEL410: { nombre: 'LABORATORIO DE GESTION DE REDES', semestre: 7 },
  INF421: { nombre: 'INTELIGENCIA ARTIFICIAL', semestre: 8 },
  INF422: { nombre: 'INGENIERIA DE SOFTWARE II', semestre: 8 },
  INF423: { nombre: 'TECNOLOGIA DE PROGRAMACION EN RED', semestre: 8 },
  IEL421: { nombre: 'LABORATORIO DE SEGURIDAD EN REDES', semestre: 8 },
  TEL420: { nombre: 'SISTEMAS PARALELOS', semestre: 8 },
  INF511: { nombre: 'ROBOTICA', semestre: 9 },
  IEL511: { nombre: 'TRANSMISION DE VOZ Y VIDEO', semestre: 9 },
  DER511: { nombre: 'LEGISLACION', semestre: 9 },
  INF501: { nombre: 'TALLER III', semestre: 9 },
  TEL510: { nombre: 'LABORATORIO DE REDES INALAMBRICAS', semestre: 9 },
  INF521: { nombre: 'AUDITORIA INFORMATICA', semestre: 10 },
  TEL520: { nombre: 'TECNOLOGIAS MOVIL', semestre: 10 }
};

interface MateriaParsed {
  sigla: string;
  grupo: number;
  periodo: number;
}

interface EstudianteBloque {
  ru: string;
  plan: string;
  nombreCompleto: string;
  lineas: string[];
}

function extraerMateriasDeLineas(lineas: string[]): MateriaParsed[] {
  const materias: MateriaParsed[] = [];
  const regexSigla = /\b(INF|MAT|DIC|IEL|TEL|FIS|EST|ECO|DER)\d{3}\b/;
  const regexFecha = /\b(2026-\d{2}-\d{2})\b/;

  let actual: MateriaParsed | null = null;
  let proximaLineaEsGrupo = false;

  for (const l of lineas) {
    const lTrim = l.trim();
    if (!lTrim) continue;

    // Detectar nueva asignatura por su sigla oficial
    const matchSigla = lTrim.match(regexSigla);
    if (matchSigla) {
      if (actual) {
        materias.push(actual);
      }
      actual = {
        sigla: matchSigla[0].toUpperCase(),
        grupo: 1,
        periodo: 1
      };
      proximaLineaEsGrupo = false;
    }

    if (actual) {
      // Determinar periodo semestral según la fecha de registro (Mes <= 6: Periodo 1 / Mes > 6: Periodo 2)
      const matchFecha = lTrim.match(regexFecha);
      if (matchFecha) {
        const mes = parseInt(matchFecha[1].split('-')[1], 10);
        actual.periodo = mes <= 6 ? 1 : 2;
      }

      // Detección de Grupo 2 en la misma línea
      if (
        /\b(?:grupo\s*[:\s]?\s*2|grupo\s+2|\|\s*2\s*\||\b2\s+(?:Normal|Rediseñado|Regularizado|Tutorias)|(?:Normal|Rediseñado|Regularizado|Tutorias)\s+2\b)/i.test(lTrim)
      ) {
        actual.grupo = 2;
      }

      // Detección de Grupo 2 cuando la etiqueta "Grupo" está en la línea anterior
      if (/^\|?\s*Grupo\b/i.test(lTrim)) {
        proximaLineaEsGrupo = true;
      } else if (proximaLineaEsGrupo) {
        if (lTrim === '2' || lTrim.startsWith('2 ')) {
          actual.grupo = 2;
        }
        proximaLineaEsGrupo = false;
      }
    }
  }

  if (actual) {
    materias.push(actual);
  }

  // Descartar duplicaciones accidentales en el mismo periodo
  const unicas: MateriaParsed[] = [];
  for (const m of materias) {
    if (!unicas.some((u) => u.sigla === m.sigla && u.periodo === m.periodo)) {
      unicas.push(m);
    }
  }
  return unicas;
}

async function main() {
  const rutaTxt = process.argv[2] || 'programaciones_raw.txt';
  const archivo = path.isAbsolute(rutaTxt) ? rutaTxt : path.join(process.cwd(), rutaTxt);

  if (!fs.existsSync(archivo)) {
    console.error(`❌ No se encontró el archivo: ${archivo}`);
    process.exit(1);
  }

  console.log('📚 Procesando actas de programación de materias Tariquía 2026...\n');

  const rolEstudiante = await prisma.rol.findFirst({
    where: { nombre: { equals: 'Estudiante', mode: 'insensitive' } },
  });
  if (!rolEstudiante) {
    throw new Error('No se encontró el rol "Estudiante".');
  }

  const carrera = await prisma.carrera.findFirst({
    where: { nombre: { contains: 'Informática', mode: 'insensitive' } },
    include: { planesEstudio: true },
  });
  if (!carrera) {
    throw new Error('No se encontró la Carrera de Informática.');
  }

  const materiasDb = await prisma.materia.findMany();
  const materiaMap = new Map(materiasDb.map((m) => [m.codigo.trim().toUpperCase(), m]));

  const usuariosDb = await prisma.usuario.findMany({
    where: { rolId: rolEstudiante.id },
    select: { id: true, username: true },
  });
  const estudianteMap = new Map(usuariosDb.map((u) => [u.username.trim(), u.id]));

  const fileStream = fs.createReadStream(archivo);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const bloques: EstudianteBloque[] = [];
  let bloqueActual: EstudianteBloque | null = null;
  let lineasPrevias: string[] = [];

  const regexEstudiante = /(?:^|\s|\|)(\d{5,6})\s+(?:\|?\s*)?(2007|2024)\s+(?:\|?\s*)?([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Nivel|\d{4}-\d{2}-\d{2}|\*{3}|$))/i;

  for await (const linea of rl) {
    const l = linea.trim();
    if (!l) continue;

    const matchEst = l.match(regexEstudiante);
    if (matchEst) {
      const ru = matchEst[1].trim();
      const plan = matchEst[2].trim();
      const nombreCompleto = matchEst[3].trim();

      if (bloqueActual && bloqueActual.ru !== ru) {
        bloques.push(bloqueActual);
      }

      if (!bloqueActual || bloqueActual.ru !== ru) {
        bloqueActual = {
          ru,
          plan,
          nombreCompleto,
          lineas: bloqueActual === null ? [...lineasPrevias] : [],
        };
      }
    } else {
      if (bloqueActual) {
        bloqueActual.lineas.push(l);
      } else {
        lineasPrevias.push(l);
      }
    }
  }

  if (bloqueActual) {
    bloques.push(bloqueActual);
  }

  console.log(`📄 Se detectaron ${bloques.length} estudiantes en el reporte.`);

  let totalInscripciones = 0;
  let estudiantesSinCarga = 0;
  let estudiantesConCarga = 0;
  const gestion = 2026;

  for (const b of bloques) {
    let estudianteId = estudianteMap.get(b.ru);

    if (!estudianteId) {
      const partes = b.nombreCompleto.split(/\s+/);
      const apellido = partes.length >= 2 ? `${partes[0]} ${partes[1]}` : (partes[0] || 'UAJMS');
      const nombre = partes.length > 2 ? partes.slice(2).join(' ') : (partes[1] || 'Estudiante');

      const nuevoEst = await prisma.usuario.upsert({
        where: { username: b.ru },
        update: { activo: true },
        create: {
          nombre,
          apellido,
          username: b.ru,
          correo: `${b.ru}@uajms.edu.bo`,
          password: 'SysLabEstudiante2026*',
          rolId: rolEstudiante.id,
          activo: true,
          esGlobal: false,
        },
      });
      estudianteId = nuevoEst.id;
      estudianteMap.set(b.ru, estudianteId);
    }

    const materiasParsed = extraerMateriasDeLineas(b.lineas);

    if (materiasParsed.length === 0) {
      estudiantesSinCarga++;
      continue;
    }

    estudiantesConCarga++;

    for (const mat of materiasParsed) {
      let materiaObj = materiaMap.get(mat.sigla);

      if (!materiaObj) {
        const catInfo = CATALOGO_MATERIAS[mat.sigla] || { nombre: mat.sigla, semestre: 1 };
        const planEstudio = carrera.planesEstudio.find((p) => p.descripcion?.includes(b.plan))
          || carrera.planesEstudio[0];

        materiaObj = await prisma.materia.upsert({
          where: { codigo: mat.sigla },
          update: {
            nombre: catInfo.nombre,
            semestre: catInfo.semestre,
          },
          create: {
            codigo: mat.sigla,
            nombre: catInfo.nombre,
            planId: planEstudio ? planEstudio.id : 1,
            semestre: catInfo.semestre,
            tipoPeriodo: 'Semestral',
          },
        });
        materiaMap.set(mat.sigla, materiaObj);
      }

      await prisma.inscripcionMateria.upsert({
        where: {
          estudianteId_materiaId_grupo_semestre_gestion: {
            estudianteId,
            materiaId: materiaObj.id,
            grupo: mat.grupo,
            semestre: mat.periodo,
            gestion,
          },
        },
        update: {
          estado: EstadoInscripcionMateria.ACTIVA,
        },
        create: {
          estudianteId,
          materiaId: materiaObj.id,
          grupo: mat.grupo,
          semestre: mat.periodo,
          gestion,
          estado: EstadoInscripcionMateria.ACTIVA,
        },
      });

      totalInscripciones++;
    }
  }

  console.log('\n📊 Resumen de la Ingesta de Programaciones:');
  console.log(`  ├─ Total estudiantes analizados: ${bloques.length}`);
  console.log(`  ├─ Estudiantes con materias programadas: ${estudiantesConCarga}`);
  console.log(`  ├─ Estudiantes sin materias activas: ${estudiantesSinCarga}`);
  console.log(`  └─ Total inscripciones registradas en la gestión 2026: ${totalInscripciones}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
