import React, { useState, useEffect } from 'react';
import {
  ICategoriaEvento,
  ICrearCategoriaEventoDTO,
  IActualizarCategoriaEventoDTO,
  TipoEvento,
  categoriaEventoService,
} from '../../services/categoriaEvento.service';

interface FormCategoriaEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoriaAEditar?: ICategoriaEvento | null;
  facultadId?: number;
  carreraId?: number;
}

export const FormCategoriaEventoModal: React.FC<FormCategoriaEventoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoriaAEditar,
  facultadId,
  carreraId,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requiereAprobacion, setRequiereAprobacion] = useState(false);
  const [permiteInscripcionForm, setPermiteInscripcionForm] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaAEditar) {
      setNombre(categoriaAEditar.nombre || '');
      setDescripcion(categoriaAEditar.descripcion || '');
      setRequiereAprobacion(categoriaAEditar.requiereAprobacion ?? false);
      setPermiteInscripcionForm(categoriaAEditar.permiteInscripcionForm ?? true);
    } else {
      setNombre('');
      setDescripcion('');
      setRequiereAprobacion(false);
      setPermiteInscripcionForm(true);
    }
    setErrorMsg(null);
  }, [categoriaAEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (categoriaAEditar) {
        const dto: IActualizarCategoriaEventoDTO = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          tipo: TipoEvento.ACADEMICO,
          requiereAprobacion,
          permiteInscripcionForm,
        };
        await categoriaEventoService.actualizar(categoriaAEditar.id, dto);
      } else {
        const dto: ICrearCategoriaEventoDTO = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          tipo: TipoEvento.ACADEMICO,
          requiereAprobacion,
          permiteInscripcionForm,
        };

        if (typeof facultadId === 'number' && !isNaN(facultadId) && facultadId > 0) {
          dto.facultadId = facultadId;
        }
        if (typeof carreraId === 'number' && !isNaN(carreraId) && carreraId > 0) {
          dto.carreraId = carreraId;
        }

        await categoriaEventoService.crear(dto);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const apiResponse = err?.response?.data;
      if (apiResponse?.message) {
        const msg = Array.isArray(apiResponse.message)
          ? apiResponse.message.join(' | ')
          : apiResponse.message;
        setErrorMsg(msg);
      } else {
        setErrorMsg(err.message || 'Error de conexión con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <h2 className="text-base font-bold text-white">
                {categoriaAEditar ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-[11px] text-gray-400">
                Gestión de categorías para actividades académicas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Campeonato, Taller, Conferencia"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Tipo de Evento
            </label>
            <div className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 flex items-center justify-between select-none">
              <span className="flex items-center gap-2">
                🎓 <span>Académico</span>
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                Predeterminado
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción breve de la categoría..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={permiteInscripcionForm}
                onChange={(e) => setPermiteInscripcionForm(e.target.checked)}
                className="rounded border-gray-800 bg-gray-950 text-blue-600 focus:ring-0"
              />
              Permite inscripciones públicas/formulario
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={requiereAprobacion}
                onChange={(e) => setRequiereAprobacion(e.target.checked)}
                className="rounded border-gray-800 bg-gray-950 text-blue-600 focus:ring-0"
              />
              Requiere aprobación previa de coordinadores
            </label>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              {loading ? 'Guardando...' : categoriaAEditar ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
