import React, { useState } from 'react';
import { useRoles, RolItem } from '../hooks/useRoles';
import { RoleModal, Permiso as PermisoModal, Rol as RolModalType } from '../components/roles/RoleModal';

export const GestionRolesView: React.FC = () => {
  // 1. Extraemos las funciones y estado directamente del Custom Hook
  const { roles, permisos, loading, error, crearRol, actualizarRol, eliminarRol } = useRoles();

  // Estados para Control del Modal
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [rolEditar, setRolEditar] = useState<RolItem | null>(null);

  // 🚪 Abrir Modal para Crear o Editar
  const handleAbrirModal = (rol?: RolItem) => {
    setRolEditar(rol || null);
    setModalAbierto(true);
  };

  // 🔄 Adaptación 1: Transformar el catálogo de Permisos para RoleModal
  // Extrae el nombre del módulo del código (ej. 'laboratorios:crear' -> módulo: 'laboratorios')
  const permisosDisponiblesModal: PermisoModal[] = permisos.map((p) => {
    const partes = p.codigo.split(':');
    const modulo = partes.length > 1 ? partes[0] : 'general';
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.descripcion || p.codigo,
      modulo: modulo.charAt(0).toUpperCase() + modulo.slice(1),
    };
  });

  // 🔄 Adaptación 2: Transformar el Rol seleccionado para el estado interno de RoleModal
  const rolSeleccionadoModal: RolModalType | null = rolEditar
    ? {
        id: rolEditar.id,
        nombre: rolEditar.nombre,
        descripcion: rolEditar.descripcion || '',
        nivelAmbito: 'CARRERA', // Valor por defecto perimetral
        permisos: rolEditar.permisos ? rolEditar.permisos.map((p) => p.codigo) : [],
      }
    : null;

  // 💾 Guardar Rol (Crear o Actualizar en BD a través del Hook)
  const handleGuardarRol = async (rolData: Partial<RolModalType>) => {
    // Convertir la lista de CÓDIGOS de permisos seleccionados de vuelta a IDs para la API
    const permisoIds = rolData.permisos
      ? rolData.permisos
          .map((codigo) => permisos.find((p) => p.codigo === codigo)?.id)
          .filter((id): id is number => id !== undefined)
      : [];

    if (rolData.id) {
      // Modificar Rol existente
      await actualizarRol(rolData.id, {
        nombre: rolData.nombre,
        descripcion: rolData.descripcion,
        permisoIds,
      });
    } else {
      // Crear Nuevo Rol
      await crearRol({
        nombre: rolData.nombre || '',
        descripcion: rolData.descripcion,
        permisoIds,
      });
    }
  };

  // 🗑️ Eliminar Rol
  const handleEliminarRol = async (rol: RolItem) => {
    const confirmacion = window.confirm(
      `¿Deseas eliminar permanentemente el rol "${rol.nombre}"?`
    );
    if (!confirmacion) return;

    try {
      await eliminarRol(rol.id);
    } catch (err) {
      // El mensaje de error ya es capturado por el hook
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="border-b border-gray-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>🛡️</span> Roles y Permisos del Sistema
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión de niveles de acceso, catálogo de permisos y usuarios asignados en SysLab 2.0.
          </p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          ➕ Nuevo Rol
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Tabla de Roles */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Nombre del Rol</th>
              <th className="py-4 px-6">Descripción</th>
              <th className="py-4 px-6 text-center">Permisos Asignados</th>
              <th className="py-4 px-6 text-center">Usuarios</th>
              <th className="py-4 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {roles.length > 0 ? (
              roles.map((rol) => (
                <tr key={rol.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-4 px-6 text-gray-500 font-mono text-xs">#{rol.id}</td>
                  <td className="py-4 px-6 font-semibold text-white">{rol.nombre}</td>
                  <td className="py-4 px-6 text-gray-400 text-xs">{rol.descripcion || '-'}</td>

                  {/* Badges de Permisos */}
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      🔑 {rol.permisos ? rol.permisos.length : 0} permisos
                    </span>
                  </td>

                  {/* Total de Usuarios */}
                  <td className="py-4 px-6 text-center text-gray-300 font-mono text-xs">
                    👥 {rol.totalUsuarios ?? 0}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-center space-x-2">
                    <button
                      onClick={() => handleAbrirModal(rol)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      ✏️ Modificar
                    </button>
                    <button
                      onClick={() => handleEliminarRol(rol)}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-xs italic">
                  No hay roles registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Conectado con la API */}
      <RoleModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSave={handleGuardarRol}
        rolSeleccionado={rolSeleccionadoModal}
        permisosDisponibles={permisosDisponiblesModal}
      />
    </div>
  );
};