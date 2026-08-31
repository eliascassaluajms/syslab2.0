import React, { useEffect, useState } from 'react';
import { EventoParticipanteService } from '../services/eventoParticipante.service';
import httpClient from '../services/httpClient';

export const ValidacionPagosView: React.FC = () => {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await EventoParticipanteService.listar();
      setParticipantes(data);
      setError(null);
    } catch (err: any) {
      setError('Error al obtener la lista de pagos.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async (id: string, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
    try {
      // Intento con la ruta estándar PUT /evento-participantes/:id
      await httpClient.put(`/evento-participantes/${id}`, { estado: nuevoEstado });
      cargarDatos();
    } catch (err: any) {
      try {
        // Fallback alternativo con patch por si el backend lo requiere
        await httpClient.patch(`/evento-participantes/${id}`, { estado: nuevoEstado });
        cargarDatos();
      } catch (err2: any) {
        alert('No se pudo actualizar el estado del pago. Compruebe la conexión con el servidor.');
      }
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado por nombre, apellido o número de transacción
  const participantesFiltrados = participantes.filter((p) => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return true;
    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
    const transaccion = (p.codigoTransaccion || '').toLowerCase();
    const correo = (p.correo || '').toLowerCase();
    return nombreCompleto.includes(query) || transaccion.includes(query) || correo.includes(query);
  });

  return (
    <div className="p-8 text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Validación de Pagos</h1>
          <p className="text-xs text-gray-400 mt-1">Revisión de comprobantes bancarios subidos por los participantes.</p>
        </div>
        {/* Barra de búsqueda por nombre y transacción */}
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

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

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
                  p.estado === 'APROBADO' ? 'bg-emerald-500/20 text-emerald-400' :
                  p.estado === 'RECHAZADO' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {p.estado}
                </span>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 text-xs space-y-1">
                <p><span className="text-gray-500">Nro. Transacción:</span> <span className="text-blue-400 font-mono">{p.codigoTransaccion || 'No registrado'}</span></p>
                <p><span className="text-gray-500">Actividad:</span> <span className="text-gray-300">{p.activity?.title || 'General'}</span></p>
              </div>

              {p.comprobanteUrl ? (
                <div className="space-y-2">
                  <a 
                    href={`http://localhost:3000${p.comprobanteUrl}`} 
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
                <button 
                  onClick={() => handleValidar(p.id, 'APROBADO')}
                  className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Aprobar
                </button>
                <button 
                  onClick={() => handleValidar(p.id, 'RECHAZADO')}
                  className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default ValidacionPagosView;
