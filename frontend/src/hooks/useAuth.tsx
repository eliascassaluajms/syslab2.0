import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpClient } from '../services/httpClient.js';

// Interfaces core para el control de identidad perimetral
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
  login: (correo: string, contrasenia: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // KAN-20: Efecto de persistencia perimetral ante recargas del navegador (F5)
  useEffect(() => {
    const verificarSesionPersistente = async () => {
      const token = localStorage.getItem('syslab_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Golpeamos el endpoint de verificación para validar que el JWT no haya expirado o sido revocado
        const response = await httpClient.get('/auth/me');
        if (response.data && response.data.usuario) {
          setUser(response.data.usuario);
        } else {
          // Si la respuesta no es válida, purgamos el almacenamiento local
          localStorage.removeItem('syslab_token');
        }
      } catch (error) {
        console.error('Error en la restauración automática de sesión:', error);
        localStorage.removeItem('syslab_token');
      } finally {
        setLoading(false);
      }
    };

    verificarSesionPersistente();
  }, []);

  // KAN-19: Orquestación de la petición de Login mediante Axios hacia la API
  const login = async (correo: string, contrasenia: string) => {
    try {
      const response = await httpClient.post('/auth/login', {
        correo,
        contrasenia
      });

      const { token, usuario } = response.data;

      if (!token || !usuario) {
        throw new Error('La API devolvió una estructura de autenticación incompleta.');
      }

      // Almacenamiento seguro del JWT en el LocalStorage
      localStorage.setItem('syslab_token', token);
      
      // Inyección del perfil de usuario con sus roles en el estado global
      setUser(usuario);
    } catch (error: any) {
      // Propagamos un error semántico y limpio hacia la LoginView
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Credenciales institucionales incorrectas.');
      }
      throw new Error('No se pudo establecer comunicación con el servidor del laboratorio.');
    }
  };

  // Cierre de sesión y purga de credenciales del navegador
  const logout = () => {
    localStorage.removeItem('syslab_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado estrictamente dentro de un contenedor AuthProvider');
  }
  return context;
};