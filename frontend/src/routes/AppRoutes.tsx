import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Rutas Públicas
import { LandingFIRNTView } from '../views/LandingFIRNTView';
import { LoginView } from '../views/login/LoginView';
import { ForgotPasswordView } from '../views/login/ForgotPasswordView';
import { RegistroAsistenciaPublicaView } from '../views/asistencia/RegistroAsistenciaPublicaView';

// Protección y Layout Base
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Vistas del Sistema
import { CatalogosView } from '../views/CatalogosView';
import { UsuariosView } from '../views/UsuariosView';
import { GestionRolesView } from '../views/GestionRolesView';
import { LaboratoriosView } from '../views/LaboratoriosView';
import { PlanesMateriasView } from '../views/PlanesMateriasView';
import { HorariosView } from '../views/HorariosView';
import { CategoriasEventosView } from '../views/CategoriasEventosView';
import ActivitiesView from '../views/ActivitiesView';
import { ParticipantesView } from '../views/ParticipantesView';
import { ValidacionPagosView } from '../views/ValidacionPagosView';
import { HistorialBitacorasView } from '../views/bitacora/HistorialBitacorasView';
import IncidenciasView from '../views/incidencias/IncidenciasView';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ========================================== */}
      {/* RUTAS PÚBLICAS                              */}
      {/* ========================================== */}
      <Route path="/" element={<LandingFIRNTView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/asistencia/:token" element={<RegistroAsistenciaPublicaView />} />

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
            <Route path="horarios" element={<HorariosView />} />
            <Route path="solicitudes-extraordinarias" element={<HorariosView />} />
            <Route path="bitacoras" element={<HistorialBitacorasView />} />
            <Route path="uso-laboratorios" element={<HistorialBitacorasView />} />
            <Route path="incidencias" element={<IncidenciasView />} />
            <Route path="fallas" element={<IncidenciasView />} />
            
            {/* Actividades y Eventos */}
            <Route path="actividades">
              <Route index element={<Navigate to="/admin/actividades/categorias" replace />} />
              <Route path="categorias" element={<CategoriasEventosView />} />
              <Route path="gestion" element={<ActivitiesView />} />
              <Route path="participantes" element={<ParticipantesView />} />
              <Route path="pagos" element={<ValidacionPagosView />} />
            </Route>
          </Route>

          {/* Accesos directos compatibles */}
          <Route path="/usuarios" element={<UsuariosView />} />
          <Route path="/roles" element={<GestionRolesView />} />
          <Route path="/laboratorios" element={<LaboratoriosView />} />
          <Route path="/horarios" element={<HorariosView />} />
          <Route path="/bitacoras" element={<HistorialBitacorasView />} />
          <Route path="/activities" element={<ActivitiesView />} />
          <Route path="/incidencias" element={<IncidenciasView />} />
          <Route path="/admin/incidencias" element={<IncidenciasView />} />
          <Route path="/admin/fallas" element={<IncidenciasView />} />
          <Route path="/admin/planes-materias" element={<PlanesMateriasView />} />
          <Route path="/admin/actividades" element={<Navigate to="/admin/actividades/categorias" replace />} />
        </Route>
      </Route>

      {/* ========================================== */}
      {/* REDIRECCIÓN POR DEFECTO                    */}
      {/* ========================================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
