import React, { useEffect, useState } from 'react';
import { httpClient } from '../../services/httpClient';
import { bitacoraService } from '../../services/bitacora.service';

interface SesionBitacoraItem {
  id: number;
  laboratorioId: number;
  materiaNombre?: string;
  nombreAyudante?: string;
  tipoUso: string;
  practicaRealizada?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  cumplio: boolean;
  laboratorio?: { nombre: string; codigo?: string };
  materia?: { nombre: string; codigo?: string };
  docente?: { nombre: string; apellido?: string };
  _count?: { asistencias: number };
}

export const HistorialBitacorasView: React.FC = () => {
  const [sesiones, setSesiones] = useState<SesionBitacoraItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const cargarBitacoras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/bitacora');
      const data = response.data?.data?.sesiones || response.data?.data || response.data;
      setSesiones(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const responseError = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(responseError || 'Error al obtener el historial de bitácoras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarBitacoras();
  }, []);

  const handleDescargarPdf = async (id: number) => {
    setDescargandoId(id);
    try {
      await bitacoraService.descargarPdf(id, `Planilla_Bitacora_Sesion_${id}.pdf`);
    } catch (err: unknown) {
      alert('Error al descargar la planilla PDF de la sesión.');
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Laboratorios</p>
          <h1 className="text-2xl font-bold">Historial de Bitácoras de Uso</h1>
        </div>
        <button
          onClick={cargarBitacoras}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-slate-200 transition-colors cursor-pointer"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Cargando registros de bitácora...</p>
        </div>
      ) : sesiones.length === 0 ? (
        <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
          <p className="text-sm">No se encontraron sesiones registradas en la bitácora.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Fecha / Horario</th>
                  <th className="py-3.5 px-4">Laboratorio</th>
                  <th className="py-3.5 px-4">Materia / Práctica</th>
                  <th className="py-3.5 px-4">Encargado</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sesiones.map((s) => {
                  const fechaStr = s.fecha ? new Date(s.fecha).toLocaleDateString() : 'N/A';
                  const nombreLab = s.laboratorio?.nombre || 'Laboratorio';
                  const materiaStr = s.materiaNombre || s.materia?.nombre || 'Uso General';
                  const encargadoStr = s.docente
                    ? `${s.docente.nombre} ${s.docente.apellido || ''}`.trim()
                    : s.nombreAyudante || 'Encargado';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-emerald-400 font-semibold">{fechaStr}</div>
                        <div className="text-slate-400 text-xs">{s.horaInicio} - {s.horaFin || 'En curso'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{nombreLab}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-100">{materiaStr}</div>
                        {s.practicaRealizada && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{s.practicaRealizada}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{encargadoStr}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          s.tipoUso === 'EXTRAORDINARIO'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {s.tipoUso}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDescargarPdf(s.id)}
                          disabled={descargandoId === s.id}
                          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Descargar Planilla Oficial PDF"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{descargandoId === s.id ? 'Descargando...' : 'Planilla PDF'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
