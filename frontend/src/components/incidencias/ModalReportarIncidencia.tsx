import React, { useState } from 'react';
import { PrioridadIncidencia } from '../../interfaces/incidencia.interface';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (data: {
    laboratorioId: number;
    titulo: string;
    descripcion: string;
    prioridad: PrioridadIncidencia;
  }) => Promise<void>;
  laboratorios: Array<{ id: number; nombre: string }>;
}

export const ModalReportarIncidencia: React.FC<Props> = ({ isOpen, onClose, onGuardar, laboratorios }) => {
  const [labId, setLabId] = useState<number | ''>('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('MEDIA');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId || !titulo.trim() || !descripcion.trim()) {
      setError('Por favor, complete los campos requeridos.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        laboratorioId: Number(labId),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <span>⚠️</span> Reportar Falla o Incidencia
          </h3>
          <p className="text-xs text-slate-400 mt-1">El ticket será canalizado a la Jefatura de Laboratorios.</p>
        </div>

        {error && <div className="bg-red-950/60 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Laboratorio Afectado *</label>
            <select
              required
              value={labId}
              onChange={(e) => setLabId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="">-- Seleccionar Laboratorio --</option>
              {laboratorios.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Título del Problema *</label>
            <input
              required
              type="text"
              placeholder="Ej: Falla en red cableada / Proyector sin señal"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Descripción Detallada *</label>
            <textarea
              required
              rows={3}
              placeholder="Describa el fallo observado de manera clara..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Severidad / Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as PrioridadIncidencia)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-950/40"
            >
              {enviando ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
