import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpClient } from '../services/httpClient';
import { Usuario, AuthContextType } from '../interfaces/auth.interface';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem('syslab_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  const logout = () => {
    localStorage.removeItem('syslab_token');
    localStorage.removeItem('syslab_user');
    localStorage.removeItem('syslab_ambito_activo');
    setUser(null);
  };

  const tienePermiso = (permiso: string): boolean => {
    if (!user) return false;

    let nombreRol = '';
    if (typeof user.rol === 'string') {
      nombreRol = user.rol;
    } else if (user.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
      nombreRol = (user.rol as any).nombre;
    }

    const esAdmin = nombreRol.toLowerCase().includes('admin');
    if (esAdmin) return true;

    if (Array.isArray(user.permisos)) {
      return user.permisos.includes(permiso);
    }

    return false;
  };

  useEffect(() => {
    const token = localStorage.getItem('syslab_token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  const login = async (correo: string, password: string) => {
    try {
      const { data: responseData } = await httpClient.post('/auth/login', { correo, password });
      
      const token = responseData.token;
      const usuarioData = responseData.data?.usuario || responseData.usuario || responseData.data;

      if (!token || !usuarioData) throw new Error('Estructura de respuesta de login inválida');

      // Si el backend envía asignaciones vacías pero tiene roles, creamos un ámbito por defecto para evitar "Sin ámbitos"
      let asignaciones = usuarioData.asignacionesAmbito || usuarioData.ambitos || usuarioData.asignaciones || [];
      if ((!asignaciones || asignaciones.length === 0) && Array.isArray(usuarioData.roles) && usuarioData.roles.length > 0) {
        asignaciones = usuarioData.roles.map((rolNombre: string, index: number) => ({
          id: index + 1,
          rol: { nombre: rolNombre },
          carrera: { nombre: 'FIRNT' }
        }));
      }

      const usuarioNormalizado = {
        ...usuarioData,
        asignacionesAmbito: asignaciones
      };
      
      localStorage.setItem('syslab_token', token);
      localStorage.setItem('syslab_user', JSON.stringify(usuarioNormalizado));
      setUser(usuarioNormalizado);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Error al autenticar');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
