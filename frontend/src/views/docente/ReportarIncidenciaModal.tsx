import React, { useEffect, useState } from 'react';
import { X, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import incidenciaService from '../../services/incidencia.service';
import { httpClient } from '../../services/httpClient';
import type {
  CrearIncidenciaPayload,
  IncidenciaItem,
  PrioridadIncidencia,
  TipoIncidencia,
  CategoriaEquipoIncidencia,
} from '../../interfaces/incidencia.interface';
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_PRIORIDAD,
  ETIQUETAS_TIPO,
} from './incidencias.constantes';
import { generarClienteUuid } from '../../utils/uuid';

interface LaboratorioOpcion {
  id: number;
  nombre: string;
  codigo?: string | null;
}

interface EquipoOpcion {
  id: number;
  nombre: string;
  codigoPatrimonial?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReportado?: (incidencia: IncidenciaItem) => void;
}

const CATEGORIAS_SIN_EQ: CategoriaEquipoIncidencia[] = [
  'PROYECTOR',
  'AIRE_ACONDICIONADO',
  'RED_INTERNET',
  'PERIFERICO',
  'SOFTWARE',
  'OTRO',
];

const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_TAMANIO_EVIDENCIA = 10 * 1024 * 1024;

export const ReportarIncidenciaModal: React.FC<Props> = ({ isOpen, onClose, onReportado }) => {
  const [laboratorios, setLaboratorios] = useState<LaboratorioOpcion[]>([]);
  const [equipos, setEquipos] = useState<EquipoOpcion[]>([]);
  const [labId, setLabId] = useState<number | ''>('');
  const [equipoId, setEquipoId] = useState<number | ''>('');
  const [categoria, setCategoria] = useState<CategoriaEquipoIncidencia>('PC');
  const [tipo, setTipo] = useState<TipoIncidencia>('HARDWARE');
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [clienteUuid, setClienteUuid] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IncidenciaItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResultado(null);
    setError(null);
    setEnviando(false);
    setEvidencia(null);
    setClienteUuid(generarClienteUuid());

    (async () => {
      try {
        const resLabs = await httpClient.get('/laboratorios');
        const rawLabs = resLabs.data?.data?.laboratorios || resLabs.data?.data || resLabs.data;
        setLaboratorios(Array.isArray(rawLabs) ? rawLabs : []);
      } catch {
        setLaboratorios([]);
      }

      try {
        const resHorarios = await httpClient.get('/laboratorios/mis-horarios-activos');
        const labsActivos = resHorarios.data?.data?.laboratorios;
        if (Array.isArray(labsActivos) && labsActivos.length > 0) {
          setLabId(labsActivos[0].id);
        }
      } catch {
        // Sin horarios activos detectables; el docente elige manualmente.
      }
    })();
  }, [isOpen]);

  const esEquipoEspecifico = categoria === 'PC';

  useEffect(() => {
    setEquipoId('');
    setEquipos([]);
    if (!labId || !esEquipoEspecifico) return;
    (async () => {
      try {
        const res = await httpClient.get('/equipos', { params: { laboratorioId: labId } });
        const data = res.data?.data;
        const items = Array.isArray(data?.items) ? (data.items as any[]) : [];
        setEquipos(
          items
            .filter((e) => e.estado !== 'DE_BAJA')
            .filter((e) => e.categoria === 'COMPUTO' || e.categoria === undefined)
            .map((e) => ({ id: e.id, nombre: e.nombre, codigoPatrimonial: e.codigoPatrimonial })),
        );
      } catch {
        setEquipos([]);
      }
    })();
  }, [labId, esEquipoEspecifico]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (!labId || !titulo.trim() || !descripcion.trim()) {
      setError('Complete el laboratorio, el título y la descripción.');
      return;
    }
    if (esEquipoEspecifico && !equipoId) {
      setError('Seleccione el equipo afectado o elija una categoría general.');
      return;
    }
    if (evidencia) {
      if (!MIME_PERMITIDOS.has(evidencia.type)) {
        setError('Formato de evidencia no permitido. Use JPG, PNG, WEBP o GIF.');
        return;
      }
      if (evidencia.size > MAX_TAMANIO_EVIDENCIA) {
        setError('La evidencia supera el tamaño máximo de 10 MB.');
        return;
      }
    }

    const payload: CrearIncidenciaPayload = {
      clienteUuid,
      laboratorioId: Number(labId),
      equipoId: esEquipoEspecifico ? Number(equipoId) : null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tipo,
      categoriaEquipo: categoria,
      prioridad,
    };

    setEnviando(true);
    setError(null);
    try {
      const creada = await incidenciaService.crear(payload);
      if (evidencia) {
        try {
          await incidenciaService.subirEvidencia(creada.id, evidencia);
        } catch {
          // La evidencia es opcional; el ticket ya quedó registrado.
        }
      }
      setResultado(creada);
      onReportado?.(creada);
    } catch (err: any) {
      setError(err.message || 'No se pudo reportar la incidencia.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Reportar falla o incidencia
            </h3>
            <p className="text-xs text-slate-400 mt-1">El ticket se canaliza a Jefatura de Laboratorios.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {resultado ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Incidencia registrada</p>
              <p className="text-slate-400 text-sm mt-1">
                Su folio de seguimiento es
              </p>
              <p className="font-mono text-2xl font-black text-emerald-300 tracking-wider mt-2">
                {resultado.folio}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-950/40 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/60 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl">{error}</div>
            )}

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">
                Ubicación / Laboratorio *
              </label>
              <select
                required
                value={labId}
                onChange={(e) => setLabId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
              >
                <option value="">-- Seleccionar laboratorio --</option>
                {laboratorios.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                    {l.codigo ? ` (${l.codigo})` : ''}
                  </option>
                ))}
              </select>
              {labId !== '' && esEquipoEspecifico && equipos.length === 0 && (
                <p className="text-[11px] text-amber-400/80 mt-1">No se encontraron equipos de cómputo en este laboratorio.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Activo afectado</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaEquipoIncidencia)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                >
                  <option value="PC">PC / Equipo específico</option>
                  {CATEGORIAS_SIN_EQ.map((c) => (
                    <option key={c} value={c}>
                      {ETIQUETAS_CATEGORIA[c]}
                    </option>
                  ))}
                </select>
              </div>

              {esEquipoEspecifico ? (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Equipo (PC) *</label>
                  <select
                    required
                    value={equipoId}
                    onChange={(e) => setEquipoId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                  >
                    <option value="">-- Seleccionar equipo --</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.codigoPatrimonial || eq.id} · {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Clasificación</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-500 min-h-[44px] flex items-center">
                    General: sin equipo específico
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Tipo de falla</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoIncidencia)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                >
                  {(Object.keys(ETIQUETAS_TIPO) as TipoIncidencia[]).map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETAS_TIPO[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Prioridad / Impacto</label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as PrioridadIncidencia)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                >
                  {(Object.keys(ETIQUETAS_PRIORIDAD) as PrioridadIncidencia[]).map((p) => (
                    <option key={p} value={p}>
                      {ETIQUETAS_PRIORIDAD[p]} ({p === 'CRITICA' ? 'impide continuar' : p === 'ALTA' ? 'urgente' : 'leve/moderada'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Título del problema *</label>
              <input
                required
                type="text"
                placeholder="Ej.: PC N°12 no enciende / Proyector sin señal"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Descripción detallada *</label>
              <textarea
                required
                rows={3}
                placeholder="Describa el fallo: qué observó, cuándo ocurrió y si interrumpe la clase (ej.: impide iniciar la práctica)."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Evidencia (captura) *</label>
              <label className="flex items-center gap-3 border border-dashed border-slate-700 rounded-xl p-3 cursor-pointer hover:border-slate-500 transition-colors min-h-[44px]">
                <Camera size={18} className="text-slate-400" />
                <span className={`text-sm ${evidencia ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {evidencia ? evidencia.name : 'Adjuntar captura o foto del error'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const archivo = e.target.files?.[0] ?? null;
                    if (archivo) {
                      if (!MIME_PERMITIDOS.has(archivo.type)) {
                        setError('Formato de evidencia no permitido. Use JPG, PNG, WEBP o GIF.');
                        setEvidencia(null);
                        e.target.value = '';
                        return;
                      }
                      if (archivo.size > MAX_TAMANIO_EVIDENCIA) {
                        setError('La evidencia supera el tamaño máximo de 10 MB.');
                        setEvidencia(null);
                        e.target.value = '';
                        return;
                      }
                      setError(null);
                    }
                    setEvidencia(archivo);
                  }}
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-1">JPG, PNG, WEBP o GIF · máx. 10 MB (opcional).</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-950/40 flex items-center gap-2 cursor-pointer"
              >
                {enviando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Enviando…
                  </>
                ) : (
                  'Enviar reporte'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};