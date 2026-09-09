import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { solicitudesExtraordinariasService } from '../services/solicitudesExtraordinarias.service';
import {
  SolicitudExtraordinaria,
  EstadoSolicitud,
} from '../interfaces/solicitudExtraordinaria.interface';
import { ModalSolicitudExtraordinaria } from '../components/horarios/ModalSolicitudExtraordinaria';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Building2,
  User,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

export const SolicitudesExtraordinariasView: React.FC = () => {
  const { tienePermiso, user } = useAuth();
  const { mostrarToast } = useToast();

  const [solicitudes, setSolicitudes] = useState<SolicitudExtraordinaria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState<boolean>(false);

  // Estado para modal de acción (Aprobar / Rechazar)
  const [solicitudAccion, setSolicitudAccion] = useState<{
    solicitud: SolicitudExtraordinaria;
    accion: EstadoSolicitud.APROBADO | EstadoSolicitud.RECHAZADO;
  } | null>(null);
  const [observacionesAccion, setObservacionesAccion] = useState<string>('');
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);

  // Determinar roles del usuario autenticado
  const rolesSet = useMemo(() => {
    const set = new Set<string>();
    if (typeof user?.rol === 'string') set.add(user.rol);
    else if (user?.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
      set.add((user.rol as any).nombre);
    }
    if (Array.isArray(user?.roles)) {
      user.roles.forEach((r: string) => set.add(r));
    }
    return set;
  }, [user]);

  const esAdmin = Boolean(
    user?.esGlobal ||
      rolesSet.has('Administrador') ||
      rolesSet.has('SuperAdmin')
  );

  const puedeCrear = useMemo(() => {
    if (esAdmin) return true;
    if (tienePermiso('solicitudes:crear') || tienePermiso('solicitudes_extraordinarias:crear')) return true;
    return ['Jefe de Laboratorios', 'Director de Carrera', 'Docente'].some((r) => rolesSet.has(r));
  }, [esAdmin, tienePermiso, rolesSet]);

  const puedeAprobar = useMemo(() => {
    if (esAdmin) return true;
    if (tienePermiso('solicitudes:aprobar') || tienePermiso('solicitudes_extraordinarias:aprobar')) return true;
    return ['Jefe de Laboratorios', 'Director de Carrera', 'Decano', 'Vicedecano'].some((r) =>
      rolesSet.has(r)
    );
  }, [esAdmin, tienePermiso, rolesSet]);

  const esDirectorOJefe = rolesSet.has('Director de Carrera') || rolesSet.has('Jefe de Laboratorios');

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const estadoParam =
        filtroEstado === 'TODAS' ? undefined : (filtroEstado as EstadoSolicitud);
      const data = await solicitudesExtraordinariasService.listar(estadoParam);
      setSolicitudes(data);
    } catch (err: any) {
      const mensaje =
        err.response?.data?.message || 'Error al obtener el listado de solicitudes extraordinarias.';
      mostrarToast(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, mostrarToast]);

  useEffect(() => {
    void cargarSolicitudes();
  }, [cargarSolicitudes]);

  const handleConfirmarAccion = async () => {
    if (!solicitudAccion) return;
    setProcesandoAccion(true);
    try {
      await solicitudesExtraordinariasService.cambiarEstado(
        solicitudAccion.solicitud.id,
        solicitudAccion.accion,
        observacionesAccion.trim() || undefined
      );

      const accionTexto =
        solicitudAccion.accion === EstadoSolicitud.APROBADO ? 'aprobada' : 'rechazada';
      mostrarToast(`Solicitud #${solicitudAccion.solicitud.id} ${accionTexto} exitosamente.`, 'success');
      setSolicitudAccion(null);
      setObservacionesAccion('');
      await cargarSolicitudes();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || 'Error al actualizar el estado de la solicitud.';
      mostrarToast(mensaje, 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const termino = busqueda.toLowerCase().trim();
      if (!termino) return true;

      const coincideMateria = s.materia?.toLowerCase().includes(termino);
      const coincideLab = s.laboratorio?.nombre?.toLowerCase().includes(termino);
      const coincideDocente =
        `${s.docente?.nombre || ''} ${s.docente?.apellido || ''}`.toLowerCase().includes(termino) ||
        s.nombreAyudante?.toLowerCase().includes(termino);
      const coincideMotivo = s.motivo?.toLowerCase().includes(termino);

      return coincideMateria || coincideLab || coincideDocente || coincideMotivo;
    });
  }, [solicitudes, busqueda]);

  const conteos = useMemo(() => {
    return {
      todas: solicitudes.length,
      pendientes: solicitudes.filter((s) => s.estado === EstadoSolicitud.PENDIENTE).length,
      aprobadas: solicitudes.filter((s) => s.estado === EstadoSolicitud.APROBADO).length,
      rechazadas: solicitudes.filter((s) => s.estado === EstadoSolicitud.RECHAZADO).length,
    };
  }, [solicitudes]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-slate-100">
      {/* Encabezado Principal */}
      <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" />
              Gestión de Laboratorios
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Solicitudes Extraordinarias
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administración y autorización de reservas especiales y horarios extraordinarios de laboratorios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void cargarSolicitudes()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {puedeCrear && (
            <button
              type="button"
              onClick={() => setModalNuevaAbierto(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Solicitud</span>
            </button>
          )}
        </div>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Pestañas de Estado */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setFiltroEstado('TODAS')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === 'TODAS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Todas</span>
            <span className="rounded-full bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-300">
              {conteos.todas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado(EstadoSolicitud.PENDIENTE)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === EstadoSolicitud.PENDIENTE
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Pendientes</span>
            <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-[10px] text-amber-300">
              {conteos.pendientes}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado(EstadoSolicitud.APROBADO)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === EstadoSolicitud.APROBADO
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Aprobadas</span>
            <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] text-emerald-300">
              {conteos.aprobadas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado(EstadoSolicitud.RECHAZADO)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === EstadoSolicitud.RECHAZADO
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Rechazadas</span>
            <span className="rounded-full bg-rose-950/60 px-2 py-0.5 text-[10px] text-rose-300">
              {conteos.rechazadas}
            </span>
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por materia, lab o docente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contenido Principal: Tarjetas de Solicitudes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-3" />
          <p className="text-sm font-medium">Cargando solicitudes extraordinarias...</p>
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 py-16 text-center text-slate-400">
          <Clock className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No hay solicitudes para mostrar</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {busqueda
              ? 'No se encontraron solicitudes que coincidan con los términos de búsqueda ingresados.'
              : 'No existen solicitudes extraordinarias registradas con el filtro seleccionado.'}
          </p>
          {puedeCrear && (
            <button
              type="button"
              onClick={() => setModalNuevaAbierto(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear primera solicitud
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {solicitudesFiltradas.map((sol) => {
            const esPendiente = sol.estado === EstadoSolicitud.PENDIENTE;
            const esAprobada = sol.estado === EstadoSolicitud.APROBADO;
            const esRechazada = sol.estado === EstadoSolicitud.RECHAZADO;

            return (
              <div
                key={sol.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{sol.id}
                        </span>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {sol.materia}
                        </h3>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <Building2 className="h-3.5 w-3.5 text-blue-400" />
                        <span className="font-medium text-slate-300">
                          {sol.laboratorio?.nombre || `Laboratorio ID ${sol.laboratorioId}`}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Estado */}
                    <div>
                      {esPendiente && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 shadow-sm">
                          <Clock className="h-3 w-3 animate-pulse" />
                          Pendiente
                        </span>
                      )}
                      {esAprobada && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobada
                        </span>
                      )}
                      {esRechazada && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 shadow-sm">
                          <XCircle className="h-3 w-3" />
                          Rechazada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Fecha y Horario */}
                    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-sky-400" />
                        <span>Fecha y Horario</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {sol.fecha}
                      </p>
                      <p className="font-mono text-slate-300">
                        {sol.horaInicio} - {sol.horaFin}
                      </p>
                    </div>

                    {/* Solicitante / Docente */}
                    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <User className="h-3.5 w-3.5 text-purple-400" />
                        <span>Solicitante</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white truncate">
                        {sol.docente
                          ? `${sol.docente.nombre} ${sol.docente.apellido || ''}`.trim()
                          : sol.solicitadoPorDirector
                          ? 'Dirección de Carrera'
                          : 'Docente no especificado'}
                      </p>
                      {sol.nombreAyudante && (
                        <p className="text-slate-400 truncate">
                          Ayudante: <span className="text-slate-200">{sol.nombreAyudante}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="mt-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3 text-xs">
                    <p className="text-slate-400 font-medium flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                      <span>Motivo de la reserva:</span>
                    </p>
                    <p className="mt-1 text-slate-300 italic leading-relaxed">
                      "{sol.motivo || 'Sin motivo especificado'}"
                    </p>
                  </div>
                </div>

                {/* Pie de Tarjeta / Botones de Acción */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Registrada el {sol.createdAt ? new Date(sol.createdAt).toLocaleDateString() : 'N/D'}
                  </span>

                  {esPendiente && puedeAprobar && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitudAccion({
                            solicitud: sol,
                            accion: EstadoSolicitud.RECHAZADO,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Rechazar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSolicitudAccion({
                            solicitud: sol,
                            accion: EstadoSolicitud.APROBADO,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Aprobar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Solicitud Extraordinaria (Creación) */}
      <ModalSolicitudExtraordinaria
        isOpen={modalNuevaAbierto}
        onClose={() => setModalNuevaAbierto(false)}
        onSuccess={() => {
          mostrarToast('Solicitud extraordinaria creada con éxito.', 'success');
          void cargarSolicitudes();
        }}
        esDirectorOJefe={esDirectorOJefe}
      />

      {/* Modal de Confirmación de Acción (Aprobar / Rechazar) */}
      {solicitudAccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3">
              {solicitudAccion.accion === EstadoSolicitud.APROBADO ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <XCircle className="h-5 w-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {solicitudAccion.accion === EstadoSolicitud.APROBADO
                    ? 'Aprobar Solicitud'
                    : 'Rechazar Solicitud'}
                </h3>
                <p className="text-xs text-slate-400">
                  Solicitud #{solicitudAccion.solicitud.id} · {solicitudAccion.solicitud.materia}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-1">
                <p>
                  <span className="text-slate-400">Laboratorio:</span>{' '}
                  <span className="font-semibold text-white">
                    {solicitudAccion.solicitud.laboratorio?.nombre ||
                      solicitudAccion.solicitud.laboratorioId}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Fecha y Hora:</span>{' '}
                  <span className="font-semibold text-white">
                    {solicitudAccion.solicitud.fecha} ({solicitudAccion.solicitud.horaInicio} -{' '}
                    {solicitudAccion.solicitud.horaFin})
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span>Observaciones institucionales (opcional):</span>
                </label>
                <textarea
                  rows={3}
                  value={observacionesAccion}
                  onChange={(e) => setObservacionesAccion(e.target.value)}
                  placeholder="Ingrese detalles o motivo de la decisión..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={procesandoAccion}
                onClick={() => {
                  setSolicitudAccion(null);
                  setObservacionesAccion('');
                }}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={procesandoAccion}
                onClick={() => void handleConfirmarAccion()}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 ${
                  solicitudAccion.accion === EstadoSolicitud.APROBADO
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30'
                }`}
              >
                {procesandoAccion && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {solicitudAccion.accion === EstadoSolicitud.APROBADO
                    ? 'Confirmar Aprobación'
                    : 'Confirmar Rechazo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
