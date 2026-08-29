import React, { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { activityService } from '../services/activity.service';
import { FormActividadModal } from '../components/eventos/FormActividadModal';

export const ActivitiesView: React.FC = () => {
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const cargarActividades = async () => {
    try {
      setLoading(true);
      const data = await activityService.listar();
      setActividades(data);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    cargarActividades();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera de la vista */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Actividades Académicas</h1>
          <p className="text-slate-400 text-sm">Administración y control de eventos y talleres</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Actividad
        </button>
      </div>

      {/* Tabla de Actividades */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400">
              <th className="p-4">Título</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Laboratorio Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  Cargando actividades...
                </td>
              </tr>
            ) : actividades.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No hay actividades registradas actualmente.
                </td>
              </tr>
            ) : (
              actividades.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    {act.nombre || act.titulo}
                  </td>
                  <td className="p-4 text-slate-400">{act.descripcion || 'Sin descripción'}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {act.categoria?.nombre || 'General'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{act.laboratorio?.nombre || 'Por asignar'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación */}
      <FormActividadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={cargarActividades}
      />
    </div>
  );
};

export default ActivitiesView;
