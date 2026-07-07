import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { LoginView } from '../views/login/LoginView.tsx';

// Componente Protector de Rutas (KAN-22)
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mientras se restaura la sesión desde el localStorage (F5), mostramos una pantalla de carga
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl font-semibold animate-pulse">Cargando ecosistema SysLab...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado en el estado global, abortamos y redirigimos al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Formulario de Acceso */}
        <Route path="/login" element={<LoginView />} />

        {/* Rutas Protegidas de Administración de Laboratorios */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="p-8 bg-gray-100 min-h-screen">
                <h1 className="text-2xl font-bold">Panel Principal SysLab</h1>
                <p>Bienvenido al núcleo core del frontend, ingeniero.</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto ante rutas inexistentes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};