import React, { useEffect, useState } from 'react';
import { X, Loader2, Send, ChevronDown, ChevronRight, Bot, User } from 'lucide-react';
import incidenciaService from '../../services/incidencia.service';
import type { IncidenciaDetalle, IncidenciaNota } from '../../interfaces/incidencia.interface';
import {
  ETIQUETAS_ESTADO,
  ESTILOS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ESTILOS_PRIORIDAD,
  ETIQUETAS_CATEGORIA,
  ORDEN_ESTADOS,
} from './incidencias.constantes';

interface Props {
  alcance: 'docente' | 'admin';
  incidenciaId: number | null;
  onClose: () => void;
  onCambio?: (detalle: IncidenciaDetalle) => void;
}

export const DetalleIncidenciaSheet: React.FC<Props> = ({ alcance, incidenciaId, onClose, onCambio }) => {
  const [detalle, setDetalle] = useState<IncidenciaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [notasAbiertas, setNotasAbiertas] = useState(true);

  useEffect(() => {
    if (!incidenciaId) return;
    setLoading(true);
    setError(null);
    incidenciaService
      .obtenerPorId(incidenciaId)
      .then((det) => {
        setDetalle(det);
        setNota('');
        setNotasAbiertas(det.notas.length <= 3);
      })
      .catch((err: any) => setError(err.message || 'No se pudo cargar la incidencia.'))
      .finally(() => setLoading(false));
  }, [incidenciaId]);

  if (!incidenciaId) return null;

  const estadoIndex = detalle ? ORDEN_ESTADOS.indexOf(detalle.estado) : -1;

  const enviarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoNota) return;
    if (!nota.trim() || !detalle) return;
    setEnviandoNota(true);
    try {
      await incidenciaService.agregarNota(detalle.id, nota.trim());
      const conNota = await incidenciaService.obtenerPorId(detalle.id);
      setDetalle(conNota);
      setNota('');
      onCambio?.(conNota);
    } catch (err: any) {
      setError(err.message || 'No se pudo agregar la nota.');
    } finally {
      setEnviandoNota(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <button aria-label="Cerrar panel" className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="animate-spin mr-2" size={18} />
            Cargando detalle...
          </div>
        ) : error ? (
          <div className="p-6 text-red-300 text-sm">{error}</div>
        ) : detalle ? (
          <div className="space-y-5 p-5">
            {/* Encabezado */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-emerald-300 tracking-wider">{detalle.folio}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ESTILOS_ESTADO[detalle.estado]}`}>
                    {ETIQUETAS_ESTADO[detalle.estado]}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{detalle.titulo}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {detalle.laboratorio?.nombre} · {ETIQUETAS_CATEGORIA[detalle.categoriaEquipo] || detalle.categoriaEquipo}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Prioridad y fechas */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ESTILOS_PRIORIDAD[detalle.prioridad]}`}>
                Prioridad {ETIQUETAS_PRIORIDAD[detalle.prioridad]}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">
                Reportado {new Date(detalle.fechaReporte).toLocaleString()}
              </span>
              {detalle.fechaResolucion && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-700 text-emerald-300">
                  Resuelto {new Date(detalle.fechaResolucion).toLocaleString()}
                </span>
              )}
            </div>

            {/* Stepper de 4 pasos */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-[11px] uppercase font-semibold text-slate-400 mb-3">Progreso</p>
              <ol className="space-y-0">
                {ORDEN_ESTADOS.map((paso, idx) => {
                  const completado = detalle.estado === 'RESUELTO'
                    ? idx <= estadoIndex
                    : idx <= estadoIndex && detalle.estado !== 'DESCARTADO';
                  const activo = idx === estadoIndex;
                  return (
                    <li key={paso} className="flex gap-3">
                      {/* Columna del conector */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border shrink-0 ${
                            completado
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                              : activo
                              ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        {idx < ORDEN_ESTADOS.length - 1 && (
                          <span className={`w-px h-6 ${completado ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                        )}
                      </div>
                      {/* Texto del paso */}
                      <div className="pb-5 -mt-1">
                        <p className={`text-xs font-bold ${completado ? 'text-emerald-300' : activo ? 'text-blue-300' : 'text-slate-500'}`}>
                          {ETIQUETAS_ESTADO[paso]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {detalle.estado === 'DESCARTADO' && (
                <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                  Esta incidencia fue descartada por el personal técnico.
                </p>
              )}
            </div>

            {detalle.tecnicoAsignado && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Bot size={14} className="text-blue-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {detalle.tecnicoAsignado.nombre} {detalle.tecnicoAsignado.apellido || ''}
                  </p>
                  <p className="text-[11px] text-slate-400">Técnico asignado</p>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-[11px] uppercase font-semibold text-slate-400 mb-2">Descripción del reporte</p>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{detalle.descripcion}</p>
            </div>

            {/* Evidencia */}
            {detalle.evidenciaUrl && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <p className="text-[11px] uppercase font-semibold text-slate-400 mb-2">Evidencia adjunta</p>
                <img
                  src={detalle.evidenciaUrl}
                  alt="Evidencia"
                  className="rounded-xl w-full border border-slate-800 object-cover max-h-64"
                />
              </div>
            )}

            {/* Solución */}
            {detalle.solucion && (
              <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-2xl p-4">
                <p className="text-[11px] uppercase font-semibold text-emerald-400 mb-2">Solución aplicada</p>
                <p className="text-sm text-emerald-200 leading-relaxed whitespace-pre-wrap">{detalle.solucion}</p>
              </div>
            )}

            {/* Notas */}
            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => setNotasAbiertas((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-bold text-white cursor-pointer pb-2"
                aria-expanded={notasAbiertas}
              >
                <span>Historial y notas ({detalle.notas.length})</span>
                {notasAbiertas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {notasAbiertas && (
                <div className="space-y-3 mt-2">
                  {detalle.notas.length === 0 && (
                    <p className="text-xs text-slate-500">Aún no hay notas registradas.</p>
                  )}
                  {detalle.notas.map((n: IncidenciaNota) => (
                    <div key={n.id} className="flex gap-2.5">
                      <span
                        className={`p-1.5 rounded-lg shrink-0 h-fit ${
                          n.esSistema
                            ? 'bg-violet-500/10 border border-violet-500/30'
                            : 'bg-slate-800 border border-slate-700'
                        }`}
                      >
                        {n.esSistema ? <Bot size={14} className="text-violet-300" /> : <User size={14} className="text-slate-300" />}
                      </span>
                      <div
                        className={`flex-1 rounded-xl px-3 py-2 ${
                          n.esSistema ? 'bg-violet-950/30 border border-violet-500/20' : 'bg-slate-950 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {n.esSistema ? 'Sistema' : n.autor ? `${n.autor.nombre} ${n.autor.apellido || ''}` : 'Docente'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.fecha).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{n.mensaje}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {alcance === 'docente' && (
                <form onSubmit={enviarNota} className="flex items-end gap-2 mt-4">
                  <label className="sr-only" htmlFor="nueva-nota">Nueva nota</label>
                  <textarea
                    id="nueva-nota"
                    rows={3}
                    placeholder="Añadir una nota de seguimiento..."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={enviandoNota || !nota.trim()}
                    aria-label="Enviar nota"
                    className="p-3 h-[44px] w-[44px] flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    {enviandoNota ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};