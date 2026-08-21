import React, { useState } from 'react';
import { useUsuarios } from '../hooks/useUsuarios';
import { UsuarioLista } from '../interfaces/usuario.js';
import { Can } from '../components/common/Can';
import { ModalAsignarAmbito } from '../components/usuario/ModalAsignarAmbito.js';
import { ModalModificarUsuario } from '../components/usuario/ModalModificarUsuario.js';
import { ModalEliminarUsuario } from '../components/usuario/ModalEliminarUsuario.js';
import { ModalCrearUsuario } from '../components/usuario/ModalCrearUsuario.js';
import { useToast } from '../context/ToastContext';

export const UsuariosView: React.FC = () => {
  const { usuarios, loading, error, cambiarEstado, actualizarUsuario, crearUsuarioBasico, recargarUsuarios } = useUsuarios() as any;
  const { mostrarToast } = useToast();

  // Estados para Filtros y Búsqueda
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estados para Modales
  const [usuarioEditarAmbito, setUsuarioEditarAmbito] = useState<UsuarioLista | null>(null);
  const [usuarioModificarDatos, setUsuarioModificarDatos] = useState<UsuarioLista | null>(null);
  const [usuarioEliminarLogico, setUsuarioEliminarLogico] = useState<UsuarioLista | null>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState<boolean>(false);

  const cerrarModales = () => {
    setUsuarioEditarAmbito(null);
    setUsuarioModificarDatos(null);
    setUsuarioEliminarLogico(null);
    setMostrarModalCrear(false);
  };

  // Filtrado computado de usuarios en tiempo real
  const usuariosFiltrados = usuarios.filter((u: UsuarioLista) => {
    const coincideTexto =
      u.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(filtroBusqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === 'todos' ? true :
        filtroEstado === 'activos' ? u.activo : !u.activo;

    return coincideTexto && coincideEstado;
  });

  // Manejador seguro para cambio de estado directo en la tabla
  const handleCambiarEstadoDirecto = async (id: number, nuevoEstado: boolean) => {
    try {
      await cambiarEstado(id, nuevoEstado);
      mostrarToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`, 'success');
      if (typeof recargarUsuarios === 'function') {
        recargarUsuarios();
      }
    } catch (err: any) {
      mostrarToast(err?.message || 'Error al actualizar el estado del usuario.', 'error');
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

        <Can permiso="usuarios:crear">
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30"
          >
            <span className="text-sm">➕</span> Registrar Nuevo Usuario
          </button>
        </Can>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm font-medium text-red-400 flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Input de Búsqueda */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo institucional..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filtro Rápido por Estado */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="todos">Todos los registros</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
          </select>
        </div>
      </div>

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
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-xs italic">
                    No se encontraron usuarios que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u: UsuarioLista) => (
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
                            <span key={`r-${r.id}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
                        {u.asignacionesRoles && u.asignacionesRoles.length > 0 ? (
                          u.asignacionesRoles.map((a: any, idx: number) => (
                            <React.Fragment key={`amb-${idx}-${a.id || idx}`}>
                              {a.facultad && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Facultad: {a.facultad.sigla || a.facultad.nombre}
                                </span>
                              )}
                              {a.carrera && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  Carrera: {a.carrera.nombre}
                                </span>
                              )}
                            </React.Fragment>
                          ))
                        ) : null}

                        {(!u.asignacionesRoles || u.asignacionesRoles.length === 0) && (
                          <span className="text-xs italic text-gray-500">Global / Sin restricción</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleCambiarEstadoDirecto(u.id, !u.activo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${u.activo
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
                            onClick={() => setUsuarioModificarDatos(u)}
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
                            onClick={() => setUsuarioEliminarLogico(u)}
                            title="Eliminación Lógica"
                            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            🗑️ Eliminar
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTRO DE NUEVO USUARIO */}
      <ModalCrearUsuario
        modalAbierto={mostrarModalCrear}
        onClose={cerrarModales}
        onCrear={async (payload) => {
          try {
            await crearUsuarioBasico(payload);
            mostrarToast('Usuario registrado exitosamente.', 'success');
            cerrarModales();
            if (typeof recargarUsuarios === 'function') {
              recargarUsuarios();
            }
          } catch (err: any) {
            mostrarToast(err?.message || 'Error al registrar el usuario.', 'error');
          }
        }}
      />

      {/* MODAL 2: MODIFICAR DATOS BÁSICOS */}
      <ModalModificarUsuario
        modalAbierto={Boolean(usuarioModificarDatos)}
        onClose={cerrarModales}
        usuario={usuarioModificarDatos}
        onActualizar={async (id, payload) => {
          try {
            await actualizarUsuario(id, payload);
            mostrarToast('Datos del usuario actualizados correctamente.', 'success');
            cerrarModales();
            if (typeof recargarUsuarios === 'function') {
              recargarUsuarios();
            }
          } catch (err: any) {
            mostrarToast(err?.message || 'Error al actualizar los datos.', 'error');
          }
        }}
      />

      {/* MODAL 3: ASIGNAR ROLES Y ÁMBITO */}
      <ModalAsignarAmbito
        modalAbierto={Boolean(usuarioEditarAmbito)}
        onClose={cerrarModales}
        usuario={usuarioEditarAmbito}
        onActualizado={() => {
          mostrarToast('Ámbito y roles asignados correctamente.', 'success');
          cerrarModales();
          if (typeof recargarUsuarios === 'function') {
            recargarUsuarios();
          }
        }}
      />

      {/* MODAL 4: ELIMINACIÓN LÓGICA */}
      <ModalEliminarUsuario
        modalAbierto={Boolean(usuarioEliminarLogico)}
        onClose={cerrarModales}
        usuario={usuarioEliminarLogico}
        onConfirmarEliminacion={async (id) => {
          try {
            await cambiarEstado(id, false);
            mostrarToast('Usuario desactivado lógicamente.', 'success');
            cerrarModales();
            if (typeof recargarUsuarios === 'function') {
              recargarUsuarios();
            }
          } catch (err: any) {
            mostrarToast(err?.message || 'Error al procesar la eliminación.', 'error');
          }
        }}
      />
    </div>
  );
};