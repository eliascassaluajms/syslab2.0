import React, { useEffect, useState } from 'react';
import { EventoParticipanteService } from '../services/eventoParticipante.service';

export const ParticipantesView: React.FC = () => {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [guardando, setGuardando] = useState<boolean>(false);
  const [eliminando, setEliminando] = useState<boolean>(false);

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

  return (
    <div className="p-8 text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inscritos y Participantes</h1>
          <p className="text-xs text-gray-400 mt-1">Gestión de registros y estados de inscripción a eventos.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
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
            ) : participantes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No hay participantes registrados.</td>
              </tr>
            ) : (
              participantes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-semibold text-white">{p.nombre} {p.apellido}</td>
                  <td className="p-4 text-gray-400">{p.correo}</td>
                  <td className="p-4 text-gray-300">{p.activity?.title || 'General'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.estado === 'APROBADO' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      p.estado === 'RECHAZADO' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {p.estado || 'PENDIENTE'}
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
              ))
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
    </div>
  );
};
export default ParticipantesView;
