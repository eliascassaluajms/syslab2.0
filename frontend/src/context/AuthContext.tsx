import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpClient } from '../services/httpClient';
import { Usuario, AuthContextType } from '../interfaces/auth.interface';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem('syslab_token');
    setUser(null);
  };

  // Validación flexible de permisos
  const tienePermiso = (permiso: string): boolean => {
    if (!user) return false;

    // Extracción segura del nombre de rol
    let nombreRol = '';
    if (typeof user.rol === 'string') {
      nombreRol = user.rol;
    } else if (user.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
      nombreRol = user.rol.nombre;
    }

    // El Administrador mantiene acceso global
    const esAdmin = nombreRol.toLowerCase().includes('admin');
    if (esAdmin) return true;

    // Verificación contra la lista de permisos
    if (Array.isArray(user.permisos)) {
      return user.permisos.includes(permiso);
    }

    return false;
  };

  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('syslab_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await httpClient.get('/auth/me');
        if (data?.usuario) setUser(data.usuario);
      } catch {
        localStorage.removeItem('syslab_token');
      } finally {
        setLoading(false);
      }
    };

    const manejarDesautenticacion = () => logout();
    window.addEventListener('auth_unauthorized', manejarDesautenticacion);

    verificarSesion();

    return () => {
      window.removeEventListener('auth_unauthorized', manejarDesautenticacion);
    };
  }, []);

  const login = async (correo: string, password: string) => {
    try {
      const { data: responseData } = await httpClient.post('/auth/login', { correo, password });
      const { token, data } = responseData;
      if (!token || !data?.usuario) throw new Error('Estructura de respuesta inválida');
      
      localStorage.setItem('syslab_token', token);
      setUser(data.usuario);
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