import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { httpClient } from '../../services/httpClient';
import { activityService } from '../../services/activity.service';

interface Props {
  isOpen: boolean;
  actividad?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const FormActividadModal: React.FC<Props> = ({ isOpen, actividad, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [labId, setLabId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carreras, setCarreras] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeList = (res: any): any[] => {
    if (!res) return [];
    let target = res.data !== undefined ? res.data : res;
    if (target?.data !== undefined && !Array.isArray(target)) {
      target = target.data;
    }
    if (Array.isArray(target)) return target;
    if (Array.isArray(target?.carreras)) return target.carreras;
    if (Array.isArray(target?.categorias)) return target.categorias;
    if (Array.isArray(target?.laboratorios)) return target.laboratorios;
    if (Array.isArray(target?.items)) return target.items;
    if (Array.isArray(target?.rows)) return target.rows;
    return [];
  };

  useEffect(() => {
    if (!isOpen) return;

    if (actividad) {
      setNombre(actividad.title || actividad.titulo || actividad.nombre || '');
      setDescripcion(actividad.description || actividad.descripcion || '');
      setCategoriaId(actividad.categoriaId || actividad.categoria_id || '');
      setCarreraId(actividad.careerScope || actividad.carreraId || '');
      setLabId(actividad.labId || actividad.lab_id || '');
      setFechaInicio(actividad.fechaInicio ? actividad.fechaInicio.split('T')[0] : '');
      setFechaFin(actividad.fechaFin ? actividad.fechaFin.split('T')[0] : '');
      setActivo(actividad.activo !== false);
    } else {
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setCarreraId('');
      setLabId('');
      setFechaInicio('');
      setFechaFin('');
      setActivo(true);
    }

    const fetchCatalogos = async () => {
      try {
        const resCar = await httpClient.get('/catalogos/carreras');
        setCarreras(normalizeList(resCar));
      } catch (e) {
        console.error('Error al cargar carreras:', e);
      }

      try {
        const resCat = await httpClient.get('/actividades/categorias');
        setCategorias(normalizeList(resCat));
      } catch (e) {
        try {
          const resCatAlt = await httpClient.get('/activities/categorias');
          setCategorias(normalizeList(resCatAlt));
        } catch (err) {}
      }

      try {
        const resLabs = await httpClient.get('/laboratorios');
        setLaboratorios(normalizeList(resLabs));
      } catch (e) {
        console.error('Error al cargar laboratorios:', e);
      }
    };

    fetchCatalogos();
  }, [isOpen, actividad?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: Record<string, any> = {
      title: nombre.trim(),
      nombre: nombre.trim(),
      description: descripcion.trim() || null,
      descripcion: descripcion.trim() || null,
      careerScope: carreraId ? String(carreraId) : '1',
      carreraId: carreraId ? Number(carreraId) : 1,
      carrera_id: carreraId ? Number(carreraId) : 1,
      labId: labId ? Number(labId) : (laboratorios[0]?.id || 1),
      lab_id: labId ? Number(labId) : (laboratorios[0]?.id || 1),
      fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
      fechaFin: fechaFin ? new Date(fechaFin).toISOString() : null,
      activo
    };

    if (categoriaId !== '') {
      payload.categoriaId = categoriaId ? Number(categoriaId) : null;
      payload.categoria_id = categoriaId ? Number(categoriaId) : null;
    }

    try {
      if (actividad && actividad.id) {
        await activityService.actualizar(actividad.id, payload);
      } else {
        await activityService.crear(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al procesar la actividad';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            {actividad ? 'Editar Actividad Académica' : 'Nueva Actividad Académica'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm break-words">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nombre / Título de la Actividad *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Conferencia de Redes"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Carrera Destino *
              </label>
              <select
                required
                value={carreraId}
                onChange={(e) => setCarreraId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Seleccione carrera...</option>
                {carreras.map((car: any) => (
                  <option key={car.id} value={car.id}>
                    {car.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Laboratorio *
              </label>
              <select
                required
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Seleccione laboratorio...</option>
                {laboratorios.map((lab: any) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Categoría del Evento
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Seleccione categoría (opcional)</option>
              {categorias.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha Inicio (Opcional)
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha Fin (Opcional)
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="activo-check"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="activo-check" className="text-sm font-medium text-slate-300 cursor-pointer">
              Actividad Abierta (Habilitada para inscripciones públicas en el landing)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles de la actividad..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : actividad ? 'Guardar Cambios' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default FormActividadModal;
