import React, { useState } from 'react';

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  titulo: string;
  mensaje: string;
  onConfirmar: () => Promise<void>;
}

export const ModalConfirmarEliminacion: React.FC<Props> = ({
  modalAbierto,
  onClose,
  titulo,
  mensaje,
  onConfirmar,
}) => {
  const [eliminando, setEliminando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!modalAbierto) return null;

  const handleAccion = async () => {
    setEliminando(true);
    setError(null);
    try {
      await onConfirmar();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la eliminación.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
        
        <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚠️</span> {titulo}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-300">{mensaje}</p>
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
            type="button"
            disabled={eliminando}
            onClick={handleAccion}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/20"
          >
            {eliminando ? 'Procesando...' : 'Sí, Eliminar'}
          </button>
        </div>

      </div>
    </div>
  );
};