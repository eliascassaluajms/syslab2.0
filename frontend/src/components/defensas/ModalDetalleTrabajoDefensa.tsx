import React, { useEffect, useState } from 'react';
import { defensasService } from '../../services/defensas.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ObservacionTribunal, TrabajoGradoResumen, TribunalDesignacion } from '../../interfaces/defensa';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ModalDetalleTrabajoDefensaProps {
  trabajoId: string | null;
  abierto: boolean;
  onCerrar: () => void;
  onActualizado: () => void;
}

interface FormObservacion {
  designacionId: string;
  detalle: string;
  esExtraordinaria: boolean;
  archivo: File | null;
}

const formVacio: FormObservacion = {
  designacionId: '',
  detalle: '',
  esExtraordinaria: false,
  archivo: null,
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const ModalDetalleTrabajoDefensa: React.FC<ModalDetalleTrabajoDefensaProps> = ({ trabajoId, abierto, onCerrar, onActualizado }) => {
  const { mostrarToast } = useToast();
  const { tienePermiso } = useAuth();
  const [trabajo, setTrabajo] = useState<TrabajoGradoResumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [versionArchivo, setVersionArchivo] = useState<File | null>(null);
  const [descripcionVersion, setDescripcionVersion] = useState('');
  const [formObservacion, setFormObservacion] = useState<FormObservacion>(formVacio);
  const [observandoDesignacion, setObservandoDesignacion] = useState<string | null>(null);
  const [editingFechaLimite, setEditingFechaLimite] = useState<string | null>(null);
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviandoActa, setEnviandoActa] = useState(false);

  const puedeDesignar = tienePermiso('defensas:designar');
  const puedeObservar = tienePermiso('defensas:observar');
  const puedeCrearVersiones = tienePermiso('defensas:crear');

  const cargarDetalle = async () => {
    if (!trabajoId) return;
    try {
      setCargando(true);
      const detalle = await defensasService.obtenerPorId(trabajoId);
      setTrabajo(detalle);
    } catch (error: any) {
      console.error('No se pudo cargar el detalle del trabajo.', error);
      mostrarToast(error?.response?.data?.message || 'No se pudo cargar el detalle del trabajo.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (abierto) {
      cargarDetalle();
    } else {
      setTrabajo(null);
      setFormObservacion(formVacio);
      setObservandoDesignacion(null);
      setEditingFechaLimite(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, trabajoId]);

  const descargarPdf = async (ruta: string, nombreArchivo: string) => {
    try {
      const token = localStorage.getItem('syslab_token');
      const respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!respuesta.ok) throw new Error('No se pudo descargar el documento PDF.');
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const ventana = window.open(url, '_blank');
      if (!ventana) {
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.click();
      }
    } catch (error: any) {
      mostrarToast(error?.message || 'No se pudo descargar el PDF.', 'error');
    }
  };

  const registrarVersionDocumento = async () => {
    if (!trabajoId || !versionArchivo) {
      mostrarToast('Debe adjuntar el documento (PDF) de la nueva versión.', 'error');
      return;
    }
    try {
      setEnviando(true);
      await defensasService.registrarVersion(trabajoId, {
        archivo: versionArchivo,
        descripcionCambios: descripcionVersion.trim() || undefined,
      });
      mostrarToast('Versión del documento registrada.', 'success');
      setVersionArchivo(null);
      setDescripcionVersion('');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo guardar la versión.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const abrirObservacion = (tribunal: TribunalDesignacion) => {
    const extraordinarias = trabajo?.observaciones?.filter((o) => o.designacion?.id === tribunal.id && o.esExtraordinaria) || [];
    const tieneOrdinarias = trabajo?.observaciones?.some((o) => o.designacion?.id === tribunal.id) || false;
    if (extraordinarias.length > 0) {
      mostrarToast('Este tribunal ya realizó la ronda extraordinaria de observaciones.', 'error');
      return;
    }
    setObservandoDesignacion(tribunal.id);
    setFormObservacion({ ...formVacio, designacionId: tribunal.id, detalle: '', esExtraordinaria: tieneOrdinarias });
  };

  const registrarObservacion = async () => {
    if (!trabajoId || !formObservacion.designacionId) return;
    if (!formObservacion.detalle.trim() && !formObservacion.archivo) {
      mostrarToast('Escriba la observación o adjunte el archivo de correcciones.', 'error');
      return;
    }
    try {
      setEnviando(true);
      await defensasService.registrarObservacion(trabajoId, {
        designacionId: formObservacion.designacionId,
        detalleObservacion: formObservacion.detalle.trim() || undefined,
        archivo: formObservacion.archivo,
        esExtraordinaria: formObservacion.esExtraordinaria,
      });
      mostrarToast(formObservacion.esExtraordinaria ? 'Ronda extraordinaria de observaciones registrada.' : 'Observación registrada.', 'success');
      setObservandoDesignacion(null);
      setFormObservacion(formVacio);
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo registrar la observación.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const emitirConformidad = async (tribunal: TribunalDesignacion) => {
    if (!trabajoId) return;
    if (tribunal.estadoRevision === 'CONFORME') return;
    const ok = window.confirm(
      `Confirmar conformidad del tribunal "${tribunal.docente?.nombre} ${tribunal.docente?.apellido || ''}"?\n\nEl sistema generará automáticamente la carta de conformidad dirigida al Decano.`
    );
    if (!ok) return;
    try {
      setEnviando(true);
      await defensasService.emitirConformidad(trabajoId, tribunal.id);
      mostrarToast('Conformidad emitida y carta generada.', 'success');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo emitir la conformidad.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const guardarFechaLimite = async (tribunal: TribunalDesignacion) => {
    if (!trabajoId || !nuevaFechaLimite) return;
    try {
      setEnviando(true);
      await defensasService.actualizarFechaLimite(trabajoId, tribunal.id, nuevaFechaLimite);
      mostrarToast('Fecha límite de observaciones actualizada.', 'success');
      setEditingFechaLimite(null);
      setNuevaFechaLimite('');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo actualizar la fecha límite.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const generarActa = async () => {
    if (!trabajoId) return;
    try {
      setEnviandoActa(true);
      await defensasService.generarActa(trabajoId);
      mostrarToast('Acta de defensa generada y trabajo marcado para programación.', 'success');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo generar el acta.', 'error');
    } finally {
      setEnviandoActa(false);
    }
  };

  if (!abierto || !trabajoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-violet-950/30 to-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-lg">📚</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-violet-300">Gestión académica · {trabajo?.gestion || '—'}</p>
              <h2 className="mt-1 text-xl font-bold text-white">Trabajo de grado</h2>
            </div>
          </div>
          <button onClick={onCerrar} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">✕</button>
        </div>

        {cargando || !trabajo ? (
          <div className="p-8 text-sm text-slate-300">Cargando detalle del trabajo...</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Título</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{trabajo.titulo}</h3>
                <p className="mt-2 text-sm text-slate-300">{trabajo.modalidad || 'Trabajo dirigido'} · {trabajo.gradoOptado || 'Sin grado registrado'}</p>
                <p className="mt-2 text-xs text-slate-400">{trabajo.carrera?.nombre || 'Sin carrera'}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Estudiante</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{trabajo.estudianteNombre}</h3>
                <p className="mt-2 text-sm text-slate-300">CI: {trabajo.estudianteCi || 'Sin CI'} · RU: {trabajo.estudianteRu || 'Sin RU'}</p>
                <p className="text-sm text-slate-400">{trabajo.estudianteEmail || 'Sin correo institucional'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Tribunal y revisión</h4>
                <div className="flex flex-wrap gap-2">
                  {trabajo.estado === 'APTO_PARA_DEFENSA' && (
                    <button onClick={() => descargarPdf(defensasService.actaPdfUrl(trabajoId), `acta-defensa-${trabajoId}.pdf`)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20">
                      Ver acta PDF
                    </button>
                  )}
                  {puedeDesignar && trabajo.estado === 'APTO_PARA_DEFENSA' && (
                    <button onClick={generarActa} disabled={enviandoActa} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60">
                      {enviandoActa ? 'Generando...' : 'Generar acta'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {trabajo.tribunales?.length ? (
                  trabajo.tribunales.map((tribunal) => (
                    <div key={tribunal.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {tribunal.docente ? `${tribunal.docente.nombre} ${tribunal.docente.apellido || ''}` : 'Sin docente asignado'}
                            </span>
                            <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">{tribunal.rol}</span>
                            {tribunal.preside && <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">Preside</span>}
                            {tribunal.esExterno && <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">Externo</span>}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">{tribunal.docente?.correo || 'Sin correo'}</div>
                          <div className="mt-2 grid gap-1 text-xs text-slate-400">
                            <span>Memorándum: <b className="text-slate-200">{tribunal.numeroMemorandum || '—'}</b> · Emitido el {formatearFecha(tribunal.fechaEmisionMemo)}</span>
                            <span>
                              Plazo para observaciones: <b className="text-slate-200">{formatearFecha(tribunal.fechaLimiteObservaciones)}</b>
                              {puedeDesignar && editingFechaLimite !== tribunal.id && (
                                <button onClick={() => { setEditingFechaLimite(tribunal.id); setNuevaFechaLimite((tribunal.fechaLimiteObservaciones || '').slice(0, 10)); }} className="ml-2 rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800">Ajustar</button>
                              )}
                            </span>
                            {editingFechaLimite === tribunal.id && (
                              <span className="flex flex-wrap items-center gap-2 pt-1">
                                <input type="date" value={nuevaFechaLimite} onChange={(e) => setNuevaFechaLimite(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-violet-500" />
                                <button onClick={() => guardarFechaLimite(tribunal)} disabled={enviando} className="rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-500">Guardar</button>
                                <button onClick={() => setEditingFechaLimite(null)} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800">Cancelar</button>
                              </span>
                            )}
                            <span className="pt-1">
                              Estado: <b className={tribunal.estadoRevision === 'CONFORME' ? 'text-emerald-300' : tribunal.estadoRevision === 'OBSERVADO' ? 'text-amber-300' : 'text-slate-300'}>{tribunal.estadoRevision || 'PENDIENTE'}</b>
                              {tribunal.fechaConformidad && <span> · desde {formatearFecha(tribunal.fechaConformidad)}</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {puedeObservar && tribunal.estadoRevision !== 'CONFORME' && (
                            <button onClick={() => abrirObservacion(tribunal)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20">Observación</button>
                          )}
                          {puedeObservar && (
                            <button onClick={() => emitirConformidad(tribunal)} disabled={enviando} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60">
                              {tribunal.estadoRevision === 'CONFORME' ? 'Conforme ✓' : 'Conformidad'}
                            </button>
                          )}
                          {tribunal.cartaConformidadUrl && (
                            <button onClick={() => window.open(tribunal.cartaConformidadUrl as string, '_blank')} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20">Carta PDF</button>
                          )}
                          {puedeDesignar && (
                            <button onClick={() => descargarPdf(defensasService.memorandumPdfUrl(trabajoId, tribunal.id), `memorandum-${tribunal.id}.pdf`)} className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">Memorándum</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Aún no hay tribunal designado para este trabajo.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Versiones del documento</h4>
                {puedeCrearVersiones && (
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Nueva versión (PDF)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setVersionArchivo(e.target.files?.[0] || null)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-2.5 file:py-1 file:text-xs file:text-white" />
                    <label className="mt-2 mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Descripción</label>
                    <textarea value={descripcionVersion} onChange={(e) => setDescripcionVersion(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500" rows={2} placeholder="Describa cambios, entregables o correcciones." />
                    <button onClick={registrarVersionDocumento} disabled={enviando} className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                      {enviando ? 'Guardando...' : 'Subir nueva versión'}
                    </button>
                  </div>
                )}

                <div className="mt-3 space-y-3">
                  {trabajo.versionesDocumento?.length ? (
                    trabajo.versionesDocumento.map((version) => (
                      <div key={version.id} className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-sm text-slate-300">
                        <div className="font-medium text-white">Versión {version.numeroVersion}</div>
                        <div className="text-xs text-slate-400">{version.descripcionCambios || 'Sin descripción'} · {formatearFecha(version.fechaSubida)}</div>
                        {version.archivoUrl && <a href={version.archivoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-400 underline">Abrir archivo</a>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Todavía no se han subido versiones.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Observaciones</h4>
                {observandoDesignacion && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                      {formObservacion.esExtraordinaria ? 'Ronda extraordinaria de observaciones' : 'Nueva observación'}
                    </p>
                    <label className="mt-2 mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Detalle</label>
                    <textarea value={formObservacion.detalle} onChange={(e) => setFormObservacion((f) => ({ ...f, detalle: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-amber-500" rows={3} placeholder="Describa la observación del tribunal..." />
                    <label className="mt-2 mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Archivo de correcciones (opcional)</label>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => setFormObservacion((f) => ({ ...f, archivo: e.target.files?.[0] || null }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-2.5 file:py-1 file:text-xs file:text-white" />
                    <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" checked={formObservacion.esExtraordinaria} onChange={(e) => setFormObservacion((f) => ({ ...f, esExtraordinaria: e.target.checked }))} className="h-4 w-4 accent-amber-500" />
                      Ronda extraordinaria (solo una, requiere observación ordinaria previa)
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={registrarObservacion} disabled={enviando} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60">
                        {enviando ? 'Guardando...' : 'Registrar observación'}
                      </button>
                      <button onClick={() => { setObservandoDesignacion(null); setFormObservacion(formVacio); }} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Cancelar</button>
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {trabajo.observaciones?.length ? (
                    trabajo.observaciones.map((obs) => (
                      <div key={obs.id} className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-sm text-slate-300">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-white">
                            {obs.designacion?.docente ? `${obs.designacion.docente.nombre} ${obs.designacion.docente.apellido || ''}` : `Tribunal ${obs.numeroRevision}`}
                          </span>
                          {obs.esExtraordinaria && <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-200">Extraordinaria</span>}
                          <span className="text-[10px] uppercase text-slate-500">Rev. {obs.numeroRevision}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{obs.detalleObservacion}</div>
                        {obs.archivoCorreccionesUrl && (
                          <a href={obs.archivoCorreccionesUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">Ver archivo adjunto</a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No existen observaciones registradas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
              <b className="text-slate-200">Acta de defensa:</b>{' '}
              {trabajo.actaDefensa ? (
                <>Código <b className="text-slate-200">{trabajo.actaDefensa.codigoActa}</b> · generada el {formatearFecha(trabajo.actaDefensa.fechaGeneracion)}</>
              ) : trabajo.estado === 'APTO_PARA_DEFENSA' ? (
                'El trabajo está apto. Genere el acta para habilitar la programación de la defensa.'
              ) : (
                'El acta estará disponible cuando ambos tribunales emitan su conformidad y el trabajo pase a APTO_PARA_DEFENSA.'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};