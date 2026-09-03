import React, { useState, useEffect } from 'react';
import { UsuarioLista } from '../../interfaces/usuario';

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  usuario: UsuarioLista | null;
  onCambiarPassword: (id: number, nuevaPassword: string) => Promise<any>;
}

export const ModalCambiarPassword: React.FC<Props> = ({
  modalAbierto,
  onClose,
  usuario,
  onCambiarPassword,
}) => {
  const [nuevaPassword, setNuevaPassword] = useState<string>('');
  const [confirmarPassword, setConfirmarPassword] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    if (modalAbierto) {
      setNuevaPassword('');
      setConfirmarPassword('');
      setError(null);
      setExito(null);
    }
  }, [modalAbierto]);

  if (!modalAbierto || !usuario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (nuevaPassword.trim().length < 6) {
      setError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden. Verifique ambas entradas.');
      return;
    }

    setGuardando(true);
    try {
      const res = await onCambiarPassword(usuario.id, nuevaPassword.trim());
      setExito(res?.message || 'Contraseña actualizada correctamente.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const nombreMostrar = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
        
        {/* Encabezado */}
        <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔑</span> Cambiar Contraseña
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Actualice la clave de acceso institucional para {nombreMostrar}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tarjeta Informativa de Usuario */}
        <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">{nombreMostrar}</div>
            <div className="text-[11px] text-gray-400">{usuario.correo}</div>
          </div>
          {usuario.username && (
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
              @{usuario.username}
            </span>
          )}
        </div>

        {/* Mensaje de exito */}
        {exito && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <span>✅</span> {exito}
          </div>
        )}

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
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="Repita la nueva contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
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
              disabled={guardando || !!exito}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-600/20"
            >
              {guardando ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
