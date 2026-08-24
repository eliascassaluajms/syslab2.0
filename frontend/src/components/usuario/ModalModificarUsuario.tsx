import React, { useState, useEffect } from 'react';
import { UsuarioLista } from '../../interfaces/usuario';

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  usuario: UsuarioLista | null;
  onActualizar: (id: number, payload: any) => Promise<void>;
}

export const ModalModificarUsuario: React.FC<Props> = ({ modalAbierto, onClose, usuario, onActualizar }) => {
  const [editNombre, setEditNombre] = useState<string>('');
  const [editCorreo, setEditCorreo] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setEditNombre(usuario.nombre || '');
      setEditCorreo(usuario.correo || '');
      setError(null);
    }
  }, [usuario, modalAbierto]);

  if (!modalAbierto || !usuario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const rolIds = usuario.roles?.map(r => r.id) || (usuario.rol ? [usuario.rol.id] : []);

      // Mapeo corregido para leer facultades y carreras desde las propiedades reales del objeto
      const facultades = usuario.facultades 
        ?? usuario.asignacionesRoles?.map(a => a.facultadId).filter(Boolean) 
        ?? [];

      const carreras = usuario.carreras 
        ?? usuario.asignacionesRoles?.map(a => a.carreraId).filter(Boolean) 
        ?? [];

      const payload = {
        nombre: editNombre,
        correo: editCorreo,
        rolIds,
        roles: rolIds,
        rolId: rolIds[0] || null,
        facultades,
        carreras,
      };

      await onActualizar(usuario.id, payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar los datos del usuario.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
        
        {/* Encabezado */}
        <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>✏️</span> Modificar Datos de Usuario
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Actualice el nombre o correo institucional.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
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
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {guardando ? 'Guardando...' : 'Actualizar Datos'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
