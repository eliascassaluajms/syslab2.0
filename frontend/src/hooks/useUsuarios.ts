import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../services/httpClient';

// Interfaz para la entidad de Usuario dentro de la grilla de administración
export interface UsuarioLista {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  createdAt?: string;
  rol: {
    id: number;
    nombre: string;
  };
  usuarioFacultades: {
    facultadId: number;
    facultad?: {
      id: number;
      nombre: string;
    };
  }[];
  usuarioCarreras: {
    carreraId: number;
    carrera?: {
      id: number;
      nombre: string;
    };
  }[];
}

// Payload para actualización de perfil y ámbitos institucionales
export interface ActualizarPerfilPayload {
  rolId: number;
  activo?: boolean;
  facultades: number[];
  carreras: number[];
}

/**
 * KAN-24: Custom Hook de Control Operativo de Usuarios
 * Gobierna las peticiones HTTP hacia el Backend, estados de carga y refresco reactivo.
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
      setError(err.message || 'Error al obtener la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Actualizar rol y asignaciones perimetrales (Facultades / Carreras)
  const actualizarUsuario = async (id: number, payload: ActualizarPerfilPayload) => {
    setError(null);
    try {
      await httpClient.put(`/usuarios/${id}`, payload);
      await cargarUsuarios(); // Refrescar la grilla reactivamente
    } catch (err: any) {
      const mensaje = err.message || 'Error al actualizar el usuario y sus ámbitos.';
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
      const mensaje = err.message || 'Error al cambiar el estado del usuario.';
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
  };
};