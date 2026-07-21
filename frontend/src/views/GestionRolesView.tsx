import React, { useState, useEffect } from 'react';
import { httpClient as api } from '../services/httpClient';

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean; // Control de Eliminación Lógica
}

export const GestionRolesView: React.FC = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados Modal Editar / Crear
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [rolEditar, setRolEditar] = useState<Rol | null>(null);
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Cargar Roles desde el Backend
  const cargarRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/roles');
      setRoles(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la lista de roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  // Abrir Modal para Crear o Modificar
  const handleAbrirModal = (rol?: Rol) => {
    if (rol) {
      setRolEditar(rol);
      setNombre(rol.nombre);
      setDescripcion(rol.descripcion);
    } else {
      setRolEditar(null);
      setNombre('');
      setDescripcion('');
    }
    setModalAbierto(true);
  };

  // Guardar (Crear o Modificar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);

    try {
      if (rolEditar) {
        // Actualizar rol existente
        await api.put(`/roles/${rolEditar.id}`, { nombre, descripcion });
      } else {
        // Crear nuevo rol
        await api.post('/roles', { nombre, descripcion, activo: true });
      }
      setModalAbierto(false);
      await cargarRoles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el rol.');
    } finally {
      setGuardando(false);
    }
  };

  // 🟢 ELIMINACIÓN LÓGICA / CAMBIO DE ESTADO (Activo <-> Inactivo)
  const handleToggleEstado = async (rol: Rol) => {
    const confirmacion = window.confirm(
      `¿Deseas ${rol.activo ? 'desactivar (eliminar lógicamente)' : 'reactivar'} el rol "${rol.nombre}"?`
    );
    if (!confirmacion) return;

    try {
      // Petición PATCH para cambiar únicamente el estado lógico
      await api.patch(`/roles/${rol.id}/estado`, { activo: !rol.activo });
      await cargarRoles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado del rol.');
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
      {/* Encabezado */}
      <div className="border-b border-gray-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>🛡️</span> Roles y Permisos del Sistema
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión de niveles de acceso y estado del personal en SysLab.
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
              <th className="py-4 px-6 text-center">Estado (Lógico)</th>
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

                  {/* Insignia de Estado */}
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        rol.activo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {rol.activo ? '🟢 Activo' : '🔴 Inactivo'}
                    </span>
                  </td>

                  {/* Botones Modificar y Eliminación Lógica */}
                  <td className="py-4 px-6 text-center space-x-2">
                    <button
                      onClick={() => handleAbrirModal(rol)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      ✏️ Modificar
                    </button>
                    <button
                      onClick={() => handleToggleEstado(rol)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
                        rol.activo
                          ? 'text-red-400 hover:bg-red-500/10 border-red-500/30'
                          : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      {rol.activo ? '🗑️ Desactivar' : '🔄 Reactivar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-xs italic">
                  No hay roles registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Modificar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <h3 className="text-lg font-bold border-b border-gray-800 pb-3">
              {rolEditar ? '✏️ Modificar Rol' : '➕ Crear Nuevo Rol'}
            </h3>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Técnico de Laboratorio"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-20"
                  placeholder="Descripción de funciones o accesos..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};