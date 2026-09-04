import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, LockKeyhole, Printer, Search } from 'lucide-react';
import { bitacoraService, SesionActivaResponse, AsistenteItem, ListaConsolidadaResponse } from '../../services/bitacora.service';

interface Props {
  sesion: SesionActivaResponse;
  onSesionFinalizada: () => void;
}

export const SesionActivaView: React.FC<Props> = ({ sesion, onSesionFinalizada }) => {
  const [practicaRealizada, setPracticaRealizada] = useState<string>('');
  const [asistentesCount, setAsistentesCount] = useState<number>(sesion.totalAsistentes || 0);
  const [lista, setLista] = useState<ListaConsolidadaResponse | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmando, setConfirmando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [equipos, setEquipos] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const urlAsistenciaPublica = `${window.location.origin}/asistencia/${sesion.tokenQR}`;

  useEffect(() => {
    let activo = true;

    const cargarLista = async () => {
      try {
        const data = await bitacoraService.obtenerListaConsolidada(sesion.id);
        if (activo) {
          setLista(data);
          setAsistentesCount(data.presentes + data.atrasos);
        }
      } catch (err: unknown) {
        console.error('Error al actualizar la nómina:', err);
      }
    };

    void cargarLista();
    const interval = setInterval(cargarLista, 4000);

    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [sesion.id]);

  const actualizarEstado = async (estudianteId: number, estado: NonNullable<AsistenteItem['estado']>) => {
    if (lista?.listaConfirmada) return;
    const estudianteActual = lista?.estudiantes.find((item) => item.estudiante.id === estudianteId);
    let justificativo = estudianteActual?.justificativo || undefined;
    if (estado === 'LICENCIA') {
      justificativo = window.prompt('Indique el justificativo de la licencia o permiso:', justificativo || '') || undefined;
    }
    try {
      await bitacoraService.actualizarAsistencia(sesion.id, estudianteId, { estado, justificativo });
      const data = await bitacoraService.obtenerListaConsolidada(sesion.id);
      setLista(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la asistencia.');
    }
  };

  const confirmarLista = async () => {
    if (lista?.listaConfirmada || !window.confirm('La lista quedará sellada y ya no podrá modificarse. ¿Confirmar?')) return;
    setConfirmando(true);
    setError(null);
    try {
      setLista(await bitacoraService.confirmarAsistencia(sesion.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar la lista.');
    } finally {
      setConfirmando(false);
    }
  };

  const descargarPlanilla = async () => {
    setDescargando(true);
    try {
      await bitacoraService.descargarPdf(sesion.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la planilla PDF.');
    } finally {
      setDescargando(false);
    }
  };

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
            <QRCodeSVG includeMargin={true} level="H" size={220} value={urlAsistenciaPublica} />
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-2 text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="block text-xs text-slate-400">Marcados</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{asistentesCount}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="block text-xs text-slate-400">Programados</span>
              <span className="text-2xl font-bold text-white font-mono">{lista?.totalInscritos ?? '-'}</span>
            </div>
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

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <span className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 p-2 text-emerald-300">P {lista?.presentes ?? 0}</span>
                <span className="rounded-lg bg-amber-950/60 border border-amber-500/30 p-2 text-amber-300">A {lista?.atrasos ?? 0}</span>
                <span className="rounded-lg bg-sky-950/60 border border-sky-500/30 p-2 text-sky-300">L {lista?.licencias ?? 0}</span>
                <span className="rounded-lg bg-red-950/60 border border-red-500/30 p-2 text-red-300">F {lista?.faltas ?? 0}</span>
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-500" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="max-h-72 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
                {(lista?.estudiantes || []).filter((item) => `${item.estudiante.nombre} ${item.estudiante.apellido} ${item.estudiante.correo}`.toLowerCase().includes(busqueda.toLowerCase())).map((item) => {
                  const nombre = `${item.estudiante.nombre} ${item.estudiante.apellido || ''}`.trim();
                  const estado = item.estado || 'FALTA';
                  return (
                    <div key={item.estudiante.id} className="flex flex-col gap-2 p-2 border-b border-slate-900 last:border-none">
                      <div className="flex justify-between items-center gap-2">
                        <div className="min-w-0"><p className="text-xs text-slate-100 truncate">{nombre}</p><p className="text-[11px] text-slate-500 truncate">{item.estudiante.correo}</p></div>
                        <span className="text-[11px] font-mono text-slate-500">{item.fechaHora ? new Date(item.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      </div>
                      <div className="flex gap-1">
                        {(['PRESENTE', 'ATRASO', 'LICENCIA', 'FALTA'] as const).map((opcion) => (
                          <button key={opcion} type="button" disabled={Boolean(lista?.listaConfirmada)} onClick={() => void actualizarEstado(item.estudiante.id, opcion)} className={`flex-1 rounded-md py-1 text-[11px] font-bold border ${estado === opcion ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-500 hover:text-slate-200'} disabled:opacity-50`}>
                            {opcion[0]}
                          </button>
                        ))}
                      </div>
                      <input
                        value={equipos[item.estudiante.id] ?? item.equipo?.id ?? ''}
                        onChange={(e) => setEquipos((actuales) => ({ ...actuales, [item.estudiante.id]: e.target.value }))}
                        onBlur={() => {
                          const equipoId = Number(equipos[item.estudiante.id]);
                          if (equipoId && !lista?.listaConfirmada) {
                            void bitacoraService.actualizarAsistencia(sesion.id, item.estudiante.id, {
                              estado,
                              justificativo: item.justificativo || undefined,
                              equipoId,
                            }).then(() => bitacoraService.obtenerListaConsolidada(sesion.id)).then(setLista).catch(() => setError('No se pudo asignar el equipo.'));
                          }
                        }}
                        disabled={Boolean(lista?.listaConfirmada)}
                        placeholder="ID de PC / equipo"
                        className="w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      {item.justificativo && <p className="text-[11px] text-sky-300 truncate">{item.justificativo}</p>}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button type="button" onClick={() => void confirmarLista()} disabled={confirmando || Boolean(lista?.listaConfirmada)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-semibold disabled:opacity-50"><Check size={16} />{lista?.listaConfirmada ? 'Lista confirmada' : confirmando ? 'Confirmando...' : 'Confirmar lista oficial'}</button>
                <button type="button" onClick={() => void descargarPlanilla()} disabled={descargando} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-sm font-semibold hover:border-slate-500 disabled:opacity-50"><Printer size={16} />{descargando ? 'Generando...' : 'Imprimir PDF'}</button>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 text-xs text-slate-500"><LockKeyhole size={14} />{lista?.listaConfirmada ? 'Sello inmutable activo' : 'Borrador en vivo'}</span>
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
