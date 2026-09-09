import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { httpClient } from '../../services/httpClient';

interface DatosSesionPublica {
  sesionId: number;
  laboratorio: string;
  materia: string;
  docente: string;
  fecha: string;
}

export const RegistroAsistenciaPublicaView: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [sesion, setSesion] = useState<DatosSesionPublica | null>(null);
  const [registroUniversitario, setRegistroUniversitario] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registradoExitoso, setRegistradoExitoso] = useState(false);
  const [horaRegistro, setHoraRegistro] = useState<string>('');
  const [estudianteInfo, setEstudianteInfo] = useState<{ nombreCompleto: string } | null>(null);

  useEffect(() => {
    const inicializarVista = async () => {
      if (!token) {
        setError('Token de código QR no proporcionado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Validar token y obtener info de la sesión de laboratorio
        const resSesion = await httpClient.get(`/bitacora/sesion/${token}`);
        const dataSesion = resSesion.data?.data || resSesion.data;
        setSesion({
          sesionId: dataSesion.id || dataSesion.sesionId,
          laboratorio: dataSesion.laboratorio?.nombre || dataSesion.laboratorio || 'Laboratorio',
          materia: dataSesion.materiaNombre || dataSesion.materia?.nombre || 'Clase / Uso de Laboratorio',
          docente: dataSesion.docente
            ? `${dataSesion.docente.nombre} ${dataSesion.docente.apellido || ''}`.trim()
            : dataSesion.nombreAyudante || dataSesion.docente || 'Docente / Encargado',
          fecha: dataSesion.fecha || new Date().toLocaleDateString(),
        });
      } catch (err: unknown) {
        const responseError = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
        setError(responseError || 'El código QR ha expirado, no es válido o la clase ha finalizado.');
      } finally {
        setLoading(false);
      }
    };

    void inicializarVista();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registroUniversitario.trim()) {
      setError('Por favor, introduzca su Registro Universitario (RU).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await httpClient.post('/asistencia/registrar', {
        tokenQR: token,
        registroUniversitario: registroUniversitario.trim(),
      });

      setRegistradoExitoso(true);
      const resData = response.data?.data || response.data;
      setHoraRegistro(resData.horaRegistro || new Date().toLocaleTimeString());
      if (resData.estudiante) {
        setEstudianteInfo(resData.estudiante);
      }
    } catch (err: unknown) {
      const responseError = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(responseError || 'No se pudo registrar la asistencia. Verifique si su RU está inscrito en la materia o si ya marcó.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Validando sesión de laboratorio...</p>
        </div>
      </div>
    );
  }

  if (error && !sesion) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/80 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-2xl text-red-400">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white">Acceso No Válido</h2>
          <p className="text-sm text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (registradoExitoso) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-3xl text-emerald-400">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white">¡Asistencia Registrada!</h2>
          {estudianteInfo && (
            <p className="text-sm font-medium text-emerald-300">
              {estudianteInfo.nombreCompleto}
            </p>
          )}
          <p className="text-sm text-slate-300">
            Se ha confirmado su presencia en la sesión de <span className="text-emerald-400 font-semibold">{sesion?.materia}</span>.
          </p>
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs text-slate-400 font-mono">
            Hora de Registro: {horaRegistro}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            Registro de Asistencia
          </span>
          <h1 className="text-xl font-bold mt-2 text-white">{sesion?.laboratorio}</h1>
          <p className="text-sm text-slate-300 font-medium">{sesion?.materia}</p>
          <p className="text-xs text-slate-400 mt-1">Docente / Encargado: {sesion?.docente}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ingrese su Registro Universitario (RU) *
            </label>
            <input
              type="text"
              value={registroUniversitario}
              onChange={(e) => setRegistroUniversitario(e.target.value)}
              placeholder="Ej. 135497 o similar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Debe estar programado en la materia para el periodo actual.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !registroUniversitario.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm cursor-pointer"
          >
            {submitting ? 'Verificando e inscribiendo...' : 'Confirmar Asistencia'}
          </button>
        </form>
      </div>
    </div>
  );
};
