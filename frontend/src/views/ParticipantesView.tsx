import React, { useEffect, useState, useMemo } from 'react';
import { EventoParticipanteService } from '../services/eventoParticipante.service';
import { activityService } from '../services/activity.service';

export const ParticipantesView: React.FC = () => {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [guardando, setGuardando] = useState<boolean>(false);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Estados para los filtros
  const [busquedaNombre, setBusquedaNombre] = useState<string>('');
  const [eventoSeleccionado, setEventoSeleccionado] = useState<string>('');

  const cargarParticipantes = async () => {
    try {
      setLoading(true);
      const data = await EventoParticipanteService.listar();
      setParticipantes(data);
      setError(null);
    } catch (err: any) {
      setError('Error al obtener la lista de participantes.');
    } finally {
      setLoading(false);
    }
  };

  // Lista única de eventos extraída de los participantes cargados
  const listaEventos = useMemo(() => {
    const eventos = participantes.map(
      (p) => p.activity?.title || p.actividad?.nombre || p.actividad || ''
    );
    return Array.from(new Set(eventos)).filter(Boolean);
  }, [participantes]);

  // Filtrado reactivo en memoria
  const participantesFiltrados = useMemo(() => {
    return participantes.filter((p) => {
      const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      const correo = (p.correo || '').toLowerCase();
      const query = busquedaNombre.toLowerCase().trim();

      const coincideTexto =
        !query || nombreCompleto.includes(query) || correo.includes(query);

      const nombreEvento =
        p.activity?.title || p.actividad?.nombre || p.actividad || '';
      const coincideEvento =
        !eventoSeleccionado || nombreEvento === eventoSeleccionado;

      return coincideTexto && coincideEvento;
    });
  }, [participantes, busquedaNombre, eventoSeleccionado]);

  const limpiarFiltros = () => {
    setBusquedaNombre('');
    setEventoSeleccionado('');
  };

  const abrirModalEdicion = (participante: any) => {
    setParticipanteSeleccionado(participante);
    setFormData({
      nombre: participante.nombre,
      apellido: participante.apellido,
      correo: participante.correo,
      telefono: participante.telefono,
      tipo: participante.tipo,
      codigoTransaccion: participante.codigoTransaccion,
    });
    setModalAbierto(true);
  };

  const cerrarModalEdicion = () => {
    setModalAbierto(false);
    setParticipanteSeleccionado(null);
    setFormData({});
  };

  const guardarCambiosParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participanteSeleccionado) return;

    try {
      setGuardando(true);
      await EventoParticipanteService.actualizar(participanteSeleccionado.id, formData);
      await cargarParticipantes();
      cerrarModalEdicion();
    } catch (err: any) {
      console.error('Error al actualizar:', err);
      setError('Error al actualizar los datos del participante.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de inscripción? Esta acción no se puede deshacer.')) {
      eliminarParticipante(id);
    }
  };

  const eliminarParticipante = async (id: string) => {
    try {
      setEliminando(true);
      await EventoParticipanteService.eliminar(id);
      await cargarParticipantes();
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError('Error al eliminar el registro del participante.');
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    cargarParticipantes();
  }, []);

  const [modalMatriculaManualOpen, setModalMatriculaManualOpen] = useState<boolean>(false);
  const [manualFormData, setManualFormData] = useState<any>({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    tipo: 'ESTUDIANTE',
    activityId: '',
    codigoTransaccion: '',
    observaciones: 'Matriculación manual por administración',
  });
  const [actividadesDisponibles, setActividadesDisponibles] = useState<any[]>([]);

  // Estados para el reporte de impresión
  const [modalReporteOpen, setModalReporteOpen] = useState<boolean>(false);
  const [verificadosReporte, setVerificadosReporte] = useState<any[]>([]);
  const [reporteActividadNombre, setReporteActividadNombre] = useState<string>('');
  const [cargandoReporte, setCargandoReporte] = useState<boolean>(false);

  const cargarActividadesLista = async () => {
    try {
      const items = await activityService.listar();
      setActividadesDisponibles(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error('Error al obtener lista de actividades para matriculación:', e);
    }
  };

  useEffect(() => {
    cargarActividadesLista();
  }, []);

  const handleAbrirMatriculaManual = () => {
    setManualFormData({
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      tipo: 'ESTUDIANTE',
      activityId: actividadesDisponibles[0]?.id || '',
      codigoTransaccion: `MANUAL-${Date.now().toString().slice(-6)}`,
      observaciones: 'Matriculación manual por administración',
    });
    setModalMatriculaManualOpen(true);
  };

  const handleGuardarMatriculaManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await EventoParticipanteService.matricularManual(manualFormData);
      await cargarParticipantes();
      setModalMatriculaManualOpen(false);
    } catch (err: any) {
      console.error('Error en matriculación manual:', err);
      setError(err?.response?.data?.error || 'Error al matricular manualmente al alumno.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGenerarReporteImpresion = async () => {
    // Buscar ID de actividad seleccionada en el filtro o usar la primera disponible
    let targetActId = '';
    let targetActTitle = 'Todas las Actividades';

    if (eventoSeleccionado) {
      const actObj = actividadesDisponibles.find(
        (a) => (a.title || a.nombre) === eventoSeleccionado
      );
      if (actObj) {
        targetActId = actObj.id;
        targetActTitle = actObj.title || actObj.nombre;
      }
    }

    if (!targetActId && actividadesDisponibles.length > 0) {
      targetActId = actividadesDisponibles[0].id;
      targetActTitle = actividadesDisponibles[0].title || actividadesDisponibles[0].nombre;
    }

    if (!targetActId) {
      alert('No hay actividades registradas para generar el reporte de verificados.');
      return;
    }

    try {
      setCargandoReporte(true);
      setReporteActividadNombre(targetActTitle);
      const datosVerificados = await EventoParticipanteService.listarVerificadosPorActividad(targetActId);
      setVerificadosReporte(Array.isArray(datosVerificados) ? datosVerificados : []);
      setModalReporteOpen(true);
    } catch (err) {
      console.error('Error al generar reporte:', err);
      alert('Error al obtener la lista de verificados para la actividad.');
    } finally {
      setCargandoReporte(false);
    }
  };

  return (
    <div className="p-8 space-y-6 text-slate-200">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Inscritos y Participantes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de registros, matriculación manual y emisión de reportes oficiales.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAbrirMatriculaManual}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
          >
            ➕ Matricular Alumno Manualmente
          </button>
          <button
            onClick={handleGenerarReporteImpresion}
            disabled={cargandoReporte}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20 transition-colors disabled:opacity-50"
          >
            🖨️ {cargandoReporte ? 'Generando...' : 'Reporte de Impresión'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
          {/* Búsqueda por Nombre o Correo */}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Buscar Participante
            </label>
            <input
              type="text"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              placeholder="Escribe un nombre, apellido o correo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Selector de Evento */}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Filtrar por Evento / Actividad
            </label>
            <select
              value={eventoSeleccionado}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">-- Todos los Eventos --</option>
              {listaEventos.map((evt, idx) => (
                <option key={idx} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador y Limpieza de Filtros */}
        <div className="flex items-center gap-3 self-end md:self-auto pt-2 md:pt-5">
          <span className="text-xs text-slate-400">
            Mostrando <strong className="text-emerald-400">{participantesFiltrados.length}</strong> de {participantes.length}
          </span>
          {(busquedaNombre || eventoSeleccionado) && (
            <button
              onClick={limpiarFiltros}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Participantes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase bg-gray-950/40">
              <th className="p-4">Participante</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Actividad / Evento</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Cargando participantes...</td>
              </tr>
            ) : participantesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No se encontraron participantes que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              participantesFiltrados.map((p) => {
                const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';
                const nombreActividad = p.activity?.title || p.actividad?.nombre || p.actividad || 'General';

                return (
                  <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white">{nombreCompleto}</td>
                    <td className="p-4 text-gray-400">{p.correo}</td>
                    <td className="p-4 text-gray-300">{nombreActividad}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.estado === 'APROBADO' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        p.estado === 'RECHAZADO' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.estado || 'PRE_INSCRITO'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => abrirModalEdicion(p)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-500/10 transition-colors"
                      >
                        ⚙️ Gestionar
                      </button>
                      <button 
                        onClick={() => confirmarEliminacion(p.id)}
                        disabled={eliminando}
                        className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Editar Participante</h2>

            <form onSubmit={guardarCambiosParticipante} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Apellido</label>
                <input
                  type="text"
                  value={formData.apellido || ''}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Correo</label>
                <input
                  type="email"
                  value={formData.correo || ''}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                <select
                  value={formData.tipo || 'ESTUDIANTE'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="PROFESIONAL">Profesional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Código de Transacción</label>
                <input
                  type="text"
                  value={formData.codigoTransaccion || ''}
                  onChange={(e) => setFormData({ ...formData, codigoTransaccion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Matriculación Manual */}
      {modalMatriculaManualOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ➕ Matriculación Manual de Alumno
              </h2>
              <button
                onClick={() => setModalMatriculaManualOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMatriculaManual} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={manualFormData.nombre}
                    onChange={(e) => setManualFormData({ ...manualFormData, nombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej. Juan Carlos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={manualFormData.apellido}
                    onChange={(e) => setManualFormData({ ...manualFormData, apellido: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej. Pérez Gómez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={manualFormData.correo}
                    onChange={(e) => setManualFormData({ ...manualFormData, correo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="juan.perez@uajms.edu.bo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Celular</label>
                  <input
                    type="tel"
                    value={manualFormData.telefono}
                    onChange={(e) => setManualFormData({ ...manualFormData, telefono: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="71234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Participante *</label>
                  <select
                    value={manualFormData.tipo}
                    onChange={(e) => setManualFormData({ ...manualFormData, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="PROFESIONAL">Profesional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Actividad / Evento *</label>
                  <select
                    required
                    value={manualFormData.activityId}
                    onChange={(e) => setManualFormData({ ...manualFormData, activityId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Seleccione actividad...</option>
                    {actividadesDisponibles.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.title || act.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Transacción</label>
                <input
                  type="text"
                  value={manualFormData.codigoTransaccion}
                  onChange={(e) => setManualFormData({ ...manualFormData, codigoTransaccion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones / Notas</label>
                <textarea
                  rows={2}
                  value={manualFormData.observaciones}
                  onChange={(e) => setManualFormData({ ...manualFormData, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMatriculaManualOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Matriculando...' : 'Confirmar Matriculación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reporte de Impresión */}
      {modalReporteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center no-print">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🖨️ Vista Previa del Reporte de Verificados
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  Imprimir Reporte
                </button>
                <button
                  onClick={() => setModalReporteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 text-slate-900 bg-white" id="printable-report">
              {/* Encabezado Institucional UAJMS - FIRNT */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
                <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                  Universidad Autónoma Juan Misael Saracho
                </h1>
                <h2 className="text-sm font-semibold text-slate-700">
                  Facultad de Ciencias de la Ingeniería (FIRNT) - SysLab 2.0
                </h2>
                <h3 className="text-base font-bold text-blue-900 mt-2">
                  REPORTE OFICIAL DE PARTICIPANTES CON PAGO VERIFICADO
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Actividad:</strong> {reporteActividadNombre} | <strong>Fecha de emisión:</strong> {new Date().toLocaleDateString('es-BO')}
                </p>
              </div>

              {verificadosReporte.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">
                  No existen participantes con pago verificado registrados para esta actividad.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase">
                      <th className="p-2 border border-slate-300 text-center w-10">N°</th>
                      <th className="p-2 border border-slate-300">Apellidos y Nombres</th>
                      <th className="p-2 border border-slate-300">Correo Electrónico</th>
                      <th className="p-2 border border-slate-300">Teléfono</th>
                      <th className="p-2 border border-slate-300 text-center">Tipo</th>
                      <th className="p-2 border border-slate-300">Código Transacción</th>
                      <th className="p-2 border border-slate-300 text-center">Estado Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {verificadosReporte.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{p.apellido}, {p.nombre}</td>
                        <td className="p-2 border border-slate-300">{p.correo}</td>
                        <td className="p-2 border border-slate-300">{p.telefono || 'N/A'}</td>
                        <td className="p-2 border border-slate-300 text-center font-medium">{p.tipo}</td>
                        <td className="p-2 border border-slate-300 font-mono text-[11px]">{p.codigoTransaccion}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">PAGO VERIFICADO</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Firmas institucionales */}
              <div className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold">
                    Responsable de Laboratorio / Coordinador
                  </div>
                  <div className="text-slate-500">SysLab 2.0 - FIRNT / UAJMS</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold">
                    Administración / Decanato FIRNT
                  </div>
                  <div className="text-slate-500">Facultad de Ciencias de la Ingeniería</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ParticipantesView;
