import React, { useEffect, useState } from 'react';
import { EventoParticipanteService } from '../services/eventoParticipante.service';
import { httpClient } from '../services/httpClient';
import { getPublicAssetUrl } from '../utils/urlHelper';

type EstadoInscripcion = 'PRE_INSCRITO' | 'PAGO_VERIFICADO' | 'RECHAZADO' | 'ASISTENCIA_CONFIRMADA';
type Participante = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo: string;
  estado: EstadoInscripcion;
  codigoTransaccion: string;
  comprobanteUrl?: string;
  montoPagado?: number | string;
  montoBancoReal?: number | string | null;
  activity?: { id: string; title: string };
  createdAt?: string;
  updatedAt?: string;
};

export const ValidacionPagosView: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');
  const [procesando, setProcesando] = useState<string | null>(null);
  const [confirmandoRechazo, setConfirmandoRechazo] = useState<string | null>(null);
  const [conciliando, setConciliando] = useState(false);
  const [discrepancias, setDiscrepancias] = useState<Array<Record<string, unknown>>>([]);

  const cargarDatos = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await EventoParticipanteService.listar();
      setParticipantes(data);
      setError(null);
    } catch (err) {
      setError('Error al obtener la lista de pagos.');
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async (
    id: string,
    nuevoEstado: 'PAGO_VERIFICADO' | 'RECHAZADO'
  ): Promise<void> => {
    setProcesando(id);
    try {
      await httpClient.put(`/evento-participantes/${id}`, { estado: nuevoEstado });
      setError(null);
      setConfirmandoRechazo(null);
      await cargarDatos();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { error?: string } } };
      const errorMessage = errorData?.response?.data?.error || 
                          `No se pudo actualizar el estado del pago. Verifique la conexión.`;
      setError(errorMessage);
      console.error('Error al validar pago:', err);
    } finally {
      setProcesando(null);
    }
  };

  const confirmarRechazo = (id: string, esPagoPrevio: boolean): void => {
    if (esPagoPrevio) {
      if (confirmandoRechazo === id) {
        handleValidar(id, 'RECHAZADO');
      } else {
        setConfirmandoRechazo(id);
      }
    } else {
      handleValidar(id, 'RECHAZADO');
    }
  };

  const procesarExtracto = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('extracto', file);
    setConciliando(true);
    setError(null);
    setAviso(null);
    try {
      const response = await httpClient.post('/evento-participantes/conciliar-extracto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data?.data;
      setDiscrepancias(data?.discrepanciasMonto || []);
      setAviso(`Conciliación completada: ${data?.totalProcesados ?? 0} pagos verificados. ${data?.discrepanciasMonto?.length ?? 0} movimientos requieren revisión por diferencia de monto.`);
      await cargarDatos();
    } catch (err: any) {
      setAviso(null);
      setError(err?.response?.data?.message || 'No se pudo procesar el extracto bancario.');
    } finally {
      setConciliando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const participantesFiltrados = participantes.filter((p) => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return true;
    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
    const transaccion = (p.codigoTransaccion || '').toLowerCase();
    const correo = (p.correo || '').toLowerCase();
    return nombreCompleto.includes(query) || transaccion.includes(query) || correo.includes(query);
  });

  const verificados = participantes.filter((p) => p.estado === 'PAGO_VERIFICADO' || p.estado === 'ASISTENCIA_CONFIRMADA');
  const pendientes = participantes.filter((p) => p.estado === 'PRE_INSCRITO');
  const totalVerificado = verificados.reduce((total, p) => total + Number(p.montoBancoReal || p.montoPagado || 0), 0);
  const totalPendiente = pendientes.reduce((total, p) => total + Number(p.montoPagado || 0), 0);

  return (
    <div className="p-8 text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Validación de Pagos</h1>
          <p className="text-xs text-gray-400 mt-1">Revisión de comprobantes bancarios subidos por los participantes.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label className={`cursor-pointer text-center bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${conciliando ? 'opacity-50 pointer-events-none' : ''}`}>
            {conciliando ? 'Procesando extracto...' : 'Conciliar extracto bancario'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={conciliando}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void procesarExtracto(file);
                event.target.value = '';
              }}
            />
          </label>
          <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre o transacción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}
      {aviso && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          {aviso}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Recaudado en cuenta</span>
          <p className="text-2xl font-black text-white mt-1">Bs. {totalVerificado.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{verificados.length} pagos validados</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Por conciliar</span>
          <p className="text-2xl font-black text-white mt-1">Bs. {totalPendiente.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{pendientes.length} preinscripciones</p>
        </div>
        <div className="bg-slate-900 border border-red-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Discrepancias de monto</span>
          <p className="text-2xl font-black text-white mt-1">{discrepancias.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Pendientes de revisión manual</p>
        </div>
        <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Total proyectado</span>
          <p className="text-2xl font-black text-white mt-1">Bs. {(totalVerificado + totalPendiente).toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Pagos verificados y pendientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500 text-xs">Cargando pagos...</p>
        ) : participantesFiltrados.length === 0 ? (
          <p className="text-gray-500 text-xs">No se encontraron comprobantes coincidentes.</p>
        ) : (
          participantesFiltrados.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{p.nombre} {p.apellido}</h3>
                  <p className="text-[11px] text-gray-400">{p.correo}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.estado === 'PAGO_VERIFICADO' ? 'bg-emerald-500/20 text-emerald-400' :
                  p.estado === 'RECHAZADO' ? 'bg-red-500/20 text-red-400' :
                  p.estado === 'ASISTENCIA_CONFIRMADA' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {p.estado === 'PAGO_VERIFICADO' ? 'Aprobado' :
                   p.estado === 'ASISTENCIA_CONFIRMADA' ? 'Asistencia Confirmada' :
                   p.estado === 'PRE_INSCRITO' ? 'Pre-inscrito' :
                   p.estado}
                </span>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 text-xs space-y-1">
                <p><span className="text-gray-500">Nro. Transacción:</span> <span className="text-blue-400 font-mono">{p.codigoTransaccion || 'No registrado'}</span></p>
                <p><span className="text-gray-500">Actividad:</span> <span className="text-gray-300">{p.activity?.title || 'General'}</span></p>
              </div>

              {p.comprobanteUrl ? (
                <div className="space-y-2">
                  <a 
                    href={getPublicAssetUrl(p.comprobanteUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center py-2 px-3 bg-blue-600/15 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-semibold hover:bg-blue-600/25 transition-colors"
                  >
                    Ver Comprobante / OCR
                  </a>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 italic text-center">Sin comprobante adjunto</p>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-800">
                {p.estado === 'PAGO_VERIFICADO' ? (
                  <button 
                    onClick={() => confirmarRechazo(p.id, true)}
                    disabled={procesando === p.id}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                      confirmandoRechazo === p.id
                        ? 'bg-orange-600/30 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {procesando === p.id 
                      ? 'Procesando...' 
                      : confirmandoRechazo === p.id 
                        ? '¿Confirmar rechazo? Clic de nuevo'
                        : 'Rechazar / Revertir Pago'}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleValidar(p.id, 'PAGO_VERIFICADO')}
                      disabled={procesando === p.id}
                      className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {procesando === p.id ? 'Procesando...' : 'Aprobar Pago'}
                    </button>
                    <button 
                      onClick={() => confirmarRechazo(p.id, false)}
                      disabled={procesando === p.id}
                      className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {procesando === p.id ? 'Procesando...' : 'Rechazar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ValidacionPagosView;
