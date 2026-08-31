import React, { useState } from 'react';
import {
  LaboratorioDisponible,
  CrearSolicitudExtraordinariaDTO,
} from '../../interfaces/solicitudExtraordinaria.interface';
import { solicitudesExtraordinariasService } from '../../services/solicitudesExtraordinarias.service';

interface ModalSolicitudExtraordinariaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  esDirectorOJefe?: boolean;
}

export const ModalSolicitudExtraordinaria: React.FC<ModalSolicitudExtraordinariaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  esDirectorOJefe = false,
}) => {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Filtros de horario
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState<string>(hoyStr);
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('10:00');

  // Paso 2: Selección de Laboratorio
  const [labsDisponibles, setLabsDisponibles] = useState<LaboratorioDisponible[]>([]);
  const [labSeleccionado, setLabSeleccionado] = useState<LaboratorioDisponible | null>(null);

  // Paso 3: Detalles y modo
  const [solicitadoPorDirector, setSolicitadoPorDirector] = useState<boolean>(esDirectorOJefe);
  const [nombreAyudante, setNombreAyudante] = useState<string>('');
  const [materia, setMateria] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuscarDisponibilidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fecha || !horaInicio || !horaFin) {
      setError('Por favor complete la fecha y el rango de horario.');
      return;
    }

    if (horaInicio >= horaFin) {
      setError('La hora de inicio debe ser menor a la hora de fin.');
      return;
    }

    setLoading(true);
    try {
      const disponibles = await solicitudesExtraordinariasService.consultarDisponibilidad(
        fecha,
        horaInicio,
        horaFin
      );
      setLabsDisponibles(disponibles);
      setPaso(2);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al consultar disponibilidad.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarLab = (lab: LaboratorioDisponible) => {
    setLabSeleccionado(lab);
    setPaso(3);
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!labSeleccionado) {
      setError('Debe seleccionar un laboratorio.');
      return;
    }

    if (!materia.trim()) {
      setError('Debe ingresar la materia o nombre de la práctica.');
      return;
    }

    if (!motivo.trim()) {
      setError('Debe ingresar el motivo de la reserva.');
      return;
    }

    if (solicitadoPorDirector && !nombreAyudante.trim()) {
      setError('El nombre del ayudante de cátedra es obligatorio cuando la solicitud la realiza el director.');
      return;
    }

    const payload: CrearSolicitudExtraordinariaDTO = {
      laboratorioId: labSeleccionado.id,
      solicitadoPorDirector,
      nombreAyudante: solicitadoPorDirector ? nombreAyudante.trim() : undefined,
      materia: materia.trim(),
      fecha,
      horaInicio,
      horaFin,
      motivo: motivo.trim(),
    };

    setLoading(true);
    try {
      await solicitudesExtraordinariasService.crear(payload);
      onSuccess();
      onClose();
      // Reiniciar estado
      setPaso(1);
      setMateria('');
      setMotivo('');
      setNombreAyudante('');
      setLabSeleccionado(null);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar la solicitud extraordinaria.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-amber-400">⚡</span> Solicitar Horario Extraordinario
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Asistente de reserva guiado para laboratorios fuera de horario regular
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 text-xs text-center font-medium">
          <div
            className={`py-2.5 px-3 border-r border-slate-800 transition-colors ${
              paso === 1 ? 'bg-indigo-600/20 text-indigo-400 font-bold border-b-2 border-b-indigo-500' : 'text-slate-400'
            }`}
          >
            1. Fecha y Hora
          </div>
          <div
            className={`py-2.5 px-3 border-r border-slate-800 transition-colors ${
              paso === 2 ? 'bg-indigo-600/20 text-indigo-400 font-bold border-b-2 border-b-indigo-500' : 'text-slate-400'
            }`}
          >
            2. Laboratorio Libre
          </div>
          <div
            className={`py-2.5 px-3 transition-colors ${
              paso === 3 ? 'bg-indigo-600/20 text-indigo-400 font-bold border-b-2 border-b-indigo-500' : 'text-slate-400'
            }`}
          >
            3. Detalles Reserva
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Cuerpo Modal */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* PASO 1: Selección de Fecha y Rango Horario */}
          {paso === 1 && (
            <form onSubmit={handleBuscarDisponibilidad} className="space-y-5">
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/60">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Paso 1: Define el día y horario requerido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fecha de Reserva <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      min={hoyStr}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hora Inicio <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hora Fin <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? 'Consultando...' : 'Buscar Laboratorios Disponibles 🔍'}
                </button>
              </div>
            </form>
          )}

          {/* PASO 2: Selección de Laboratorio Disponible */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200">
                  Paso 2: Selecciona un laboratorio disponible ({fecha} de {horaInicio} a {horaFin})
                </h3>
                <button
                  onClick={() => setPaso(1)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                  Cambiar horario
                </button>
              </div>

              {labsDisponibles.length === 0 ? (
                <div className="p-6 bg-amber-950/40 border border-amber-800/80 rounded-xl text-center">
                  <span className="text-3xl block mb-2">⚠️</span>
                  <h4 className="font-semibold text-amber-200 text-sm">Sin Laboratorios Disponibles</h4>
                  <p className="text-xs text-amber-300/80 mt-1 max-w-md mx-auto">
                    No existen ambientes desocupados en la fecha y rango de horas seleccionado. Intente cambiar la hora o fecha en el Paso 1.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto p-1">
                  {labsDisponibles.map((lab) => (
                    <div
                      key={lab.id}
                      onClick={() => handleSeleccionarLab(lab)}
                      className="p-4 bg-slate-800 hover:bg-indigo-950/40 border border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-indigo-500/10 group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {lab.nombre}
                          </h4>
                          {lab.codigo && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
                              {lab.codigo}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-full">
                          Libre
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                        <span>Capacidad: {lab.capacidad} estudiantes</span>
                        <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                          Seleccionar &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  &larr; Volver
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Detalles de la Reserva y Modo de Solicitud */}
          {paso === 3 && labSeleccionado && (
            <form onSubmit={handleSubmitFinal} className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-xs flex justify-between items-center text-slate-200">
                <div>
                  <span className="font-bold text-indigo-300">{labSeleccionado.nombre}</span>
                  <span className="text-slate-400 ml-2">({fecha} | {horaInicio} - {horaFin})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Cambiar Lab
                </button>
              </div>

              {/* Selector de Modo */}
              <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/60 space-y-3">
                <label className="block text-xs font-semibold text-slate-200">
                  Tipo / Modo de Solicitante
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer text-xs flex items-start gap-2.5 transition-colors ${
                      !solicitadoPorDirector
                        ? 'bg-indigo-950/50 border-indigo-500 text-slate-100 font-medium'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoDirector"
                      checked={!solicitadoPorDirector}
                      onChange={() => setSolicitadoPorDirector(false)}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="block font-bold">Docente Directo</span>
                      <span className="text-[11px] text-slate-400">Solicitud para el docente titular autenticado.</span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer text-xs flex items-start gap-2.5 transition-colors ${
                      solicitadoPorDirector
                        ? 'bg-indigo-950/50 border-indigo-500 text-slate-100 font-medium'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoDirector"
                      checked={solicitadoPorDirector}
                      onChange={() => setSolicitadoPorDirector(true)}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="block font-bold">Director para Ayudante</span>
                      <span className="text-[11px] text-slate-400">Solicitada por la autoridad para un auxiliar de cátedra.</span>
                    </div>
                  </label>
                </div>

                {solicitadoPorDirector && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60">
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      Nombre del Ayudante / Auxiliar <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreAyudante}
                      onChange={(e) => setNombreAyudante(e.target.value)}
                      placeholder="Ej. Univ. Pedro Gutiérrez"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      required={solicitadoPorDirector}
                    />
                  </div>
                )}
              </div>

              {/* Campos finales */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Materia / Nombre de la Práctica <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Ej. SIS-211 Redes de Computadoras"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Motivo de la Reserva Extraordinaria <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Describa el propósito de la clase o examen extraordinario..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  &larr; Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? 'Registrando...' : 'Confirmar y Enviar Solicitud 🚀'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
