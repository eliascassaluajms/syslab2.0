import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { bitacoraService, SesionActivaResponse, AsistenteItem } from '../../services/bitacora.service';

interface Props {
  sesion: SesionActivaResponse;
  onSesionFinalizada: () => void;
}

export const SesionActivaView: React.FC<Props> = ({ sesion, onSesionFinalizada }) => {
  const [practicaRealizada, setPracticaRealizada] = useState<string>('');
  const [asistentesCount, setAsistentesCount] = useState<number>(sesion.totalAsistentes || 0);
  const [listaAsistentes, setListaAsistentes] = useState<AsistenteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const urlAsistencia = `${window.location.origin}/asistencia/${sesion.tokenQR}`;

  useEffect(() => {
    let activo = true;

    const cargarAsistentes = async () => {
      try {
        const data = await bitacoraService.obtenerAsistentesSesion(sesion.id);
        if (activo) {
          setAsistentesCount(data.total || (data.asistentes ? data.asistentes.length : 0));
          setListaAsistentes(data.asistentes || []);
        }
      } catch (err: unknown) {
        console.error('Error al actualizar asistentes:', err);
      }
    };

    void cargarAsistentes();
    const interval = setInterval(cargarAsistentes, 4000);

    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [sesion.id]);

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practicaRealizada.trim()) {
      setError('Por favor, redacte una breve descripción de la práctica realizada.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bitacoraService.finalizarSesion(sesion.id, practicaRealizada.trim(), true);
      onSesionFinalizada();
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al finalizar la sesión de bitácora.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white max-w-6xl mx-auto my-6 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            ● Sesión de Laboratorio en Curso
          </span>
          <h1 className="text-2xl font-bold mt-2">{sesion.laboratorio?.nombre || 'Laboratorio'}</h1>
          <p className="text-sm text-slate-400">
            Materia: <span className="text-slate-200 font-medium">{sesion.materia?.nombre || 'Clase Extraordinaria'}</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-xs text-slate-400">Hora de Apertura</p>
          <p className="text-lg font-mono text-emerald-400">{sesion.horaInicio}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-300 mb-4">
            Escanee el código QR para registrar su asistencia
          </p>

          <div className="bg-white p-4 rounded-2xl shadow-lg border-4 border-emerald-500/20 mb-4">
            <QRCodeSVG includeMargin={true} level="H" size={220} value={urlAsistencia} />
          </div>

          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">Estudiantes Registrados:</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono animate-pulse">
              {asistentesCount}
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <form onSubmit={handleFinalizar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Práctica / Contenido Desarrollado en la Sesión *
              </label>
              <textarea
                rows={5}
                value={practicaRealizada}
                onChange={(e) => setPracticaRealizada(e.target.value)}
                placeholder="Escriba los experimentos, temas avanzados o tareas ejecutadas en el laboratorio..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Últimos Asistentes Confirmados
              </h3>
              <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
                {listaAsistentes.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2 text-center">Aún no hay registros de asistencia.</p>
                ) : (
                  listaAsistentes.map((a: AsistenteItem, idx: number) => {
                    const nombre = a.estudiante
                      ? `${a.estudiante.nombre} ${a.estudiante.apellido || ''}`.trim()
                      : a.nombreCompleto || 'Estudiante';
                    const horaStr = a.fechaHora
                      ? new Date(a.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 border-b border-slate-900 last:border-none">
                        <span className="text-slate-200">{nombre}</span>
                        <span className="text-slate-500 font-mono">{horaStr}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Finalizando...' : 'Finalizar y Guardar Bitácora'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
