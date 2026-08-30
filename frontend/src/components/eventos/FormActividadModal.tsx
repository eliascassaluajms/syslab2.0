import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { httpClient } from '../../services/httpClient';
import { activityService } from '../../services/activity.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FormActividadModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carreras, setCarreras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalización sólida para cualquier estructura que responda la API
  const normalizeList = (res: any): any[] => {
    if (!res) return [];
    let target = res.data !== undefined ? res.data : res;
    if (target?.data !== undefined && !Array.isArray(target)) {
      target = target.data;
    }
    if (Array.isArray(target)) return target;
    if (Array.isArray(target?.carreras)) return target.carreras;
    if (Array.isArray(target?.categorias)) return target.categorias;
    if (Array.isArray(target?.items)) return target.items;
    if (Array.isArray(target?.rows)) return target.rows;
    return [];
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchCarreras = async () => {
      try {
        const res = await httpClient.get('/catalogos/carreras');
        setCarreras(normalizeList(res));
      } catch (e) {
        console.error('Error al cargar carreras:', e);
      }
    };

    const fetchCategorias = async () => {
      try {
        // Intento 1: Ruta habitual
        const res = await httpClient.get('/actividades/categorias');
        setCategorias(normalizeList(res));
      } catch (e) {
        try {
          // Intento 2: Ruta en inglés / alias del router principal
          const resAlt = await httpClient.get('/activities/categorias');
          setCategorias(normalizeList(resAlt));
        } catch (errAlt) {
          console.error('Error al cargar categorías desde ambas rutas:', errAlt);
        }
      }
    };

    fetchCarreras();
    fetchCategorias();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Construcción del payload sanitizado para el Controller
    const payload: Record<string, any> = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
    };

    if (categoriaId) {
      const numCat = Number(categoriaId);
      payload.categoriaId = numCat;
      payload.categoria_id = numCat;
    }

    if (carreraId) {
      const numCar = Number(carreraId);
      payload.carreraId = numCar;
      payload.carrera_id = numCar;
    }

    try {
      await activityService.crear(payload);
      onSuccess();
      onClose();
      // Limpiar formulario tras éxito
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setCarreraId('');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Error al registrar la actividad en la base de datos';
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
            Nueva Actividad Académica
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
              <option value="">Seleccione la carrera...</option>
              {carreras.map((car: any) => {
                const id = car.id || car.carrera_id || car.id_carrera;
                const nombreCarrera = car.nombre || car.nombre_carrera || car.nombreCarrera;
                return (
                  <option key={id} value={id}>
                    {nombreCarrera}
                  </option>
                );
              })}
            </select>
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
              <option value="">Seleccione una categoría (opcional)</option>
              {categorias.map((cat: any) => {
                const id = cat.id || cat.categoria_id || cat.id_categoria || cat.id_categoria_evento;
                const nombreCategoria =
                  cat.nombre ||
                  cat.nombre_categoria ||
                  cat.categoria ||
                  cat.titulo ||
                  cat.descripcion ||
                  cat.name ||
                  cat.label;
                return (
                  <option key={id} value={id}>
                    {nombreCategoria}
                  </option>
                );
              })}
            </select>
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
              {loading ? 'Guardando...' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};