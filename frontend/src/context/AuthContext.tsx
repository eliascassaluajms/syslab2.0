import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpClient } from '../services/httpClient'; // Eliminada extensión .js perjudicial

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  ambitos: string[];
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem('syslab_token');
    setUser(null);
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

    // Escucha reactiva para cerrar la sesión de inmediato si un endpoint responde 401
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};