import React, { useEffect, useState, useCallback } from 'react';
import { equipoService } from '../../services/equipo.service';
import { httpClient } from '../../services/httpClient';
import { EquipoItem, EquipoConteos, GuardarEquipoPayload } from '../../interfaces/equipo.interface';
import { ModalEquipo } from '../../components/equipos/ModalEquipo';
import { Can } from '../../components/common/Can';

export const InventarioEquiposView: React.FC = () => {
  const [items, setItems] = useState<EquipoItem[]>([]);
  const [conteos, setConteos] = useState<EquipoConteos>({ total: 0, operativos: 0, enMantenimiento: 0, deteriorados: 0, deBaja: 0 });
  const [laboratorios, setLaboratorios] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroLabId, setFiltroLabId] = useState<number | ''>('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [equipoEditar, setEquipoEditar] = useState<EquipoItem | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resEquipos, resLabs] = await Promise.all([
        equipoService.listar({
          busqueda: busqueda || undefined,
          categoria: filtroCategoria || undefined,
          estado: filtroEstado || undefined,
          laboratorioId: filtroLabId || undefined,
        }),
        httpClient.get('/laboratorios'),
      ]);

      setItems(resEquipos.items || []);
      setConteos(resEquipos.conteos || { total: 0, operativos: 0, enMantenimiento: 0, deteriorados: 0, deBaja: 0 });
      const rawLabs = resLabs.data?.data?.laboratorios || resLabs.data?.data || resLabs.data;
      setLaboratorios(Array.isArray(rawLabs) ? rawLabs : []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el inventario.');
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroCategoria, filtroEstado, filtroLabId]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const handleGuardar = async (payload: GuardarEquipoPayload) => {
    if (equipoEditar) {
      await equipoService.actualizar(equipoEditar.id, payload);
    } else {
      await equipoService.crear(payload);
    }
    void cargarDatos();
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el activo "${nombre}" del inventario?`)) return;
    try {
      await equipoService.eliminar(id);
      void cargarDatos();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el activo.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">Infraestructura</p>
          <h1 className="text-2xl font-bold mt-1">Inventario General de Bienes y Equipos</h1>
          <p className="text-xs text-slate-400 mt-1">Control de computadoras, instrumental, redes, mobiliario y herramientas.</p>
        </div>

        <div className="flex gap-2">
          <Can permiso="equipos:crear">
            <button
              onClick={() => {
                setEquipoEditar(null);
                setModalAbierto(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/40 flex items-center gap-2 cursor-pointer"
            >
              <span>➕</span>
              <span>Nuevo Activo / Bien</span>
            </button>
          </Can>
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
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Activos</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{conteos.total}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-xs text-emerald-400 uppercase font-semibold">Operativos</p>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{conteos.operativos}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-2xl">
          <p className="text-xs text-amber-400 uppercase font-semibold">En Mantenimiento</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{conteos.enMantenimiento}</p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 p-4 rounded-2xl">
          <p className="text-xs text-red-400 uppercase font-semibold">Deteriorados / Baja</p>
          <p className="text-2xl font-bold font-mono text-red-300 mt-1">{conteos.deteriorados + conteos.deBaja}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Buscar por Nombre o Código</label>
          <input
            type="text"
            placeholder="Código patrimonial, marca, serie..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Laboratorio</label>
          <select
            value={filtroLabId}
            onChange={(e) => setFiltroLabId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todos los Laboratorios --</option>
            {laboratorios.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Categoría</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todas las Categorías --</option>
            <option value="COMPUTO">Cómputo</option>
            <option value="RED_COMUNICACION">Redes y Telecomunicaciones</option>
            <option value="MUEBLES_ENSERES">Muebles y Enseres</option>
            <option value="HERRAMIENTAS_INSTRUMENTOS">Herramientas e Instrumentación</option>
            <option value="AUDIOVISUAL">Audiovisual</option>
            <option value="OTRO">Otros</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white"
          >
            <option value="">-- Todos los Estados --</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
            <option value="DETERIORADO">Deteriorado</option>
            <option value="DE_BAJA">Dado de Baja</option>
          </select>
        </div>
      </div>

      {/* Tabla del Inventario */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Cargando inventario de activos...</div>
      ) : items.length === 0 ? (
        <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
          No se encontraron activos o equipos registrados con los criterios seleccionados.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Código / Identificador</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Laboratorio / Ubicación</th>
                  <th className="py-3.5 px-4">Marca & Modelo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.nombre}</div>
                      <div className="font-mono text-xs text-cyan-400">{item.codigoPatrimonial || 'Sin código asignado'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.categoria.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{item.laboratorio?.nombre}</div>
                      {item.ubicacionDetalle && <div className="text-xs text-slate-500">{item.ubicacionDetalle}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {item.marca || item.modelo ? `${item.marca || ''} ${item.modelo || ''}`.trim() : '-'}
                      {item.numeroSerie && <div className="text-[10px] text-slate-500 font-mono">S/N: {item.numeroSerie}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          item.estado === 'OPERATIVO'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : item.estado === 'EN_MANTENIMIENTO'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-red-950/60 text-red-300 border-red-500/40'
                        }`}
                      >
                        {item.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <Can permiso="equipos:editar">
                        <button
                          onClick={() => {
                            setEquipoEditar(item);
                            setModalAbierto(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 transition-colors cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                      </Can>
                      <Can permiso="equipos:eliminar">
                        <button
                          onClick={() => handleEliminar(item.id, item.nombre)}
                          className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-xs px-2.5 py-1.5 rounded-lg text-red-300 transition-colors cursor-pointer"
                        >
                          🗑️
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModalEquipo
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
        equipoEditar={equipoEditar}
        laboratorios={laboratorios}
      />
    </div>
  );
};

export default InventarioEquiposView;
