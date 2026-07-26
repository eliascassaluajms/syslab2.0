import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Rutas Públicas
import { LoginView } from '../views/login/LoginView';
import { ForgotPasswordView } from '../views/login/ForgotPasswordView';

// Protección y Layout Base
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Vistas del Sistema
import { CatalogosView } from '../views/CatalogosView';
import { UsuariosView } from '../views/UsuariosView';
import { GestionRolesView } from '../views/GestionRolesView';
import { LaboratoriosView } from '../views/LaboratoriosView';
import { PlanesMateriasView } from '../views/PlanesMateriasView';
export const AppRoutes: React.FC = () => {
  return (
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

          {/* Módulos de Administración Centralizada */}
          <Route path="/admin">
            <Route index element={<Navigate to="/admin/catalogos" replace />} />
            <Route path="catalogos" element={<CatalogosView />} />
            <Route path="usuarios" element={<UsuariosView />} />
            <Route path="roles" element={<GestionRolesView />} />
            <Route path="laboratorios" element={<LaboratoriosView />} />
          </Route>

          {/* Accesos directos compatibles */}
          <Route path="/usuarios" element={<UsuariosView />} />
          <Route path="/roles" element={<GestionRolesView />} />
          <Route path="/laboratorios" element={<LaboratoriosView />} />
          <Route path="/admin/planes-materias" element={<PlanesMateriasView />} />
        </Route>
      </Route>

      {/* ========================================== */}
      {/* REDIRECCIÓN POR DEFECTO                    */}
      {/* ========================================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};