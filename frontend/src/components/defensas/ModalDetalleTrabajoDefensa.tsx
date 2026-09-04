import React, { useEffect, useState } from 'react';
import { defensasService } from '../../services/defensas.service';
import { useToast } from '../../context/ToastContext';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ModalDetalleTrabajoDefensaProps {
  trabajoId: string | null;
  abierto: boolean;
  onCerrar: () => void;
  onActualizado: () => void;
}

interface TrabajoDetalle {
  id: string;
  titulo: string;
  modalidad?: string;
  gradoOptado?: string;
  estado: string;
  estudianteNombre: string;
  estudianteCi?: string;
  estudianteRu?: string;
  estudianteEmail?: string;
  tribunales?: Array<{
    id: string;
    rol: string;
    docente?: {
      id: number;
      nombre: string;
      apellido?: string;
      correo?: string;
    };
    estadoRevision?: string;
    cartaConformidadUrl?: string | null;
  }>;
  versionesDocumento?: Array<{
    id: string;
    numeroVersion: number;
    archivoUrl?: string;
    descripcionCambios?: string;
  }>;
  observaciones?: Array<{
    id: string;
    detalleObservacion: string;
    designacion?: {
      rol: string;
    };
  }>;
}

export const ModalDetalleTrabajoDefensa: React.FC<ModalDetalleTrabajoDefensaProps> = ({ trabajoId, abierto, onCerrar, onActualizado }) => {
  const { mostrarToast } = useToast();
  const [trabajo, setTrabajo] = useState<TrabajoDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [versionUrl, setVersionUrl] = useState('');
  const [descripcionVersion, setDescripcionVersion] = useState('');

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
    }
  }, [abierto, trabajoId]);

  const registrarObservacion = async (designacionId: string) => {
    if (!trabajoId || !designacionId) return;
    const detalle = window.prompt('Escriba la observación del tribunal para este trabajo:');
    if (!detalle || !detalle.trim()) return;

    try {
      setEnviando(true);
      await defensasService.registrarObservacion(trabajoId, designacionId, detalle.trim());
      mostrarToast('Observación registrada.', 'success');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo registrar la observación.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const emitirConformidad = async (designacionId: string) => {
    if (!trabajoId || !designacionId) return;
    const urlPdf = window.prompt('Ingrese la URL del PDF de conformidad:', 'https://');
    if (!urlPdf || !urlPdf.trim()) return;

    try {
      setEnviando(true);
      await defensasService.emitirConformidad(trabajoId, designacionId, urlPdf.trim());
      mostrarToast('Conformidad emitida.', 'success');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo emitir la conformidad.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const generarActa = async () => {
    if (!trabajoId) return;
    try {
      setEnviando(true);
      await defensasService.generarActa(trabajoId);
      mostrarToast('Acta generada correctamente.', 'success');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo generar el acta.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const descargarPdf = async (ruta: string, nombreArchivo: string) => {
    try {
      const token = localStorage.getItem('syslab_token');
      const respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo descargar el documento PDF.');
      }

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
    if (!trabajoId || !versionUrl.trim()) {
      mostrarToast('Debe indicar la URL del documento.', 'error');
      return;
    }

    try {
      setEnviando(true);
      await defensasService.registrarVersion(trabajoId, versionUrl.trim(), descripcionVersion.trim() || undefined);
      mostrarToast('Versión del documento registrada.', 'success');
      setVersionUrl('');
      setDescripcionVersion('');
      await cargarDetalle();
      onActualizado();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo guardar la versión.', 'error');
    } finally {
      setEnviando(false);
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-violet-300">Ficha académica</p>
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
                  <button onClick={() => descargarPdf(`/defensas/trabajos/${trabajoId}/acta-pdf`, `acta-${trabajoId}.pdf`)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20">
                    Ver acta PDF
                  </button>
                  <button onClick={generarActa} disabled={enviando} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60">
                    {enviando ? 'Procesando...' : 'Generar acta'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {trabajo.tribunales?.length ? (
                  trabajo.tribunales.map((tribunal) => (
                    <div key={tribunal.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{tribunal.rol}</div>
                          <div className="text-sm text-slate-300">{tribunal.docente ? `${tribunal.docente.nombre} ${tribunal.docente.apellido || ''}` : 'Sin docente asignado'}</div>
                          <div className="text-xs text-slate-400">{tribunal.docente?.correo || 'Sin correo'}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => registrarObservacion(tribunal.id)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20">Observación</button>
                          <button onClick={() => emitirConformidad(tribunal.id)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20">Conformidad</button>
                          <button onClick={() => descargarPdf(`/defensas/trabajos/${trabajoId}/memorandums/${tribunal.id}/pdf`, `memorandum-${tribunal.id}.pdf`)} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20">Memorándum PDF</button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Estado: {tribunal.estadoRevision || 'PENDIENTE'}</span>
                        <span>{tribunal.cartaConformidadUrl ? 'PDF cargado' : 'Sin PDF'}</span>
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
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">URL del documento</label>
                    <input value={versionUrl} onChange={(e) => setVersionUrl(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="https://.../archivo.pdf" />
                    <label className="mt-2 mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Descripción</label>
                    <textarea value={descripcionVersion} onChange={(e) => setDescripcionVersion(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500" rows={2} placeholder="Describa cambios, entregables o correcciones." />
                    <button onClick={registrarVersionDocumento} disabled={enviando} className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                      {enviando ? 'Guardando...' : 'Guardar versión'}
                    </button>
                  </div>

                  {trabajo.versionesDocumento?.length ? (
                    trabajo.versionesDocumento.map((version) => (
                      <div key={version.id} className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-sm text-slate-300">
                        <div className="font-medium text-white">Versión {version.numeroVersion}</div>
                        <div className="text-xs text-slate-400">{version.descripcionCambios || 'Sin descripción'}</div>
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
                <div className="mt-3 space-y-2">
                  {trabajo.observaciones?.length ? (
                    trabajo.observaciones.map((obs) => (
                      <div key={obs.id} className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-sm text-slate-300">
                        <div className="font-medium text-white">{obs.designacion?.rol || 'Tribunal'}</div>
                        <div className="mt-1 text-xs text-slate-400">{obs.detalleObservacion}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No existen observaciones registradas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
