import React, { useState, useEffect } from 'react';
import { EquipoItem, GuardarEquipoPayload, CategoriaActivo, EstadoActivo } from '../../interfaces/equipo.interface';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (data: GuardarEquipoPayload) => Promise<void>;
  equipoEditar: EquipoItem | null;
  laboratorios: Array<{ id: number; nombre: string }>;
}

export const ModalEquipo: React.FC<Props> = ({ isOpen, onClose, onGuardar, equipoEditar, laboratorios }) => {
  const [laboratorioId, setLaboratorioId] = useState<number | ''>('');
  const [codigoPatrimonial, setCodigoPatrimonial] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaActivo>('COMPUTO');
  const [estado, setEstado] = useState<EstadoActivo>('OPERATIVO');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [ubicacionDetalle, setUbicacionDetalle] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (equipoEditar) {
      setLaboratorioId(equipoEditar.laboratorioId);
      setCodigoPatrimonial(equipoEditar.codigoPatrimonial || '');
      setNombre(equipoEditar.nombre);
      setCategoria(equipoEditar.categoria);
      setEstado(equipoEditar.estado);
      setMarca(equipoEditar.marca || '');
      setModelo(equipoEditar.modelo || '');
      setNumeroSerie(equipoEditar.numeroSerie || '');
      setUbicacionDetalle(equipoEditar.ubicacionDetalle || '');
      setDescripcion(equipoEditar.descripcion || '');
    } else {
      setLaboratorioId(laboratorios.length > 0 ? laboratorios[0].id : '');
      setCodigoPatrimonial('');
      setNombre('');
      setCategoria('COMPUTO');
      setEstado('OPERATIVO');
      setMarca('');
      setModelo('');
      setNumeroSerie('');
      setUbicacionDetalle('');
      setDescripcion('');
    }
    setError(null);
  }, [equipoEditar, isOpen, laboratorios]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laboratorioId || !nombre.trim()) {
      setError('El laboratorio y el nombre del activo son obligatorios.');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        laboratorioId: Number(laboratorioId),
        codigoPatrimonial: codigoPatrimonial.trim() || null,
        nombre: nombre.trim(),
        categoria,
        estado,
        marca: marca.trim() || null,
        modelo: modelo.trim() || null,
        numeroSerie: numeroSerie.trim() || null,
        ubicacionDetalle: ubicacionDetalle.trim() || null,
        descripcion: descripcion.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el activo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📦</span> {equipoEditar ? 'Editar Activo / Bien' : 'Registrar Nuevo Activo en Laboratorio'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Gestión de equipos, mobiliario, redes e instrumentos de trabajo.</p>
        </div>

        {error && <div className="bg-red-950/60 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Laboratorio Asignado *</label>
              <select
                required
                value={laboratorioId}
                onChange={(e) => setLaboratorioId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Seleccionar Laboratorio --</option>
                {laboratorios.map((l) => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Categoría del Bien *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaActivo)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="COMPUTO">Equipos de Cómputo (PC, Servidor, Laptop)</option>
                <option value="RED_COMUNICACION">Redes y Telecomunicaciones (Switch, Router, Rack)</option>
                <option value="MUEBLES_ENSERES">Muebles y Enseres (Mesa, Silla, Estante, Pizarra)</option>
                <option value="HERRAMIENTAS_INSTRUMENTOS">Herramientas e Instrumentación</option>
                <option value="AUDIOVISUAL">Audiovisual (Proyector, Ecran, Audio)</option>
                <option value="OTRO">Otro Material</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nombre / Identificador del Bien *</label>
              <input
                required
                type="text"
                placeholder="Ej: PC Docente 01 / Mesa Trabajo / Osciloscopio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Código de Activo / Patrimonial (UAJMS)</label>
              <input
                type="text"
                placeholder="Ej: ACT-LAB3-0045"
                value={codigoPatrimonial}
                onChange={(e) => setCodigoPatrimonial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Estado Operativo</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoActivo)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="OPERATIVO">Operativo</option>
                <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                <option value="DETERIORADO">Deteriorado</option>
                <option value="DE_BAJA">Dado de Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ej: Dell / Cisco / Genérico"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Modelo / Serie</label>
              <input
                type="text"
                placeholder="Ej: OptiPlex 7010 / SN-98231"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Ubicación Detallada en Laboratorio</label>
            <input
              type="text"
              placeholder="Ej: Estante 2 - Casillero Superior / Fila 1 - Puesto 3"
              value={ubicacionDetalle}
              onChange={(e) => setUbicacionDetalle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Descripción / Observaciones</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre características, accesorios o estado físico..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-blue-950/40"
            >
              {enviando ? 'Guardando...' : equipoEditar ? 'Guardar Cambios' : 'Registrar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
