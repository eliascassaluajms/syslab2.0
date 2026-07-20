import React, { useState } from 'react';
import { useUsuarios, UsuarioLista, ActualizarPerfilPayload } from '../hooks/useUsuarios';
import { Can } from '../components/common/Can';

export const UsuariosView: React.FC = () => {
  const { usuarios, loading, error, cambiarEstado, actualizarUsuario } = useUsuarios();
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioLista | null>(null);

  // Estados locales para el formulario Modal de edición
  const [rolId, setRolId] = useState<number>(1);
  const [facultades, setFacultades] = useState<number[]>([]);
  const [carreras, setCarreras] = useState<number[]>([]);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Abrir Modal con la información precargada del usuario
  const abrirModalEditar = (usuario: UsuarioLista) => {
    setUsuarioEditar(usuario);
    setRolId(usuario.rol.id);
    setFacultades(usuario.usuarioFacultades.map((f) => f.facultadId));
    setCarreras(usuario.usuarioCarreras.map((c) => c.carreraId));
  };

  const cerrarModal = () => {
    setUsuarioEditar(null);
  };

  // Guardar cambios de Rol y Perímetros (KAN-17 / KAN-23)
  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditar) return;

    setGuardando(true);
    try {
      const payload: ActualizarPerfilPayload = {
        rolId,
        facultades,
        carreras,
      };
      await actualizarUsuario(usuarioEditar.id, payload);
      cerrarModal();
    } catch (err) {
      // El error se gestiona desde el hook useUsuarios
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando personal de SysLab...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administración de Personal</h1>
          <p className="text-sm text-gray-500">
            Gestión centralizada de roles, estados y perímetros institucionales
          </p>
        </div>
      </div>

      {/* Mensaje de Error global */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Tabla / Grilla de Usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Usuario / Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ámbito / Perímetro
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                {/* Nombre y Correo */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{u.nombre}</div>
                  <div className="text-sm text-gray-500">{u.correo}</div>
                </td>

                {/* Rol */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {u.rol?.nombre || 'Sin Rol'}
                  </span>
                </td>

                {/* Badges de Ámbitos (Facultades y Carreras) */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.usuarioFacultades.map((f) => (
                      <span
                        key={`f-${f.facultadId}`}
                        className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded"
                      >
                        Facultad #{f.facultadId}
                      </span>
                    ))}
                    {u.usuarioCarreras.map((c) => (
                      <span
                        key={`c-${c.carreraId}`}
                        className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded"
                      >
                        Carrera #{c.carreraId}
                      </span>
                    ))}
                    {u.usuarioFacultades.length === 0 && u.usuarioCarreras.length === 0 && (
                      <span className="text-xs text-gray-400 italic">Global / Sin restricción</span>
                    )}
                  </div>
                </td>

                {/* Switch Estado Activo / Inactivo */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => cambiarEstado(u.id, !u.activo)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                      u.activo
                        ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    }`}
                  >
                    {u.activo ? '● Activo' : '○ Inactivo'}
                  </button>
                </td>

                {/* Acciones del Administrador */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Can permiso="usuarios:editar">
                    <button
                      onClick={() => abrirModalEditar(u)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Editar Ámbito
                    </button>
                  </Can>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN DE ÁMBITO Y ROL */}
      {usuarioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Editar Perfil de {usuarioEditar.nombre}
            </h3>

            <form onSubmit={handleGuardarPerfil} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol del Sistema
                </label>
                <select
                  value={rolId}
                  onChange={(e) => setRolId(Number(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>Administrador</option>
                  <option value={2}>Docente / Encargado</option>
                  <option value={3}>Auxiliar de Laboratorio</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};