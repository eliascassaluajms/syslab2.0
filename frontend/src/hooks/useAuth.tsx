import { useAuth as useAuthContext } from '../context/AuthContext';

/**
 * Hook personalizado para consumir el AuthContext.
 * Actúa como una capa de abstracción para los componentes de vista.
 */
export const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth debe ser utilizado estrictamente dentro de un contenedor AuthProvider');
  }
  
  return context;
};