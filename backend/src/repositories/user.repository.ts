import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class UserRepository {
  /**
   * Obtiene la lista completa de usuarios para la gestión del panel administrativo.[cite: 13]
   */
  async findAll() {
    return await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        creadoEn: true,
        rol: {
          select: {
            id: true,
            nombre: true
          }
        },
        asignacionesRoles: {
          select: {
            rolId: true,
            facultadId: true,
            carreraId: true,
            rol: { select: { id: true, nombre: true } },
            facultad: { select: { id: true, nombre: true, sigla: true } },
            carrera: { select: { id: true, nombre: true } }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  /**
   * Busca un usuario por su correo electrónico con su estructura perimetral.[cite: 13]
   */
  async findByCorreo(correo: string) {
    return await prisma.usuario.findUnique({
      where: { correo },
      include: {
        rol: {
          include: {
            rolPermisos: {
              include: {
                permiso: {
                  select: { codigo: true }
                }
              }
            }
          }
        },
        asignacionesRoles: {
          include: {
            rol: true,
            facultad: {
              include: {
                carreras: { select: { id: true } }
              }
            },
            carrera: true
          }
        }
      }
    });
  }

  /**
   * Busca un usuario por su ID numérico.[cite: 13]
   */
  async findById(id: number) {
    return await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rolId: true
      }
    });
  }

  /**
   * Modifica los datos básicos de control del usuario.[cite: 13]
   */
  async update(id: number, data: { rolId?: number; activo?: boolean; nombre?: string; correo?: string }) {
    return await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rolId: true
      }
    });
  }

  /**
   * Modifica el rol, estado, datos básicos y reconfigura los ámbitos perimetrales de forma atómica.[cite: 13]
   */
  async actualizarPerfilYPerimetros(
    usuarioId: number, 
    data: { 
      nombre?: string; 
      correo?: string; 
      rolId: number; 
      rolIds?: number[]; 
      activo?: boolean; 
      facultades?: number[]; 
      carreras?: number[]; 
    }
  ) {
    // Tipado explícito de 'tx' para evitar el error de tipo implícito 'any'[cite: 13]
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Actualizar datos base del Usuario
      const usuarioActualizado = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          ...(data.nombre !== undefined && { nombre: data.nombre }),
          ...(data.correo !== undefined && { correo: data.correo }),
          rolId: data.rolId,
          activo: data.activo !== undefined ? data.activo : undefined
        }
      });

      // 2. Limpiar las asignaciones perimetrales anteriores
      await tx.asignacionAmbito.deleteMany({ where: { usuarioId } });

      // 3. Determinar los roles finales a aplicar
      const idsRolesFinales = data.rolIds && data.rolIds.length > 0 ? data.rolIds : [data.rolId];
      const nuevasAsignaciones: any[] = [];

      const facultadesArr = data.facultades || [];
      const carrerasArr = data.carreras || [];

      // 4. Construir las combinaciones de roles con facultades y carreras
      if (facultadesArr.length > 0 || carrerasArr.length > 0) {
        for (const rId of idsRolesFinales) {
          const facultadesLista = facultadesArr.length > 0 ? facultadesArr : [null];
          const carrerasLista = carrerasArr.length > 0 ? carrerasArr : [null];

          for (const facultadId of facultadesLista) {
            for (const carreraId of carrerasLista) {
              nuevasAsignaciones.push({
                usuarioId,
                rolId: rId,
                facultadId,
                carreraId
              });
            }
          }
        }
      } else {
        for (const rId of idsRolesFinales) {
          nuevasAsignaciones.push({
            usuarioId,
            rolId: rId,
            facultadId: null,
            carreraId: null
          });
        }
      }

      // 5. Insertar masivamente las nuevas asignaciones evitando duplicados
      if (nuevasAsignaciones.length > 0) {
        await tx.asignacionAmbito.createMany({
          data: nuevasAsignaciones,
          skipDuplicates: true
        });
      }

      return usuarioActualizado;
    });
  }
}

export const userRepository = new UserRepository();