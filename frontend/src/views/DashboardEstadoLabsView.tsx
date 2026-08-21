import React, { useState, useEffect } from 'react';
import { httpClient as api } from '../services/httpClient';

interface LaboratorioEstado {
  id: number;
  nombre: string;
  codigo?: string;
  ubicacion: string;
  carrera: string;
  estado: 'Available' | 'Occupied';
  actividadActual: string;
}

export const DashboardEstadoLabsView: React.FC = () => {
  const [laboratorios, setLaboratorios] = useState<LaboratorioEstado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDayTime, setCurrentDayTime] = useState<string>('');

  const cargarEstadoLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/laboratorios/estado-actual');
      setLaboratorios(response.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor de laboratorios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadoLabs();

    // Actualizar reloj de la esquina superior derecha
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false };
      setCurrentDayTime(now.toLocaleDateString('en-US', options));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-white">
      {/* Control Panel Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Control Panel</h1>
      </div>

      {/* State of Infrastructure Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
        <span className="text-blue-400 text-xl">ℹ️</span>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-blue-300">State of Infrastructure</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Welcome to the Laboratory Control System of the Faculty of Resource Engineering Natural and Technology (UAJMS - Yacuiba). From here you can manage the environments academics and technical support indications optimally.
          </p>
        </div>
      </div>

      {/* Sub-header / Real-time bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900 border border-gray-800 px-5 py-3.5 rounded-xl gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>State of Environments in Time Real</span>
        </div>
        {currentDayTime && (
          <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-400 font-mono">
            📅 {currentDayTime}
          </div>
        )}
      </div>

      {/* Alerta de Error si falla la API */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm font-medium text-red-400 flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Laboratorios */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {laboratorios.map((lab) => {
            const isAvailable = lab.estado === 'Available';
            return (
              <div 
                key={lab.id} 
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white tracking-wide">{lab.nombre}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      isAvailable 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {lab.estado}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2">
                    <span>{isAvailable ? '✔' : '📌'}</span>
                    <span>{lab.actividadActual}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80 flex justify-between items-center text-[11px] text-gray-500">
                  <span>{lab.ubicacion}</span>
                  <span className="font-mono text-blue-400/80">ID #{lab.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};