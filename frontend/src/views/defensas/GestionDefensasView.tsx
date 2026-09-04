import React, { useEffect, useMemo, useState } from 'react';
import { httpClient } from '../../services/httpClient';
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

export const GestionDefensasView: React.FC = () => {
  const [trabajos, setTrabajos] = useState<TrabajoGradoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalTribunalAbierto, setModalTribunalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [trabajoSeleccionadoId, setTrabajoSeleccionadoId] = useState<string | null>(null);

  const cargarTrabajos = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/defensas');
      const datos = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      setTrabajos(datos);
    } catch (error) {
      console.error('No se pudieron cargar los trabajos de grado.', error);
      setTrabajos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTrabajos();
  }, []);

  const totalTribunales = useMemo(
    () => trabajos.reduce((total, trabajo) => total + (trabajo.tribunales?.length ?? 0), 0),
    [trabajos]
  );

  const abrirDesignacion = (id: string) => {
    setTrabajoSeleccionadoId(id);
    setModalTribunalAbierto(true);
  };

  const abrirDetalle = (id: string) => {
    setTrabajoSeleccionadoId(id);
    setModalDetalleAbierto(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm shadow-lg shadow-slate-950/30">Cargando defensas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      <div className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-2xl shadow-inner shadow-blue-500/10">🏛️</div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">FIRNT · Facultad de Ingenierías de Recursos Naturales y Tecnologías</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Dirección de Carrera · Defensas de Grado</h1>
              <p className="mt-2 text-sm text-slate-300">Gestión académica, designación de tribunales, revisión documental y emisión de actas.</p>
            </div>
          </div>
          <button onClick={() => setModalNuevoAbierto(true)} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500">
            + Nuevo trabajo
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Total trabajos</p>
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
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay trabajos de grado registrados aún.</td>
                </tr>
              ) : (
                trabajos.map((trabajo) => (
                  <tr key={trabajo.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-white">{trabajo.titulo}</div>
                      <div className="mt-1 text-xs text-slate-400">{trabajo.modalidad || 'Trabajo dirigido'}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-white">{trabajo.estudianteNombre}</div>
                      <div className="mt-1 text-xs text-slate-400">{trabajo.estudianteEmail || 'Sin correo'}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-300">{trabajo.carrera?.nombre || 'Sin carrera'}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeByEstado[trabajo.estado] || 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                        {trabajo.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-300">
                      {trabajo.tribunales && trabajo.tribunales.length > 0
                        ? trabajo.tribunales.map((t) => `${t.rol}: ${t.docente?.nombre || 'Sin docente'}`).join(' • ')
                        : 'Sin designación'}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => abrirDesignacion(trabajo.id)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20">
                          Designar
                        </button>
                        <button onClick={() => abrirDetalle(trabajo.id)} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700">
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalNuevoTrabajo
        abierto={modalNuevoAbierto}
        onCerrar={() => setModalNuevoAbierto(false)}
        onCreado={cargarTrabajos}
      />

      <ModalAsignarTribunal
        trabajoId={trabajoSeleccionadoId}
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
