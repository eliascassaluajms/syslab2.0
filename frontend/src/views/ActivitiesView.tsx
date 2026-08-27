import { useEffect, useState } from 'react';
import { Activity } from '../interfaces/activity.interface';
import { getActivities } from '../services/activity.service';

export default function ActivitiesView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActivities()
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error de conexión');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[100dvh] bg-slate-950 text-slate-200">
        <p className="animate-pulse text-lg font-medium">Cargando actividades del laboratorio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-950 text-red-400 min-h-[100dvh]">
        <p>Aviso de error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de Actividades Académicas</h1>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-850 text-slate-400 text-sm uppercase">
                <th className="p-4">Título</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Ámbito Carrera</th>
                <th className="p-4">Laboratorio Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {activities.map(act => (
                <tr key={act.id} className="hover:bg-slate-755 transition-colors">
                  <td className="p-4 font-medium">{act.title}</td>
                  <td className="p-4 text-slate-400">{act.description || 'Sin descripción'}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-700 rounded text-xs">{act.careerScope}</span></td>
                  <td className="p-4">{act.lab ? `${act.lab.codigo} - ${act.lab.nombre}` : 'No asignado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
