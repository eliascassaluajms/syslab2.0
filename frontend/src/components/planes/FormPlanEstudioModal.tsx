import React, { useState, useEffect } from 'react';

interface PlanEstudio {
  id?: number;
  carreraId: number;
  gestion: number;
  descripcion?: string;
  activo?: boolean;
}

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  planAEditar?: PlanEstudio | null;
  carreraId: number;
  onGuardar: (payload: any, id?: number) => Promise<void>;
}

export const FormPlanEstudioModal: React.FC<Props> = ({
  modalAbierto,
  onClose,
  planAEditar,
  carreraId,
  onGuardar,
}) => {
  const [gestion, setGestion] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planAEditar) {
      setGestion(planAEditar.gestion ? String(planAEditar.gestion) : '');
      setDescripcion(planAEditar.descripcion || '');
      setActivo(planAEditar.activo ?? true);
    } else {
      setGestion('');
      setDescripcion('');
      setActivo(true);
    }
    setError(null);
  }, [planAEditar, modalAbierto]);

  if (!modalAbierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const payload = {
      carreraId,
      gestion: Number(gestion),
      descripcion,
      activo,
    };

    try {
      await onGuardar(payload, planAEditar?.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el plan de estudio.');
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
              <span>📚</span> {planAEditar ? 'Modificar Plan de Estudio' : 'Nuevo Plan de Estudio'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {planAEditar ? 'Actualice los datos del plan académico.' : 'Registre una nueva gestión o malla.'}
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
              Gestión (Año)
            </label>
            <input
              type="number"
              required
              placeholder="Ej. 2026"
              value={gestion}
              onChange={(e) => setGestion(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Descripción / Referencia
            </label>
            <input
              type="text"
              placeholder="Ej. Plan base por competencias"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {planAEditar && (
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="planActivo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="planActivo" className="text-sm text-gray-300 cursor-pointer">
                Plan activo actualmente
              </label>
            </div>
          )}

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
              {guardando ? 'Guardando...' : 'Guardar Plan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};