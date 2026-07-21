import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../services/httpClient';

export interface RolSimple {
  id: number;
  nombre: string;
}

// Interfaz para la entidad de Usuario dentro de la grilla de administración
export interface UsuarioLista {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  createdAt?: string;
  // Soporte para múltiples roles por usuario (Relación N:M)
  roles: RolSimple[];
  // Campos opcionales para mantener compatibilidad técnica con estructuras anidadas o legacy
  rol?: RolSimple;
  facultades?: number[];
  carreras?: number[];
  usuarioFacultades?: {
    facultadId: number;
    facultad?: {
      id: number;
      nombre: string;
    };
  }[];
  usuarioCarreras?: {
    carreraId: number;
    carrera?: {
      id: number;
      nombre: string;
    };
  }[];
}

// Payload para actualización de perfil, asignación de múltiples roles y ámbitos institucionales
export interface ActualizarPerfilPayload {
  rolIds: number[];
  rolId?: number; // Soporte legacy/fallback
  activo?: boolean;
  facultades: number[];
  carreras: number[];
}

// Payload simplificado para registro con datos de acceso e identidades de rol opcionales
export interface CrearUsuarioDatosBasicosPayload {
  nombre: string;
  correo: string;
  password?: string;
  rolIds?: number[];
  rolId?: number; // Soporte legacy/fallback
}

/**
 * KAN-24: Custom Hook de Control Operativo de Usuarios
 * Gobierna las peticiones HTTP hacia el Backend, estados de carga y refresco reactivo.
 * Soporta múltiples roles simultáneos y asignaciones perimetrales de Facultades y Carreras.
 */
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los usuarios registrados
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/usuarios');
      setUsuarios(response.data.data || []);
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al obtener la lista de usuarios.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Actualizar roles múltiples y asignaciones perimetrales (Facultades / Carreras)
  const actualizarUsuario = async (id: number, payload: ActualizarPerfilPayload) => {
    setError(null);
    try {
      await httpClient.put(`/usuarios/${id}`, payload);
      await cargarUsuarios(); // Refrescar la grilla reactivamente
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar el usuario y sus ámbitos.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  // Habilitar o inhabilitar un usuario
  const cambiarEstado = async (id: number, activo: boolean) => {
    setError(null);
    try {
      await httpClient.patch(`/usuarios/${id}/estado`, { activo });
      // Actualización optimista en el estado local
      setUsuarios((prev) =>
        prev.map((user) => (user.id === id ? { ...user, activo } : user))
      );
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al cambiar el estado del usuario.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  // Registrar un nuevo usuario con datos básicos e identificación de roles
  const crearUsuarioBasico = async (payload: CrearUsuarioDatosBasicosPayload) => {
    setError(null);
    try {
      await httpClient.post('/usuarios', payload);
      await cargarUsuarios(); // Refresca la grilla tras el registro
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al registrar usuario.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  return {
    usuarios,
    loading,
    error,
    cargarUsuarios,
    actualizarUsuario,
    cambiarEstado,
    crearUsuarioBasico,
  };
};