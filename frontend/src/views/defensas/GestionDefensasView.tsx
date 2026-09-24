import React, { useEffect, useMemo, useState } from 'react';
import { defensasService } from '../../services/defensas.service';
import { useCatalogos } from '../../hooks/useCatalogos';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ModalNuevoTrabajo } from '../../components/defensas/ModalNuevoTrabajo';
import { ModalAsignarTribunal } from '../../components/defensas/ModalAsignarTribunal';
import { ModalDetalleTrabajoDefensa } from '../../components/defensas/ModalDetalleTrabajoDefensa';
import { TrabajoGradoResumen } from '../../interfaces/defensa';

const badgeByEstado: Record<string, string> = {
  REGISTRADO: 'bg-slate-500/10 text-slate-200 border-slate-500/30',
  TRIBUNAL_DESIGNADO: 'bg-blue-500/10 text-blue-200 border-blue-500/30',
  CON_OBSERVACIONES: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
  APTO_PARA_DEFENSA: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
  DEFENSA_PROGRAMADA: 'bg-violet-500/10 text-violet-200 border-violet-500/30',
};

const ESTADOS = ['REGISTRADO', 'TRIBUNAL_DESIGNADO', 'CON_OBSERVACIONES', 'APTO_PARA_DEFENSA', 'DEFENSA_PROGRAMADA'];

export const GestionDefensasView: React.FC = () => {
  const { user, tienePermiso } = useAuth();
  const { carreras } = useCatalogos();
  const { mostrarToast } = useToast();
  const [trabajos, setTrabajos] = useState<TrabajoGradoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalTribunalAbierto, setModalTribunalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [trabajoSeleccionadoId, setTrabajoSeleccionadoId] = useState<string | null>(null);

  // Detección de rol Director de Carrera y su carrera asignada
  const esAdmin = useMemo(() => {
    if (!user) return false;
    let nombreRol = '';
    if (typeof user.rol === 'string') {
      nombreRol = user.rol;
    } else if (user.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
      nombreRol = user.rol.nombre;
    }
    return Boolean(user.esGlobal || nombreRol.toLowerCase().includes('admin'));
  }, [user]);

  const esDirector = useMemo(() => {
    if (!user || esAdmin) return false;
    const rolNombre = typeof user.rol === 'string' ? user.rol : user.rol?.nombre || '';
    const rolesArr = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === 'string' ? r : r.nombre))
      : [];
    return rolNombre.includes('Director de Carrera') || rolesArr.some((r) => r.includes('Director de Carrera'));
  }, [user, esAdmin]);

  const carreraDirectorId = useMemo(() => {
    if (!esDirector || !user) return undefined;
    if (user.carreraId) return user.carreraId;
    if (user.carreras && user.carreras.length > 0) return user.carreras[0];
    return undefined;
  }, [esDirector, user]);

  const [gestion, setGestion] = useState<number>(new Date().getFullYear());
  const [estado, setEstado] = useState<string>('');
  const [carreraId, setCarreraId] = useState<number | ''>(() => {
    return carreraDirectorId || '';
  });
  const [soloMios, setSoloMios] = useState(false);

  useEffect(() => {
    if (esDirector && carreraDirectorId) {
      setCarreraId(carreraDirectorId);
    }
  }, [esDirector, carreraDirectorId]);

  const carrerasVisibles = useMemo(() => {
    if (esDirector && carreraDirectorId) {
      return (carreras || []).filter((c) => c.id === carreraDirectorId);
    }
    return carreras || [];
  }, [carreras, esDirector, carreraDirectorId]);

  const anios = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => base - i);
  }, []);

  const cargarTrabajos = async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      const datos = soloMios
        ? await defensasService.listarMisTrabajos()
        : await defensasService.listarTrabajos({
            gestion,
            estado: estado || undefined,
            carreraId: carreraId !== '' ? Number(carreraId) : undefined,
          });
      setTrabajos(datos);
    } catch (error: any) {
      console.error('No se pudieron cargar los trabajos de grado.', error);
      const msg = error?.response?.data?.message || 'No se pudieron cargar los trabajos de grado.';
      mostrarToast(msg, 'error');
      setErrorCarga(msg);
      setTrabajos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTrabajos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestion, estado, carreraId, soloMios]);

  const totalTribunales = useMemo(
    () => trabajos.reduce((total, trabajo) => total + (trabajo.tribunales?.length ?? 0), 0),
    [trabajos]
  );

  const trabajoSeleccionado = useMemo(
    () => trabajos.find((t) => t.id === trabajoSeleccionadoId) || null,
    [trabajos, trabajoSeleccionadoId]
  );

  const abrirDesignacion = (id: string) => {
    setTrabajoSeleccionadoId(id);
    setModalTribunalAbierto(true);
  };

  const abrirDetalle = (id: string) => {
    setTrabajoSeleccionadoId(id);
    setModalDetalleAbierto(true);
  };

  const puedeCrear = tienePermiso('defensas:crear');
  const puedeDesignar = tienePermiso('defensas:designar');
  const puedeEliminar = tienePermiso('defensas:eliminar');

  if (loading && trabajos.length === 0 && !errorCarga) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6 text-sm shadow-xl shadow-slate-950/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="font-medium text-slate-200">Cargando defensas de grado...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      {errorCarga && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span>{errorCarga}</span>
          </div>
          <button
            onClick={cargarTrabajos}
            className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-rose-500"
          >
            Reintentar carga
          </button>
        </div>
      )}
      <div className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-2xl shadow-inner shadow-blue-500/10">🏛️</div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">FIRNT · Facultad de Ingenierías de Recursos Naturales y Tecnologías</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Dirección de Carrera · Defensas de Grado</h1>
              <p className="mt-2 text-sm text-slate-300">
                {esDirector
                  ? 'Gestión académica exclusiva de su carrera, designación de tribunales y titulación de estudiantes.'
                  : 'Gestión académica, designación de tribunales, revisión documental y emisión de actas.'}
              </p>
            </div>
          </div>
          {puedeCrear && (
            <button onClick={() => setModalNuevoAbierto(true)} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500">
              + Nuevo trabajo
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Gestión</span>
          <select value={gestion} onChange={(e) => setGestion(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Carrera {esDirector && carreraDirectorId ? '(Asignada)' : ''}
          </span>
          <select
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value ? Number(e.target.value) : '')}
            disabled={esDirector && !!carreraDirectorId}
            className={`rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 ${
              esDirector && carreraDirectorId ? 'opacity-85 cursor-not-allowed bg-slate-900/90' : ''
            }`}
          >
            {!esDirector && <option value="">Todas</option>}
            {carrerasVisibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
          <input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} className="h-4 w-4 accent-blue-500" />
          Mis trabajos (tribunal asignado)
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Total trabajos · Gestión {gestion}</p>
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 p-2 text-lg">📘</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{trabajos.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tribunales activos</p>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 p-2 text-lg">👥</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totalTribunales}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Aptos para defensa</p>
            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 p-2 text-lg">✅</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{trabajos.filter((t) => t.estado === 'APTO_PARA_DEFENSA').length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-[0.12em]">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Tribunal</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trabajos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay trabajos de grado para los filtros seleccionados.</td>
                </tr>
              ) : (
                trabajos.map((trabajo) => (
                  <tr key={trabajo.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-white">{trabajo.titulo}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span>{trabajo.modalidad || 'Trabajo dirigido'}</span>
                        {trabajo.materia && (
                          <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-200">
                            {trabajo.materia.codigo ? `${trabajo.materia.codigo} · ` : ''}{trabajo.materia.nombre}
                          </span>
                        )}
                        {trabajo.esTribunal ? <span className="text-cyan-400">· 👤 su tribunal</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-white">{trabajo.estudianteNombre}</div>
                      <div className="mt-1 text-xs text-slate-400">{trabajo.estudianteEmail || 'Sin correo'}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-300">{trabajo.carrera?.nombre || 'Sin carrera'}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeByEstado[trabajo.estado] || 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                        {trabajo.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      {trabajo.tribunales && trabajo.tribunales.length > 0
                        ? (
                          <ul className="space-y-1">
                            {trabajo.tribunales.map((t) => (
                              <li key={t.id} className="flex flex-wrap items-center gap-1.5">
                                <span>{t.docente?.nombre} {t.docente?.apellido || ''}</span>
                                {t.preside && <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-200">Preside</span>}
                                {t.esExterno && <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-200">Ext.</span>}
                              </li>
                            ))}
                          </ul>
                        ) : 'Sin designación'}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        {puedeDesignar && (
                          <button onClick={() => abrirDesignacion(trabajo.id)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20">
                            Designar
                          </button>
                        )}
                        <button onClick={() => abrirDetalle(trabajo.id)} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700">
                          Ver
                        </button>
                        {puedeEliminar && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar definitivamente el trabajo "${trabajo.titulo}"?`)) {
                                defensasService.eliminar(trabajo.id)
                                  .then(() => { mostrarToast('Trabajo eliminado.', 'success'); cargarTrabajos(); })
                                  .catch((err: any) => mostrarToast(err?.response?.data?.message || 'No se pudo eliminar.', 'error'));
                              }
                            }}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {soloMios && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          Mostrando únicamente los trabajos donde usted integra el tribunal. Utilice la búsqueda general para ver todos los trabajos de la gestión.
        </div>
      )}

      <ControlMemorandumCard carreraDirectorId={carreraDirectorId} esDirector={esDirector} />

      <ModalNuevoTrabajo
        abierto={modalNuevoAbierto}
        onCerrar={() => setModalNuevoAbierto(false)}
        onCreado={cargarTrabajos}
        carreraFijadaId={carreraDirectorId}
      />

      <ModalAsignarTribunal
        trabajoId={trabajoSeleccionadoId}
        carreraId={
          trabajoSeleccionado?.carreraId ||
          trabajoSeleccionado?.carrera?.id ||
          carreraDirectorId
        }
        abierto={modalTribunalAbierto}
        onCerrar={() => {
          setModalTribunalAbierto(false);
          setTrabajoSeleccionadoId(null);
        }}
        onAsignado={cargarTrabajos}
      />

      <ModalDetalleTrabajoDefensa
        trabajoId={trabajoSeleccionadoId}
        abierto={modalDetalleAbierto}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setTrabajoSeleccionadoId(null);
        }}
        onActualizado={cargarTrabajos}
      />
    </div>
  );
};

const ControlMemorandumCard: React.FC<{ carreraDirectorId?: number; esDirector?: boolean }> = ({
  carreraDirectorId,
  esDirector,
}) => {
  const { tienePermiso } = useAuth();
  const { carreras } = useCatalogos();
  const { mostrarToast } = useToast();
  const gestionActual = new Date().getFullYear();

  const [carreraId, setCarreraId] = useState<number | ''>(() => carreraDirectorId || '');
  const [gestion, setGestion] = useState<number>(gestionActual);
  const [ultimoNumero, setUltimoNumero] = useState<number>(0);
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (esDirector && carreraDirectorId) {
      setCarreraId(carreraDirectorId);
    }
  }, [esDirector, carreraDirectorId]);

  const carrerasVisibles = useMemo(() => {
    if (esDirector && carreraDirectorId) {
      return (carreras || []).filter((c) => c.id === carreraDirectorId);
    }
    return carreras || [];
  }, [carreras, esDirector, carreraDirectorId]);

  const cargarControl = async () => {
    if (carreraId === '') return;
    try {
      const control = await defensasService.obtenerControlMemorandum(Number(carreraId), gestion);
      setUltimoNumero(control?.ultimoNumero ?? 0);
      setCargado(true);
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo obtener el correlativo.', 'error');
    }
  };

  const guardar = async () => {
    if (carreraId === '') return;
    try {
      setGuardando(true);
      await defensasService.actualizarControlMemorandum(Number(carreraId), gestion, ultimoNumero);
      mostrarToast('Correlativo de memorándums actualizado para coordinación con secretaría.', 'success');
      await cargarControl();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo actualizar el correlativo.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!tienePermiso('defensas:designar')) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Correlativo de memorándums</h3>
        <span className="text-xs text-slate-400">Numeración {gestion} · M-{gestion}-NNN</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Carrera {esDirector && carreraDirectorId ? '(Asignada)' : ''}
          </span>
          <select
            value={carreraId}
            onChange={(e) => { setCarreraId(e.target.value ? Number(e.target.value) : ''); setCargado(false); }}
            disabled={esDirector && !!carreraDirectorId}
            className={`rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 ${
              esDirector && carreraDirectorId ? 'opacity-85 cursor-not-allowed bg-slate-900/90' : ''
            }`}
          >
            {!esDirector && <option value="">Seleccione</option>}
            {carrerasVisibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Gestión</span>
          <select value={gestion} onChange={(e) => { setGestion(Number(e.target.value)); setCargado(false); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500">
            {[gestionActual, gestionActual - 1, gestionActual - 2, gestionActual - 3].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <button onClick={cargarControl} disabled={carreraId === ''} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50">
          Consultar
        </button>
        {cargado && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Último número emitido</span>
              <input type="number" min={0} value={ultimoNumero} onChange={(e) => setUltimoNumero(Number(e.target.value))} className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            </label>
            <button onClick={guardar} disabled={guardando} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar correlativo'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GestionDefensasView;