import React, { useEffect, useState, useCallback } from 'react';
import { incidenciaService } from '../../services/incidencia.service';
import { httpClient } from '../../services/httpClient';
import { IncidenciaItem, IncidenciaConteos } from '../../interfaces/incidencia.interface';
import { ModalReportarIncidencia } from '../../components/incidencias/ModalReportarIncidencia';
import { ModalGestionIncidencia } from '../../components/incidencias/ModalGestionIncidencia';
import { Can } from '../../components/common/Can';

export const IncidenciasView: React.FC = () => {
  const [incidencias, setIncidencias] = useState<IncidenciaItem[]>([]);
  const [conteos, setConteos] = useState<IncidenciaConteos>({ total: 0, pendientes: 0, enProceso: 0, resueltas: 0 });
  const [laboratorios, setLaboratorios] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('');
  const [filtroLabId, setFiltroLabId] = useState<number | ''>('');

  // Modales
  const [modalReportar, setModalReportar] = useState<boolean>(false);
  const [modalGestion, setModalGestion] = useState<boolean>(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<IncidenciaItem | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resInc, resLabs] = await Promise.all([
        incidenciaService.listar({
          estado: filtroEstado || undefined,
          prioridad: filtroPrioridad || undefined,
          laboratorioId: filtroLabId || undefined,
        }),
        httpClient.get('/laboratorios'),
      ]);

      setIncidencias(resInc.incidencias || []);
      setConteos(resInc.conteos || { total: 0, pendientes: 0, enProceso: 0, resueltas: 0 });
      const rawLabs = resLabs.data?.data?.laboratorios || resLabs.data?.data || resLabs.data;
      setLaboratorios(Array.isArray(rawLabs) ? rawLabs : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener incidencias.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroPrioridad, filtroLabId]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-semibold">Soporte y Mantenimiento</p>
          <h1 className="text-2xl font-bold mt-1">Gestión de Incidencias y Fallas</h1>
          <p className="text-xs text-slate-400 mt-1">Canalización de reportes de hardware, redes y ambientes físicos.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalReportar(true)}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-950/40 flex items-center gap-2 cursor-pointer"
          >
            <span>⚠️</span>
            <span>Reportar Incidencia</span>
          </button>
          <button
            onClick={cargarDatos}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 transition-colors cursor-pointer"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl">{error}</div>}

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Reportadas</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{conteos.total}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-2xl">
          <p className="text-xs text-amber-400 uppercase font-semibold">Pendientes</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{conteos.pendientes}</p>
        </div>
        <div className="bg-slate-900 border border-blue-500/20 p-4 rounded-2xl">
          <p className="text-xs text-blue-400 uppercase font-semibold">En Proceso</p>
          <p className="text-2xl font-bold font-mono text-blue-300 mt-1">{conteos.enProceso}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-xs text-emerald-400 uppercase font-semibold">Resueltas</p>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{conteos.resueltas}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todos los Estados --</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Laboratorio</label>
          <select
            value={filtroLabId}
            onChange={(e) => setFiltroLabId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todos los Ambientes --</option>
            {laboratorios.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Prioridad</label>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todas las Prioridades --</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>
      </div>

      {/* Tabla de Incidencias */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Cargando reportes de incidencias...</div>
      ) : incidencias.length === 0 ? (
        <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
          No hay incidencias reportadas con los filtros seleccionados.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Laboratorio</th>
                <th className="py-3.5 px-4">Problema</th>
                <th className="py-3.5 px-4">Reportado Por</th>
                <th className="py-3.5 px-4">Prioridad</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {incidencias.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                    {new Date(item.fechaReporte).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{item.laboratorio?.nombre}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{item.titulo}</div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">{item.descripcion}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">
                    {item.solicitante?.nombre} {item.solicitante?.apellido || ''}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.prioridad === 'CRITICA' || item.prioridad === 'ALTA'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.prioridad}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      item.estado === 'RESUELTO'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : item.estado === 'EN_PROCESO'
                        ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Can permiso="fallas:editar">
                      <button
                        onClick={() => {
                          setIncidenciaSeleccionada(item);
                          setModalGestion(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 transition-colors cursor-pointer"
                      >
                        ⚙️ Atender
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ModalReportarIncidencia
        isOpen={modalReportar}
        onClose={() => setModalReportar(false)}
        onGuardar={async (data) => {
          await incidenciaService.crear(data);
          void cargarDatos();
        }}
        laboratorios={laboratorios}
      />

      <ModalGestionIncidencia
        isOpen={modalGestion}
        onClose={() => {
          setModalGestion(false);
          setIncidenciaSeleccionada(null);
        }}
        incidencia={incidenciaSeleccionada}
        onGuardar={async (id, data) => {
          await incidenciaService.gestionar(id, data);
          void cargarDatos();
        }}
      />
    </div>
  );
};

export default IncidenciasView;
