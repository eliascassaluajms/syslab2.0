import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RotateCw, FileWarning } from 'lucide-react';
import incidenciaService from '../../services/incidencia.service';
import type { IncidenciaItem, IncidenciaConteos, EstadoIncidencia } from '../../interfaces/incidencia.interface';
import { ReportarIncidenciaModal } from './ReportarIncidenciaModal';
import { DetalleIncidenciaSheet } from './DetalleIncidenciaSheet';
import {
  ETIQUETAS_ESTADO,
  ESTILOS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ESTILOS_PRIORIDAD,
} from './incidencias.constantes';

type FiltroEstado = '' | EstadoIncidencia;

const FILTROS: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'EN_REVISION', etiqueta: 'En revisión' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'RESUELTO', etiqueta: 'Resueltos' },
  { valor: 'DESCARTADO', etiqueta: 'Descartados' },
];

export const MisIncidenciasView: React.FC = () => {
  const [incidencias, setIncidencias] = useState<IncidenciaItem[]>([]);
  const [conteos, setConteos] = useState<IncidenciaConteos>({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltas: 0,
    descartadas: 0,
  });
  const [filtro, setFiltro] = useState<FiltroEstado>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalReportar, setModalReportar] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await incidenciaService.listarMisReportes(filtro || undefined);
      setIncidencias(res.incidencias || []);
      setConteos(res.conteos || { total: 0, pendientes: 0, enProceso: 0, resueltas: 0, descartadas: 0 });
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar sus reportes.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="p-6 max-w-5xl mx-auto text-white space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-semibold">Docente</p>
          <h1 className="text-2xl font-bold mt-1">Mis incidencias y fallas</h1>
          <p className="text-xs text-slate-400 mt-1">Consulte el estado de los reportes que realizó en laboratorios.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalReportar(true)}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all shadow-lg shadow-red-950/40 flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Plus size={16} />
            Reportar falla
          </button>
          <button
            onClick={cargarDatos}
            aria-label="Actualizar"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl text-slate-200 transition-colors flex items-center justify-center w-[44px] cursor-pointer"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl">{error}</div>}

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{conteos.total}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-2xl">
          <p className="text-xs text-amber-400 uppercase font-semibold">Abiertas</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{conteos.pendientes}</p>
        </div>
        <div className="bg-slate-900 border border-blue-500/20 p-4 rounded-2xl">
          <p className="text-xs text-blue-400 uppercase font-semibold">En proceso</p>
          <p className="text-2xl font-bold font-mono text-blue-300 mt-1">{conteos.enProceso}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-xs text-emerald-400 uppercase font-semibold">Resueltas</p>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{conteos.resueltas}</p>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors cursor-pointer min-h-[36px] ${
              filtro === f.valor
                ? 'bg-red-500/15 text-red-300 border-red-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {/* Listado */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Cargando sus reportes...</div>
      ) : incidencias.length === 0 ? (
        <div className="py-14 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <FileWarning size={22} className="text-slate-500" />
          </div>
          <p className="text-sm">No tiene reportes {filtro ? 'con este estado' : 'registrados'}.</p>
          <p className="text-xs text-slate-500">Si detecta una falla en un laboratorio, repórtela para canalizarla.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidencias.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetalleId(item.id)}
              className="w-full text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-300">{item.folio}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${ESTILOS_ESTADO[item.estado]}`}>
                      {ETIQUETAS_ESTADO[item.estado]}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${ESTILOS_PRIORIDAD[item.prioridad]}`}>
                      {ETIQUETAS_PRIORIDAD[item.prioridad]}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1.5 truncate">{item.titulo}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.descripcion}</p>
                </div>
                <span className="text-slate-500 text-sm shrink-0">
                  {new Date(item.fechaReporte).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <span className="truncate">{item.laboratorio?.nombre}</span>
                {item.fechaResolucion && (
                  <span className="text-emerald-400/80 shrink-0">Solucionado</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <ReportarIncidenciaModal
        isOpen={modalReportar}
        onClose={() => setModalReportar(false)}
        onReportado={() => void cargarDatos()}
      />

      <DetalleIncidenciaSheet
        alcance="docente"
        incidenciaId={detalleId}
        onClose={() => setDetalleId(null)}
        onCambio={() => void cargarDatos()}
      />
    </div>
  );
};

export default MisIncidenciasView;