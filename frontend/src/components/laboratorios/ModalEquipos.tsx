import React, { useState, useEffect } from 'react';
import { httpClient as api } from '../../services/httpClient';

export interface Equipo {
    id: number;
    codigoInventario: string;
    nombre: string;
    marca?: string;
    modelo?: string;
    numSerie?: string;
    especificaciones?: string;
    estado: 'OPERATIVO' | 'CON_FALLA' | 'EN_MANTENIMIENTO' | 'DESUSO';
    laboratorioId: number;
}

interface Props {
    modalAbierto: boolean;
    onClose: () => void;
    laboratorio: { id: number; codigo: string; nombre: string } | null;
}

export const ModalEquipos: React.FC<Props> = ({ modalAbierto, onClose, laboratorio }) => {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Control de Formulario / Vistas
    const [modoCrear, setModoCrear] = useState<boolean>(false);
    const [tipoRegistro, setTipoRegistro] = useState<'individual' | 'lote'>('lote');
    const [guardando, setGuardando] = useState<boolean>(false);

    // Campos Registro Individual
    const [codigoInventario, setCodigoInventario] = useState<string>('');
    const [nombre, setNombre] = useState<string>('');
    const [marca, setMarca] = useState<string>('');
    const [modelo, setModelo] = useState<string>('');
    const [numSerie, setNumSerie] = useState<string>('');
    const [especificaciones, setEspecificaciones] = useState<string>('');

    // Campos Registro por Lote (Masivo)
    const [prefijoCodigo, setPrefijoCodigo] = useState<string>('PC-LAB-');
    const [correlativoInicio, setCorrelativoInicio] = useState<number>(1);
    const [cantidad, setCantidad] = useState<number>(20);
    const [digitosCorrelativo, setDigitosCorrelativo] = useState<number>(2);
    const [nombreLote, setNombreLote] = useState<string>('Estación de Trabajo OptiPlex');
    const [marcaLote, setMarcaLote] = useState<string>('Dell');
    const [modeloLote, setModeloLote] = useState<string>('OptiPlex 7010');
    const [especificacionesLote, setEspecificacionesLote] = useState<string>('Intel Core i7, 16GB RAM, SSD 512GB');

    // Cargar equipos
    const cargarEquipos = async () => {
        if (!laboratorio) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/laboratorios/${laboratorio.id}/equipos`);
            setEquipos(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al obtener la lista de equipos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (modalAbierto && laboratorio) {
            setModoCrear(false);
            cargarEquipos();
        }
    }, [modalAbierto, laboratorio]);

    const resetFormulario = () => {
        setCodigoInventario('');
        setNombre('');
        setMarca('');
        setModelo('');
        setNumSerie('');
        setEspecificaciones('');
    };

    // Guardar Individual
    const handleGuardarEquipo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!laboratorio || !codigoInventario.trim() || !nombre.trim()) return;

        setGuardando(true);
        setError(null);

        const payload = {
            codigoInventario: codigoInventario.trim(),
            nombre: nombre.trim(),
            marca: marca.trim() || undefined,
            modelo: modelo.trim() || undefined,
            numSerie: numSerie.trim() || undefined,
            especificaciones: especificaciones.trim() || undefined,
            laboratorioId: laboratorio.id,
        };

        try {
            await api.post('/equipos', payload);
            resetFormulario();
            setModoCrear(false);
            await cargarEquipos();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al registrar el equipo.');
        } finally {
            setGuardando(false);
        }
    };

    // Guardar por Lote
    const handleGuardarLote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!laboratorio || !prefijoCodigo.trim() || !nombreLote.trim()) return;

        setGuardando(true);
        setError(null);

        const payload = {
            prefijoCodigo: prefijoCodigo.trim(),
            correlativoInicio: Number(correlativoInicio),
            cantidad: Number(cantidad),
            digitosCorrelativo: Number(digitosCorrelativo),
            nombre: nombreLote.trim(),
            marca: marcaLote.trim() || undefined,
            modelo: modeloLote.trim() || undefined,
            laboratorioId: laboratorio.id,
            especificaciones: especificacionesLote.trim() || undefined,
        };

        try {
            await api.post('/equipos/lote', payload);
            setModoCrear(false);
            await cargarEquipos();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al generar el lote de equipos.');
        } finally {
            setGuardando(false);
        }
    };

    // Cambiar estado directo
    const handleCambiarEstado = async (equipoId: number, nuevoEstado: string) => {
        try {
            await api.patch(`/equipos/${equipoId}/estado`, { estado: nuevoEstado });
            await cargarEquipos();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar el estado del equipo.');
        }
    };

    if (!modalAbierto || !laboratorio) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white">

                {/* Encabezado Modal */}
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/40 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span>🖥️</span> Equipos del Ambiente: <span className="text-blue-400">{laboratorio.nombre}</span>
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Código Aula: {laboratorio.codigo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-gray-800 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Sub-Barra de Acciones */}
                <div className="px-6 py-3 bg-gray-900/80 border-b border-gray-800 flex justify-between items-center">
                    <div className="text-xs text-gray-400">
                        Total de equipos: <span className="font-bold text-white">{equipos.length}</span>
                    </div>
                    <button
                        onClick={() => {
                            setModoCrear(!modoCrear);
                            setError(null);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                        {modoCrear ? '← Volver al Listado' : '➕ Registrar Equipos'}
                    </button>
                </div>

                {/* Pestañas de Modo Registro (Solo visible en modo creación) */}
                {modoCrear && (
                    <div className="flex border-b border-gray-800 bg-gray-950/60">
                        <button
                            type="button"
                            onClick={() => setTipoRegistro('lote')}
                            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
                                tipoRegistro === 'lote'
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                    : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            📦 Registro en Lote (Masivo)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipoRegistro('individual')}
                            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
                                tipoRegistro === 'individual'
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                    : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            📋 Registro Individual
                        </button>
                    </div>
                )}

                {/* Notificación de Error */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        ⚠️ {error}
                    </div>
                )}

                {/* Contenido Principal Modal */}
                <div className="p-6 overflow-y-auto flex-1">
                    {modoCrear ? (
                        tipoRegistro === 'lote' ? (
                            /* FORMULARIO REGISTRO EN LOTE */
                            <form onSubmit={handleGuardarLote} className="space-y-4">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                                    💡 <strong>Generación Automática:</strong> Se creará una serie desde{' '}
                                    <span className="font-mono bg-gray-950 px-1.5 py-0.5 rounded text-white">
                                        {prefijoCodigo}{String(correlativoInicio).padStart(digitosCorrelativo, '0')}
                                    </span>{' '}
                                    hasta{' '}
                                    <span className="font-mono bg-gray-950 px-1.5 py-0.5 rounded text-white">
                                        {prefijoCodigo}{String(correlativoInicio + Math.max(0, cantidad - 1)).padStart(digitosCorrelativo, '0')}
                                    </span>.
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Prefijo de Código *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={prefijoCodigo}
                                            onChange={(e) => setPrefijoCodigo(e.target.value)}
                                            placeholder="Ej. PC-LAB1-"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Nº Correlativo Inicial *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={correlativoInicio}
                                            onChange={(e) => setCorrelativoInicio(parseInt(e.target.value) || 1)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Cantidad de Equipos *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            required
                                            value={cantidad}
                                            onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold text-blue-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Nombre del Dispositivo *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={nombreLote}
                                            onChange={(e) => setNombreLote(e.target.value)}
                                            placeholder="Ej. Estación de Trabajo PC"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Marca
                                        </label>
                                        <input
                                            type="text"
                                            value={marcaLote}
                                            onChange={(e) => setMarcaLote(e.target.value)}
                                            placeholder="Ej. Dell"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Modelo
                                        </label>
                                        <input
                                            type="text"
                                            value={modeloLote}
                                            onChange={(e) => setModeloLote(e.target.value)}
                                            placeholder="Ej. OptiPlex 7010"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Especificaciones Comunes (JSON o Texto)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={especificacionesLote}
                                            onChange={(e) => setEspecificacionesLote(e.target.value)}
                                            placeholder="Ej. Core i7 12th, 16GB RAM, SSD 512GB"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setModoCrear(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 cursor-pointer"
                                    >
                                        {guardando ? 'Generando Lote...' : `Generar Lote de ${cantidad} Equipos`}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* FORMULARIO REGISTRO INDIVIDUAL */
                            <form onSubmit={handleGuardarEquipo} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Código de Inventario *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={codigoInventario}
                                            onChange={(e) => setCodigoInventario(e.target.value)}
                                            placeholder="Ej. UAJMS-INF-001"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Nombre del Equipo / Dispositivo *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            placeholder="Ej. PC de Escritorio OptiPlex"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Marca
                                        </label>
                                        <input
                                            type="text"
                                            value={marca}
                                            onChange={(e) => setMarca(e.target.value)}
                                            placeholder="Ej. Dell / HP / Cisco"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Modelo
                                        </label>
                                        <input
                                            type="text"
                                            value={modelo}
                                            onChange={(e) => setModelo(e.target.value)}
                                            placeholder="Ej. OptiPlex 7010 Tower"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Número de Serie
                                        </label>
                                        <input
                                            type="text"
                                            value={numSerie}
                                            onChange={(e) => setNumSerie(e.target.value)}
                                            placeholder="Ej. SN-78239410A"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                                            Especificaciones Técnicas
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={especificaciones}
                                            onChange={(e) => setEspecificaciones(e.target.value)}
                                            placeholder="Ej. Intel Core i7 12th Gen, 16GB RAM DDR4, SSD 512GB NVMe, Monitor Dell 24''"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setModoCrear(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 cursor-pointer"
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar Equipo'}
                                    </button>
                                </div>
                            </form>
                        )
                    ) : (
                        /* LISTADO DE EQUIPOS EN TABLA */
                        loading ? (
                            <div className="flex min-h-[200px] justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : equipos.length > 0 ? (
                            <div className="bg-gray-950/40 border border-gray-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-950 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Código / Serie</th>
                                            <th className="py-3 px-4">Equipo</th>
                                            <th className="py-3 px-4">Marca / Modelo</th>
                                            <th className="py-3 px-4 text-center">Estado</th>
                                            <th className="py-3 px-4 text-center">Cambiar Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60">
                                        {equipos.map((eq) => (
                                            <tr key={eq.id} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-blue-400">
                                                    {eq.codigoInventario}
                                                    {eq.numSerie && (
                                                        <p className="text-[10px] text-gray-500 font-normal">S/N: {eq.numSerie}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-white">
                                                    {eq.nombre}
                                                    {eq.especificaciones && (
                                                        <p className="text-[10px] text-gray-400 font-normal line-clamp-1">
                                                            {typeof eq.especificaciones === 'object'
                                                                ? JSON.stringify(eq.especificaciones)
                                                                : eq.especificaciones}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-gray-300">
                                                    {eq.marca || '-'} {eq.modelo ? `/ ${eq.modelo}` : ''}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                            eq.estado === 'OPERATIVO'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : eq.estado === 'CON_FALLA'
                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                    : eq.estado === 'EN_MANTENIMIENTO'
                                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}
                                                    >
                                                        {eq.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <select
                                                        value={eq.estado}
                                                        onChange={(e) => handleCambiarEstado(eq.id, e.target.value)}
                                                        className="bg-gray-800 border border-gray-700 text-gray-200 text-[11px] rounded p-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                                                    >
                                                        <option value="OPERATIVO">OPERATIVO</option>
                                                        <option value="CON_FALLA">CON_FALLA</option>
                                                        <option value="EN_MANTENIMIENTO">EN_MANTENIMIENTO</option>
                                                        <option value="DESUSO">DESUSO</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                <p className="text-xs italic">No hay equipos registrados en este laboratorio.</p>
                                <button
                                    onClick={() => {
                                        setModoCrear(true);
                                        setTipoRegistro('lote');
                                    }}
                                    className="mt-3 text-xs text-blue-400 hover:underline cursor-pointer"
                                >
                                    + Generar lote de equipos
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};