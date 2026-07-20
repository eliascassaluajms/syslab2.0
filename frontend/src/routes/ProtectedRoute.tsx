import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importación directa del contexto purificado

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto"></div>
          <p className="text-sm font-medium text-gray-400 tracking-wider animate-pulse">
            Verificando credenciales en el ecosistema...
          </p>
        </div>
      </div>
    );
  }

  // Si existe usuario, renderiza la subruta activa. Si no, redirige limpiamente al login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};