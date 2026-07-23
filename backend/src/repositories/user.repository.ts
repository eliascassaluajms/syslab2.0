import { prisma } from '../config/prisma.js';

export class UserRepository {
  /**
   * Obtiene la lista completa de usuarios para la gestión del panel administrativo.
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
   * Busca un usuario por su correo electrónico con su estructura perimetral.
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
   * Busca un usuario por su ID numérico.
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
   * Modifica los datos básicos de control del usuario.
   */
  async update(id: number, data: { rolId?: number; activo?: boolean; nombre?: string }) {
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
   * Modifica el rol, estado y reconfigura los ámbitos perimetrales de forma atómica.
   */
  async actualizarPerfilYPerimetros(
    usuarioId: number, 
    data: { rolId: number; rolIds?: number[]; activo?: boolean; facultades: number[]; carreras: number[] }
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos base del Usuario
      const usuarioActualizado = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          rolId: data.rolId,
          activo: data.activo !== undefined ? data.activo : undefined
        }
      });

      // 2. Limpiar las asignaciones perimetrales anteriores
      await tx.asignacionAmbito.deleteMany({ where: { usuarioId } });

      // 3. Determinar los roles finales a aplicar
      const idsRolesFinales = data.rolIds && data.rolIds.length > 0 ? data.rolIds : [data.rolId];
      const nuevasAsignaciones: any[] = [];

      // 4. Construir las combinaciones de roles con facultades y carreras
      if (data.facultades.length > 0 || data.carreras.length > 0) {
        for (const rId of idsRolesFinales) {
          const facultadesLista = data.facultades.length > 0 ? data.facultades : [null];
          const carrerasLista = data.carreras.length > 0 ? data.carreras : [null];

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