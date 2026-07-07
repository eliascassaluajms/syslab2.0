import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { IJwtPayload } from '../interfaces/auth.interface.js';

export class AuthService {
  /**
   * Ejecuta la lógica de negocio para la autenticación de usuarios.
   * Resuelve jerárquicamente los ámbitos y genera el JWT encapsulado.
   */
  async login(correo: string, passwordPlain: string): Promise<{ token: string; usuario: Partial<IJwtPayload> }> {
    // 1. Buscar usuario con todas sus relaciones perimetrales cargadas (KAN-12)
    const user = await userRepository.findByCorreo(correo);

    if (!user) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    // 2. Verificar ciclo de vida inmediato
    if (!user.activo) {
      throw new AppError('Esta cuenta se encuentra suspendida. Contacte al Administrador.', 403);
    }

    // 3. Validar el Hash de la contraseña con Bcrypt (KAN-13)
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    // 4. Aplanar el arreglo de permisos del Rol
    const permisosFlaten = user.rol.rolPermisos.map(rp => rp.permiso.codigo);

    // 5. 🔥 RESOLUCIÓN JERÁRQUICA DE ÁMBITOS (KAN-16.1)
    const carrerasAmbitoSet = new Set<number>();

    // A) Inyectar carreras directas
    if (user.usuarioCarreras) {
      user.usuarioCarreras.forEach(uc => carrerasAmbitoSet.add(uc.carreraId));
    }

    // B) Expandir dinámicamente Facultades completas a sus Carreras asociadas
    if (user.usuarioFacultades) {
      user.usuarioFacultades.forEach(uf => {
        if (uf.facultad && uf.facultad.carreras) {
          uf.facultad.carreras.forEach(carrera => {
            carrerasAmbitoSet.add(carrera.id);
          });
        }
      });
    }

    const carrerasPlanas = Array.from(carrerasAmbitoSet);

    // 6. Construir el Payload del JWT
    const tokenPayload = {
      id: Number(user.id),
      nombre: String(user.nombre),
      correo: String(user.correo),
      rol: String(user.rol.nombre),
      permisos: permisosFlaten,
      carreras: carrerasPlanas
    };

    // 7. Generar Firma del JWT mitigando la sobrecarga ts(2769)
    const opcionesFirma: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms',
      opcionesFirma
    );

    return {
      token,
      usuario: {
        id: tokenPayload.id,
        nombre: tokenPayload.nombre,
        rol: tokenPayload.rol,
        permisos: tokenPayload.permisos
      }
    };
  }
}

export const authService = new AuthService();