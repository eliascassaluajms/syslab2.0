import { useState, useEffect } from 'react';
import { createActivity } from '../services/activity.service';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  careerScopeDefault?: string;
}

interface LaboratorioOption {
  id: number;
  codigo: string;
  nombre: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ActivityModal({ isOpen, onClose, onSuccess, careerScopeDefault = '' }: ActivityModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerScope, setCareerScope] = useState(careerScopeDefault);
  const [labId, setLabId] = useState<number | ''>('');
  const [laboratorios, setLaboratorios] = useState<LaboratorioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/laboratorios`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          // Asumiendo que la API de laboratorios retorna un array o un objeto paginado con data
          const list = Array.isArray(data) ? data : (data.data || data.laboratorios || []);
          setLaboratorios(list);
        })
        .catch(() => setLaboratorios([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId) {
      setError('Debe seleccionar un laboratorio');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createActivity({
        title,
        description: description.trim() ? description : undefined,
        careerScope,
        labId: Number(labId)
      });
      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setLabId('');
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 p-6">
        <h2 className="text-xl font-bold mb-4">Registrar Nueva Actividad</h2>
        {error && <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Título</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ej. Taller de Mantenimiento Preventivo"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Descripción</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              rows={3}
              placeholder="Detalles de la actividad..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Ámbito de Carrera</label>
            <input 
              type="text" 
              required 
              value={careerScope} 
              onChange={e => setCareerScope(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ej. Ing. Informatica"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Laboratorio</label>
            <select 
              required 
              value={labId} 
              onChange={e => setLabId(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Seleccione un laboratorio...</option>
              {laboratorios.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.codigo} - {lab.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-medium transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
