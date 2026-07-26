import React, { useState, useEffect } from 'react';

interface Materia {
  id?: number;
  codigo: string;
  nombre: string;
  planId: number;
  tipoPeriodo?: string; // semestral, anual, modular
  semestre: number;
}

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  materiaAEditar?: Materia | null;
  planId: number;
  onGuardar: (payload: any, id?: number) => Promise<void>;
}

export const FormMateriaModal: React.FC<Props> = ({
  modalAbierto,
  onClose,
  materiaAEditar,
  planId,
  onGuardar,
}) => {
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [semestre, setSemestre] = useState<string>('1');
  const [tipoPeriodo, setTipoPeriodo] = useState<string>('semestral');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materiaAEditar) {
      setCodigo(materiaAEditar.codigo || '');
      setNombre(materiaAEditar.nombre || '');
      setSemestre(materiaAEditar.semestre ? String(materiaAEditar.semestre) : '1');
      setTipoPeriodo(materiaAEditar.tipoPeriodo || 'semestral');
    } else {
      setCodigo('');
      setNombre('');
      setSemestre('1');
      setTipoPeriodo('semestral');
    }
    setError(null);
  }, [materiaAEditar, modalAbierto]);

  if (!modalAbierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const payload = {
      codigo,
      nombre,
      planId,
      semestre: Number(semestre),
      tipoPeriodo,
    };

    try {
      await onGuardar(payload, materiaAEditar?.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la materia.');
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
              <span>📖</span> {materiaAEditar ? 'Modificar Materia' : 'Nueva Materia'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Configure los detalles de la asignatura en la malla.
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
              Código de Materia
            </label>
            <input
              type="text"
              required
              placeholder="Ej. INF-101"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Nombre de la Asignatura
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Arquitectura de Computadoras"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Semestre / Año
              </label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Tipo Periodo
              </label>
              <select
                value={tipoPeriodo}
                onChange={(e) => setTipoPeriodo(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="modular">Modular</option>
              </select>
            </div>
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
              {guardando ? 'Guardando...' : 'Guardar Materia'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};