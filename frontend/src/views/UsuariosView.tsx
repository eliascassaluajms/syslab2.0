import React, { useState } from 'react';
import { useUsuarios, ActualizarPerfilPayload } from '../hooks/useUsuarios';
import { UsuarioLista } from '../interfaces/usuario.js';
import { Can } from '../components/common/Can';
import { ModalAsignarAmbito } from '../components/usuario/ModalAsignarAmbito.js';

export const UsuariosView: React.FC = () => {
  const { usuarios, loading, error, cambiarEstado, actualizarUsuario, crearUsuarioBasico, recargarUsuarios } = useUsuarios() as any;

  // Estados para Modales
  const [usuarioEditarAmbito, setUsuarioEditarAmbito] = useState<UsuarioLista | null>(null);
  const [usuarioModificarDatos, setUsuarioModificarDatos] = useState<UsuarioLista | null>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState<boolean>(false);

  // Estados temporales para edición de datos básicos
  const [editNombre, setEditNombre] = useState<string>('');
  const [editCorreo, setEditCorreo] = useState<string>('');

  // Estados para Registro
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoCorreo, setNuevoCorreo] = useState<string>('');
  const [nuevaPassword, setNuevaPassword] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Abrir Modal de Modificar Datos Básicos
  const abrirModalModificar = (usuario: UsuarioLista) => {
    setUsuarioModificarDatos(usuario);
    setEditNombre(usuario.nombre);
    setEditCorreo(usuario.correo);
  };

  const cerrarModales = () => {
    setUsuarioEditarAmbito(null);
    setUsuarioModificarDatos(null);
    setMostrarModalCrear(false);
  };

  // Guardar Modificación de Datos Básicos
  const handleGuardarDatosBasicos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioModificarDatos) return;
    setGuardando(true);
    try {
      const payload: ActualizarPerfilPayload = {
        nombre: editNombre,
        correo: editCorreo,
      };
      await actualizarUsuario(usuarioModificarDatos.id, payload);
      cerrarModales();
    } catch (err) {
      // Manejado en hook
    } finally {
      setGuardando(false);
    }
  };

  // Crear Usuario (Solo Datos Básicos)
  const handleCrearUsuarioBasico = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await crearUsuarioBasico({
        nombre: nuevoNombre,
        correo: nuevoCorreo,
        password: nuevaPassword,
      });
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevaPassword('');
      setMostrarModalCrear(false);
    } catch (err) {
      // Manejado en hook
    } finally {
      setGuardando(false);
    }
  };

  // Eliminación Lógica
  const handleEliminarLogico = async (usuario: UsuarioLista) => {
    if (window.confirm(`¿Estás seguro de realizar la eliminación lógica (desactivar) al usuario ${usuario.nombre}?`)) {
      try {
        await cambiarEstado(usuario.id, false);
      } catch (err) {
        // Manejado en hook
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs text-gray-400 tracking-wider animate-pulse">Cargando personal de SysLab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Encabezado Principal */}
      <div className="border-b border-gray-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">👥</span> Administración de Personal
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión centralizada de roles, estados y perímetros institucionales UAJMS
          </p>
        </div>

        {/* Botón para Abrir Modal de Registro */}
        <Can permiso="usuarios:crear">
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30"
          >
            <span className="text-sm">➕</span> Registrar Nuevo Usuario
          </button>
        </Can>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm font-medium text-red-400 flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Usuario / Correo</th>
                <th className="py-4 px-6">Roles</th>
                <th className="py-4 px-6">Ámbito / Perímetro</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {usuarios.map((u: UsuarioLista) => (
                <tr key={u.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {u.nombre}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{u.correo}</div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <span
                            key={`r-${r.id}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          >
                            {r.nombre}
                          </span>
                        ))
                      ) : u.rol ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {u.rol.nombre}
                        </span>
                      ) : (
                        <span className="text-xs italic text-gray-500">Sin Rol</span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.usuarioFacultades?.map((f) => (
                        <span key={`f-${f.facultadId}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Facultad #{f.facultadId}
                        </span>
                      ))}
                      {u.usuarioCarreras?.map((c) => (
                        <span key={`c-${c.carreraId}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Carrera #{c.carreraId}
                        </span>
                      ))}
                      {(!u.usuarioFacultades || u.usuarioFacultades.length === 0) &&
                       (!u.usuarioCarreras || u.usuarioCarreras.length === 0) && (
                        <span className="text-xs italic text-gray-500">Global / Sin restricción</span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <button
                      onClick={() => cambiarEstado(u.id, !u.activo)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        u.activo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Can permiso="usuarios:editar">
                        <button
                          onClick={() => abrirModalModificar(u)}
                          title="Modificar Datos"
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          ✏️ Modificar
                        </button>
                        <button
                          onClick={() => setUsuarioEditarAmbito(u)}
                          title="Asignar Roles y Ámbito"
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          🛡️ Roles y Ámbito
                        </button>
                        <button
                          onClick={() => handleEliminarLogico(u)}
                          title="Eliminación Lógica"
                          className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTRO DE NUEVO USUARIO */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Registrar Nuevo Usuario
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Ingrese la información básica de identidad y acceso.
              </p>
            </div>

            <form onSubmit={handleCrearUsuarioBasico} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@uajms.edu.bo"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {guardando ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MODIFICAR DATOS BÁSICOS */}
      {usuarioModificarDatos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>✏️</span> Modificar Datos de Usuario
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Actualice el nombre o correo institucional.
              </p>
            </div>

            <form onSubmit={handleGuardarDatosBasicos} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  required
                  value={editCorreo}
                  onChange={(e) => setEditCorreo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {guardando ? 'Guardando...' : 'Actualizar Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASIGNAR ROLES Y ÁMBITO (COMPONENTIZADO) */}
      <ModalAsignarAmbito
        modalAbierto={Boolean(usuarioEditarAmbito)}
        onClose={cerrarModales}
        usuario={usuarioEditarAmbito}
        onActualizado={() => {
          if (typeof recargarUsuarios === 'function') {
            recargarUsuarios();
          }
        }}
      />
    </div>
  );
};