import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from '../views/login/LoginView';
import { ForgotPasswordView } from '../views/login/ForgotPasswordView';
import { ProtectedRoute } from './ProtectedRoute';
import { UsuariosView } from '../views/UsuariosView'; // 👈 1. Importación de la vista

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        
        {/* Rutas Protegidas Estrictas mediante Layout Anidado */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <div className="p-8 bg-gray-950 text-white min-h-screen">
                <h1 className="text-2xl font-bold">Panel Principal SysLab</h1>
                <p className="text-gray-400 mt-2">
                  Bienvenido al núcleo core del frontend, ingeniero.
                </p>
              </div>
            }
          />
          {/* 👈 2. Nueva ruta de gestión de personal */}
          <Route path="/usuarios" element={<UsuariosView />} />
        </Route>

        {/* Creado para redireccionar por defecto a usuarios o login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};