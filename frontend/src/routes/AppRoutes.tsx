import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Rutas Públicas
const LandingFIRNTView = lazy(() => import('../views/LandingFIRNTView').then((module) => ({ default: module.LandingFIRNTView })));
const LoginView = lazy(() => import('../views/login/LoginView').then((module) => ({ default: module.LoginView })));
const ForgotPasswordView = lazy(() => import('../views/login/ForgotPasswordView').then((module) => ({ default: module.ForgotPasswordView })));
const RegistroAsistenciaPublicaView = lazy(() => import('../views/asistencia/RegistroAsistenciaPublicaView').then((module) => ({ default: module.RegistroAsistenciaPublicaView })));

// Protección y Layout Base
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Vistas del Sistema
const CatalogosView = lazy(() => import('../views/CatalogosView').then((module) => ({ default: module.CatalogosView })));
const UsuariosView = lazy(() => import('../views/UsuariosView').then((module) => ({ default: module.UsuariosView })));
const PerfilView = lazy(() => import('../views/PerfilView').then((module) => ({ default: module.PerfilView })));
const GestionRolesView = lazy(() => import('../views/GestionRolesView').then((module) => ({ default: module.GestionRolesView })));
const LaboratoriosView = lazy(() => import('../views/LaboratoriosView').then((module) => ({ default: module.LaboratoriosView })));
const PlanesMateriasView = lazy(() => import('../views/PlanesMateriasView').then((module) => ({ default: module.PlanesMateriasView })));
const HorariosView = lazy(() => import('../views/HorariosView').then((module) => ({ default: module.HorariosView })));
const CategoriasEventosView = lazy(() => import('../views/CategoriasEventosView').then((module) => ({ default: module.CategoriasEventosView })));
const ActivitiesView = lazy(() => import('../views/ActivitiesView'));
const ParticipantesView = lazy(() => import('../views/ParticipantesView').then((module) => ({ default: module.ParticipantesView })));
const ValidacionPagosView = lazy(() => import('../views/ValidacionPagosView').then((module) => ({ default: module.ValidacionPagosView })));
const HistorialBitacorasView = lazy(() => import('../views/bitacora/HistorialBitacorasView').then((module) => ({ default: module.HistorialBitacorasView })));
const IncidenciasView = lazy(() => import('../views/incidencias/IncidenciasView'));
const InventarioEquiposView = lazy(() => import('../views/equipos/InventarioEquiposView'));
const GestionDefensasView = lazy(() => import('../views/defensas/GestionDefensasView').then((module) => ({ default: module.GestionDefensasView })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#071522] text-sm text-sky-200">
          Cargando módulo...
        </div>
      }
    >
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
            <Route path="perfil" element={<PerfilView />} />
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
            <Route path="inventario" element={<InventarioEquiposView />} />
            <Route path="equipos" element={<InventarioEquiposView />} />
            <Route path="defensas" element={<GestionDefensasView />} />
            
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
          <Route path="/perfil" element={<PerfilView />} />
          <Route path="/usuarios" element={<UsuariosView />} />
          <Route path="/roles" element={<GestionRolesView />} />
          <Route path="/laboratorios" element={<LaboratoriosView />} />
          <Route path="/horarios" element={<HorariosView />} />
          <Route path="/bitacoras" element={<HistorialBitacorasView />} />
          <Route path="/activities" element={<ActivitiesView />} />
          <Route path="/incidencias" element={<IncidenciasView />} />
          <Route path="/admin/incidencias" element={<IncidenciasView />} />
          <Route path="/admin/fallas" element={<IncidenciasView />} />
          <Route path="/admin/defensas" element={<GestionDefensasView />} />
          <Route path="/admin/planes-materias" element={<PlanesMateriasView />} />
          <Route path="/admin/actividades" element={<Navigate to="/admin/actividades/categorias" replace />} />
        </Route>
      </Route>

      {/* ========================================== */}
      {/* REDIRECCIÓN POR DEFECTO                    */}
      {/* ========================================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};
