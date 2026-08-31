import React, { useEffect, useState } from 'react';
import { httpClient } from '../../services/httpClient';
import { bitacoraService, SesionActivaResponse } from '../../services/bitacora.service';
import { Can } from '../../components/common/Can';
import { SesionActivaView } from './SesionActivaView';

interface SesionBitacoraItem {
  id: number;
  laboratorioId: number;
  materiaNombre?: string;
  nombreAyudante?: string;
  tipoUso: string;
  practicaRealizada?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  cumplio: boolean;
  laboratorio?: { id: number; nombre: string; codigo?: string };
  materia?: { id: number; nombre: string; codigo?: string };
  docente?: { id: number; nombre: string; apellido?: string };
  _count?: { asistencias: number };
}

interface LaboratorioOption {
  id: number;
  nombre: string;
}

interface MateriaOption {
  id: number;
  nombre: string;
}

export const HistorialBitacorasView: React.FC = () => {
  const [sesiones, setSesiones] = useState<SesionBitacoraItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  // Estado para proyección de clase activa con QR
  const [sesionActiva, setSesionActiva] = useState<SesionActivaResponse | null>(null);

  // Estados de Filtros
  const [filtroLaboratorioId, setFiltroLaboratorioId] = useState<number | ''>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');

  // Estados del Modal de Apertura de Sesión
  const [modalApertura, setModalApertura] = useState<boolean>(false);
  const [laboratorios, setLaboratorios] = useState<LaboratorioOption[]>([]);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);
  const [nuevoLabId, setNuevoLabId] = useState<number | ''>('');
  const [nuevaMateriaId, setNuevaMateriaId] = useState<number | ''>('');
  const [nuevoTipoUso, setNuevoTipoUso] = useState<'REGULAR' | 'EXTRAORDINARIO'>('REGULAR');
  const [iniciando, setIniciando] = useState<boolean>(false);

  // Cargar lista de laboratorios al montar para alimentar el filtro
  useEffect(() => {
    httpClient.get('/laboratorios')
      .then((res) => {
        const rawLabs = res.data?.data?.laboratorios ?? res.data?.data ?? res.data;
        setLaboratorios(Array.isArray(rawLabs) ? rawLabs : []);
      })
      .catch(() => {});
  }, []);

  // 1. Cargar historial con filtros aplicados
  const cargarBitacoras = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (filtroLaboratorioId) params.laboratorioId = filtroLaboratorioId;
      if (filtroFecha) params.fecha = filtroFecha;

      const response = await httpClient.get('/bitacora', { params });
      const data = response.data?.data?.sesiones || response.data?.data || response.data;
      setSesiones(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const responseError =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(responseError || 'Error al obtener el historial de bitácoras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarBitacoras();
  }, [filtroLaboratorioId, filtroFecha]);

  // 2. Abrir Modal de Nueva Sesión y cargar catálogos
  const handleAbrirModalInicio = async () => {
    try {
      const [resLabs, resMats] = await Promise.all([
        httpClient.get('/laboratorios'),
        httpClient.get('/materias'),
      ]);

      // Extracción segura para laboratorios
      const rawLabs = resLabs.data?.data?.laboratorios ?? resLabs.data?.data ?? resLabs.data;
      setLaboratorios(Array.isArray(rawLabs) ? rawLabs : []);

      // Extracción segura para materias (soporta arreglo plano o payload { materias: [...] })
      const rawMats = resMats.data?.data?.materias ?? resMats.data?.data ?? resMats.data;
      setMaterias(Array.isArray(rawMats) ? rawMats : []);

      setModalApertura(true);
    } catch {
      setError('No se pudieron cargar los catálogos para iniciar la clase.');
    }
  };

  // 3. Confirmar inicio de sesión en backend (Genera QR)
  const handleIniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoLabId) return;

    setIniciando(true);
    setError(null);

    try {
      const nuevaSesion = await bitacoraService.iniciarSesion({
        laboratorioId: Number(nuevoLabId),
        materiaId: nuevaMateriaId ? Number(nuevaMateriaId) : undefined,
        tipoUso: nuevoTipoUso,
      });

      setModalApertura(false);
      setNuevoLabId('');
      setNuevaMateriaId('');
      // Despliega la pantalla de proyección QR en tiempo real
      setSesionActiva(nuevaSesion);
    } catch (err: unknown) {
      const responseError =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(responseError || 'Error al iniciar la sesión de bitácora.');
    } finally {
      setIniciando(false);
    }
  };

  // 4. Descargar Planilla Oficial en PDF
  const handleDescargarPdf = async (id: number) => {
    setDescargandoId(id);
    try {
      await bitacoraService.descargarPdf(id, `Planilla_Bitacora_Sesion_${id}.pdf`);
    } catch {
      alert('Error al descargar la planilla PDF de la sesión.');
    } finally {
      setDescargandoId(null);
    }
  };

  // Filtrado local adicional por tipo de uso
  const sesionesFiltradas = sesiones.filter((s) => {
    if (filtroTipo && s.tipoUso !== filtroTipo) return false;
    return true;
  });

  // Si hay una sesión activa, renderizar el panel de proyección QR
  if (sesionActiva) {
    return (
      <SesionActivaView
        onSesionFinalizada={() => {
          setSesionActiva(null);
          void cargarBitacoras();
        }}
        sesion={sesionActiva}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Laboratorios</p>
          <h1 className="text-2xl font-bold mt-1">Historial de Bitácoras de Uso</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico de ocupación, asistencias de estudiantes y respaldo oficial en PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Can permiso="bitacora:iniciar">
            <button
              onClick={handleAbrirModalInicio}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-2"
            >
              <span>🚀</span>
              <span>Iniciar Uso de Laboratorio</span>
            </button>
          </Can>

          <button
            onClick={cargarBitacoras}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 transition-colors cursor-pointer"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Filtrar por Laboratorio
          </label>
          <select
            value={filtroLaboratorioId}
            onChange={(e) => setFiltroLaboratorioId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">-- Todos los Laboratorios --</option>
            {Array.isArray(laboratorios) &&
              laboratorios.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Fecha de Ocupación
          </label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tipo de Sesión
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">-- Todos los Tipos --</option>
            <option value="REGULAR">Regular</option>
            <option value="EXTRAORDINARIO">Extraordinario</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFiltroLaboratorioId('');
              setFiltroFecha('');
              setFiltroTipo('');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-700 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla del Historial */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Cargando registros de bitácora...</p>
        </div>
      ) : sesionesFiltradas.length === 0 ? (
        <div className="py-14 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-2">
          <p className="text-sm font-medium text-slate-300">No se encontraron sesiones registradas.</p>
          <p className="text-xs text-slate-500">Pruebe modificando los filtros o inicie una nueva sesión de laboratorio.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Fecha / Horario</th>
                  <th className="py-3.5 px-4">Laboratorio</th>
                  <th className="py-3.5 px-4">Materia / Práctica</th>
                  <th className="py-3.5 px-4">Encargado</th>
                  <th className="py-3.5 px-4 text-center">Asistentes</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sesionesFiltradas.map((s) => {
                  const fechaStr = s.fecha ? new Date(s.fecha).toLocaleDateString() : 'N/A';
                  const nombreLab = s.laboratorio?.nombre || 'Laboratorio';
                  const materiaStr = s.materiaNombre || s.materia?.nombre || 'Uso de Laboratorio';
                  const encargadoStr = s.docente
                    ? `${s.docente.nombre} ${s.docente.apellido || ''}`.trim()
                    : s.nombreAyudante || 'Docente';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-emerald-400 font-semibold">{fechaStr}</div>
                        <div className="text-slate-400 text-xs">
                          {s.horaInicio} - {s.horaFin || 'En curso'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{nombreLab}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-100">{materiaStr}</div>
                        {s.practicaRealizada && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{s.practicaRealizada}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{encargadoStr}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          👥 {s._count?.asistencias ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            s.tipoUso === 'EXTRAORDINARIO'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                              : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                          }`}
                        >
                          {s.tipoUso}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDescargarPdf(s.id)}
                          disabled={descargandoId === s.id}
                          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Descargar Planilla Oficial PDF"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>{descargandoId === s.id ? 'Descargando...' : 'Planilla PDF'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Iniciar Uso de Laboratorio */}
      {modalApertura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>🏢</span> Iniciar Sesión de Laboratorio
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Se generará el código QR para que los alumnos registren su asistencia.
              </p>
            </div>

            <form onSubmit={handleIniciarSesion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Laboratorio a Ocupar *
                </label>
                <select
                  required
                  value={nuevoLabId}
                  onChange={(e) => setNuevoLabId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Seleccionar Laboratorio --</option>
                  {Array.isArray(laboratorios) &&
                    laboratorios.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Materia Curricular (Opcional)
                </label>
                <select
                  value={nuevaMateriaId}
                  onChange={(e) => setNuevaMateriaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Seleccionar Materia --</option>
                  {Array.isArray(materias) &&
                    materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Tipo de Uso
                </label>
                <select
                  value={nuevoTipoUso}
                  onChange={(e) => setNuevoTipoUso(e.target.value as 'REGULAR' | 'EXTRAORDINARIO')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="REGULAR">Regular (Horario Establecido)</option>
                  <option value="EXTRAORDINARIO">Extraordinario / Auxiliatura</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalApertura(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={iniciando || !nuevoLabId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
                >
                  {iniciando ? 'Iniciando...' : 'Abrir Clase y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
