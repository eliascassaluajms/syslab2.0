import { prisma } from '../config/prisma.js';

export class UserRepository {
  /**
   * Obtiene la lista completa de usuarios para la gestión del panel administrativo (KAN-17 / KAN-23).
   * Incluye roles y perímetros asignados (facultades y carreras) para su visualización en la grilla.
   */
  async findAll() {
    return await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        createdAt: true,
        rol: {
          select: {
            id: true,
            nombre: true
          }
        },
        usuarioFacultades: {
          select: {
            facultadId: true,
            facultad: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        usuarioCarreras: {
          select: {
            carreraId: true,
            carrera: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  /**
   * Busca un usuario por su correo electrónico.
   * Carga el Rol, sus Permisos y la estructura perimetral completa para resolver
   * la sesión JWT (KAN-13, KAN-14) y la expansión dinámica de ámbitos (KAN-16.1).
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
        // Mapeo perimetral para usuarios asignados a facultades completas
        usuarioFacultades: {
          include: {
            facultad: {
              include: {
                carreras: {
                  select: { id: true }
                }
              }
            }
          }
        },
        // Mapeo perimetral directo para usuarios asignados a carreras específicas
        usuarioCarreras: {
          select: {
            carreraId: true
          }
        }
      }
    });
  }

  /**
   * Busca un usuario por su ID numérico.
   * Utilizado por el middleware de seguridad perimetral para validar el estado activo en tiempo real (KAN-15.1).
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
   * Modifica los datos de control del usuario.
   * Utilizado por el controlador de administración de personal (ABM - KAN-17).
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
   * Modifica el rol, estado e inserta/elimina de golpe los registros perimetrales (ABM - KAN-17).
   * Ejecuta una operación atómica para garantizar la consistencia en el ecosistema SysLab.
   */
  async actualizarPerfilYPerimetros(
    usuarioId: number, 
    data: { rolId: number; activo?: boolean; facultades: number[]; carreras: number[] }
  ) {
    return await prisma.$transaction(async (tx) => {
      // A. Actualizar datos base del Usuario
      const usuarioActualizado = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          rolId: data.rolId,
          activo: data.activo !== undefined ? data.activo : undefined
        }
      });

      // B. Reconfigurar Ámbitos de Facultades
      await tx.usuarioFacultad.deleteMany({ where: { usuarioId } });
      if (data.facultades.length > 0) {
        await tx.usuarioFacultad.createMany({
          data: data.facultades.map(facultadId => ({ usuarioId, facultadId }))
        });
      }

      // C. Reconfigurar Ámbitos de Carreras
      await tx.usuarioCarrera.deleteMany({ where: { usuarioId } });
      if (data.carreras.length > 0) {
        await tx.usuarioCarrera.createMany({
          data: data.carreras.map(carreraId => ({ usuarioId, carreraId }))
        });
      }

      return usuarioActualizado;
    });
  }
}

export const userRepository = new UserRepository();