import React, { useState } from 'react';
import { useRoles, RolItem, Permiso } from '../hooks/useRoles';

export const GestionRoles: React.FC = () => {
  const { roles, permisos, loading, error, crearRol, actualizarRol, eliminarRol } = useRoles();

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [rolEnEdicion, setRolEnEdicion] = useState<RolItem | null>(null);
  
  // Estado del Formulario
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<number[]>([]);
  
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Abrir modal para Crear
  const abrirModalCrear = () => {
    setRolEnEdicion(null);
    setNombre('');
    setDescripcion('');
    setPermisosSeleccionados([]);
    setErrorForm(null);
    setModalAbierto(true);
  };

  // Abrir modal para Editar
  const abrirModalEditar = (rol: RolItem) => {
    setRolEnEdicion(rol);
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion || '');
    setPermisosSeleccionados(rol.permisos.map((p) => p.id));
    setErrorForm(null);
    setModalAbierto(true);
  };

  // Alternar selección de permiso
  const togglePermiso = (permisoId: number) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(permisoId)
        ? prev.filter((id) => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorForm('El nombre del rol es obligatorio.');
      return;
    }

    setEnviando(true);
    setErrorForm(null);

    try {
      if (rolEnEdicion) {
        await actualizarRol(rolEnEdicion.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          permisoIds: permisosSeleccionados,
        });
      } else {
        await crearRol({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          permisoIds: permisosSeleccionados,
        });
      }
      setModalAbierto(false);
    } catch (err: any) {
      setErrorForm(err.message || 'Error al procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  // Eliminar Rol con confirmación
  const handleEliminar = async (rol: RolItem) => {
    if (rol.nombre === 'Administrador') {
      alert('El rol Administrador es del sistema y no puede ser eliminado.');
      return;
    }

    if (rol.totalUsuarios > 0) {
      alert(`No se puede eliminar el rol "${rol.nombre}" porque tiene ${rol.totalUsuarios} usuario(s) asignado(s).`);
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) {
      try {
        await eliminarRol(rol.id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el rol.');
      }
    }
  };

  // Agrupa permisos por módulo antes de ':' (ej: 'usuarios:listar' -> Modulo: 'usuarios')
  const permisosAgrupados = permisos.reduce((acc, permiso) => {
    const modulo = permiso.codigo.split(':')[0] || 'general';
    if (!acc[modulo]) acc[modulo] = [];
    acc[modulo].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  return (
    <div className="p-6 bg-[#0B0F17] min-h-screen text-slate-100 font-sans">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Matriz de Roles y Permisos (RBAC)
          </h1>
          <p className="text-sm text-slate-400">
            Defina los perfiles de acceso y asigne privilegios granulares del sistema.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <span className="text-lg">+</span> Crear Nuevo Rol
        </button>
      </div>

      {/* Banner de Error General */}
      {error && (
        <div className="bg-red-950/60 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
          ⚠️ {error}
        </div>
      )}

      {/* Grid de Roles */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando matriz de acceso...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((rol) => (
            <div
              key={rol.id}
              className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white">{rol.nombre}</h3>
                  <span className="bg-blue-950 text-blue-400 border border-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                    {rol.totalUsuarios} usuario(s)
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {rol.descripcion || 'Sin descripción asignada.'}
                </p>

                {/* Badges de Permisos */}
                <div className="mb-4">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-2">
                    Permisos Asignados ({rol.permisos.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {rol.permisos.length > 0 ? (
                      rol.permisos.map((p) => (
                        <span
                          key={p.id}
                          className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded font-mono border border-slate-700"
                        >
                          {p.codigo}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 italic">Sin permisos configurados</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => abrirModalEditar(rol)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(rol)}
                  disabled={rol.nombre === 'Administrador' || rol.totalUsuarios > 0}
                  className="bg-red-950/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 text-xs font-medium py-2 px-3 rounded-lg border border-red-900/50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL CREAR / EDITAR ROL ================= */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#131B2E] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0F1626]">
              <h2 className="text-lg font-bold text-white">
                {rolEnEdicion ? `Editar Rol: ${rolEnEdicion.nombre}` : 'Crear Nuevo Rol'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Formulario Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              {errorForm && (
                <div className="bg-red-950/80 border border-red-500 text-red-200 text-xs p-3 rounded-lg">
                  {errorForm}
                </div>
              )}

              {/* Input Nombre */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Nombre del Rol <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Auditor de Seguridad"
                  disabled={rolEnEdicion?.nombre === 'Administrador'}
                  className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Input Descripción */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describa brevemente la responsabilidad de este rol..."
                  className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Selección de Permisos por Módulo */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                  Matriz de Permisos
                </label>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border border-slate-800 rounded-xl p-4 bg-[#0B0F17]">
                  {Object.keys(permisosAgrupados).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay permisos registrados en el catálogo.</p>
                  ) : (
                    Object.entries(permisosAgrupados).map(([modulo, listaPermisos]) => (
                      <div key={modulo} className="border-b border-slate-800/80 last:border-b-0 pb-3 last:pb-0">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">
                          Módulo: {modulo}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {listaPermisos.map((p) => {
                            const estaSeleccionado = permisosSeleccionados.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  estaSeleccionado
                                    ? 'bg-blue-950/40 border-blue-600/60 text-white'
                                    : 'bg-[#131B2E] border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={estaSeleccionado}
                                  onChange={() => togglePermiso(p.id)}
                                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                                />
                                <div>
                                  <span className="font-mono text-[11px] block text-slate-200">{p.codigo}</span>
                                  {p.descripcion && (
                                    <span className="text-[10px] text-slate-500 block leading-tight">
                                      {p.descripcion}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-2.5 rounded-lg shadow-md transition-colors"
                >
                  {enviando ? 'Guardando...' : rolEnEdicion ? 'Actualizar Rol' : 'Guardar Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};