import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Rutas Públicas
import { LoginView } from '../views/login/LoginView';
import { ForgotPasswordView } from '../views/login/ForgotPasswordView';

// Protección y Layout Base
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout'; // 👈 Layout con Sidebar e historia de navegación

// Vistas del Sistema
import { CatalogosView } from '../views/CatalogosView'; // 👈 Gestión de Facultades y Carreras
import { UsuariosView } from '../views/UsuariosView';   // 👈 Gestión de Usuarios y Perímetros
import { GestionRolesView } from '../views/GestionRolesView'; // 👈 Gestión de Roles y Permisos

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* RUTAS PÚBLICAS                              */}
        {/* ========================================== */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />

        {/* ========================================== */}
        {/* RUTAS PROTEGIDAS CON PANEL Y SIDEBAR        */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            
            {/* Redirección por defecto al entrar a /dashboard */}
            <Route path="/dashboard" element={<Navigate to="/admin/catalogos" replace />} />

            {/* Módulos de Administración Central Centralizada */}
            <Route path="/admin">
              <Route index element={<Navigate to="/admin/catalogos" replace />} />
              <Route path="catalogos" element={<CatalogosView />} />
              <Route path="usuarios" element={<UsuariosView />} />
              <Route path="roles" element={<GestionRolesView />} />
              <Route 
                path="laboratorios" 
                element={
                  <div className="p-8 text-white">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      <span>🔬</span> Gestión de Laboratorios
                    </h1>
                    <p className="text-gray-400 mt-2">Módulo en proceso de incorporación...</p>
                  </div>
                } 
              />
            </Route>

            {/* Accesos directos compatibles */}
            <Route path="/usuarios" element={<UsuariosView />} />
            <Route path="/roles" element={<GestionRolesView />} />

          </Route>
        </Route>

        {/* ========================================== */}
        {/* REDIRECCIÓN POR DEFECTO                    */}
        {/* ========================================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};