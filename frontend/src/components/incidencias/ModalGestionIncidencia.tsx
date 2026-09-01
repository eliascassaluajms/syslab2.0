import React, { useState } from 'react';
import { IncidenciaItem, EstadoIncidencia } from '../../interfaces/incidencia.interface';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  incidencia: IncidenciaItem | null;
  onGuardar: (id: number, data: { estado: EstadoIncidencia; solucion: string }) => Promise<void>;
}

export const ModalGestionIncidencia: React.FC<Props> = ({ isOpen, onClose, incidencia, onGuardar }) => {
  const [estado, setEstado] = useState<EstadoIncidencia>(incidencia?.estado || 'PENDIENTE');
  const [solucion, setSolucion] = useState(incidencia?.solucion || '');
  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !incidencia) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onGuardar(incidencia.id, { estado, solucion });
      onClose();
    } catch {
      alert('Error al actualizar el estado de la incidencia.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Atención Técnica de Falla</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">Ticket #{incidencia.id}: {incidencia.titulo}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Estado de la Falla</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoIncidencia)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso (Asignado)</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Diagnóstico / Solución Aplicada</label>
            <textarea
              rows={3}
              placeholder="Detalle los trabajos técnicos realizados o motivo de resolución..."
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
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
              disabled={guardando}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-blue-950/40"
            >
              {guardando ? 'Guardando...' : 'Actualizar Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
