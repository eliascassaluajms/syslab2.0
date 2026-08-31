import React, { useState, useEffect } from 'react';
import {
  ICategoriaEvento,
  ICrearCategoriaEventoDTO,
  TipoEvento,
  categoriaEventoService,
} from '../services/categoriaEvento.service';
import { useCatalogos } from '../hooks/useCatalogos';
import { useAuth } from '../context/AuthContext';
import { FormCategoriaEventoModal } from '../components/eventos/FormCategoriaEventoModal';
import { ModalConfirmarEliminacion } from '../components/common/ModalConfirmarEliminacion';

const CATEGORIAS_BASE_PREDETERMINADAS = [
  { nombre: 'Congreso', tipo: TipoEvento.ACADEMICO, descripcion: 'Congresos y simposios académicos regionales/internacionales.' },
  { nombre: 'Curso / Taller', tipo: TipoEvento.ACADEMICO, descripcion: 'Capacitaciones prácticas, workshops y laboratorios guiados.' },
  { nombre: 'Webinar / Conferencia', tipo: TipoEvento.ACADEMICO, descripcion: 'Charlas virtuales y exposiciones magistrales.' },
  { nombre: 'Jornada Técnica / Seminario', tipo: TipoEvento.ACADEMICO, descripcion: 'Seminarios y presentaciones técnicas especializadas.' },
  { nombre: 'Defensa de Tesis / Proyecto', tipo: TipoEvento.ACADEMICO, descripcion: 'Sustentación de trabajos de grado y proyectos finales.' },
];

export const CategoriasEventosView: React.FC = () => {
  const { user } = useAuth();
  const { facultades, carreras, facultadId, setFacultadId, carreraId, setCarreraId, cargandoCatalogos } = useCatalogos();

  const [categorias, setCategorias] = useState<ICategoriaEvento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isModalFormOpen, setIsModalFormOpen] = useState<boolean>(false);
  const [categoriaAEditar, setCategoriaAEditar] = useState<ICategoriaEvento | null>(null);

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState<boolean>(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<ICategoriaEvento | null>(null);

  // Extraer el ámbito asignado directamente del usuario en sesión (JWT / Contexto)
  const usuarioAny = user as any;
  const primeraAsignacion = usuarioAny?.asignacionesAmbito?.[0] || usuarioAny?.asignacionesRoles?.[0] || usuarioAny?.asignaciones?.[0];

  const idFacultadAsignada = primeraAsignacion?.facultadId || usuarioAny?.facultadId;
  const idCarreraAsignada = primeraAsignacion?.carreraId || usuarioAny?.carreraId;

  // Eliminar duplicados si existen en el array de carreras
  const carrerasUnicas = carreras.filter(
    (carrera, index, self) => index === self.findIndex((c) => c.id === carrera.id || c.nombre.trim().toLowerCase() === carrera.nombre.trim().toLowerCase())
  );

  // Sincronización estricta priorizando el ámbito del usuario autenticado
  useEffect(() => {
    if (idFacultadAsignada && facultadId !== Number(idFacultadAsignada)) {
      setFacultadId(Number(idFacultadAsignada));
    } else if (!facultadId && facultades.length > 0) {
      setFacultadId(facultades[0].id);
    }
  }, [facultades, idFacultadAsignada, facultadId, setFacultadId]);

  useEffect(() => {
    if (idCarreraAsignada && carreraId !== Number(idCarreraAsignada)) {
      setCarreraId(Number(idCarreraAsignada));
    } else if (!carreraId && carrerasUnicas.length > 0) {
      // Si el usuario no tiene carrera asignada en su ámbito, buscar por defecto Ingeniería Informática o la primera disponible
      const carreraDefault = carrerasUnicas.find(c => c.nombre.toLowerCase().includes('informática')) || carrerasUnicas[0];
      setCarreraId(carreraDefault.id);
    }
  }, [carrerasUnicas, idCarreraAsignada, carreraId, setCarreraId]);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const activeFacultad = facultadId ? Number(facultadId) : undefined;
      const activeCarrera = carreraId ? Number(carreraId) : undefined;

      const res = await categoriaEventoService.listar(activeFacultad, activeCarrera);
      const lista = Array.isArray(res) ? res : (res as any)?.data || [];
      setCategorias(lista);
    } catch (error) {
      console.error('Error al cargar categorías de eventos:', error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, [facultadId, carreraId]);

  const handleAbrirCrear = () => {
    setCategoriaAEditar(null);
    setIsModalFormOpen(true);
  };

  const handleAbrirEditar = (cat: ICategoriaEvento) => {
    setCategoriaAEditar(cat);
    setIsModalFormOpen(true);
  };

  const handleAbrirEliminar = (cat: ICategoriaEvento) => {
    setCategoriaAEliminar(cat);
    setIsModalDeleteOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!categoriaAEliminar) return;
    try {
      await categoriaEventoService.eliminar(categoriaAEliminar.id);
      await cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  };

  const handlePrecargarBase = async () => {
    setLoading(true);
    try {
      const facIdNum = facultadId ? Number(facultadId) : undefined;
      const carIdNum = carreraId ? Number(carreraId) : undefined;

      for (const cat of CATEGORIAS_BASE_PREDETERMINADAS) {
        const payload: ICrearCategoriaEventoDTO = {
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          tipo: TipoEvento.ACADEMICO,
          requiereAprobacion: false,
          permiteInscripcionForm: true,
        };

        if (typeof facIdNum === 'number' && !isNaN(facIdNum) && facIdNum > 0) {
          payload.facultadId = facIdNum;
        }
        if (typeof carIdNum === 'number' && !isNaN(carIdNum) && carIdNum > 0) {
          payload.carreraId = carIdNum;
        }

        await categoriaEventoService.crear(payload);
      }
      await cargarCategorias();
    } catch (error: any) {
      console.error('Error al precargar categorías base:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const listaSegura = Array.isArray(categorias) ? categorias : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-5 rounded-2xl border border-gray-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🏷️ Gestor de Categorías de Eventos
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Administre las categorías asociadas al ámbito académico asignado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Facultad
            </label>
            <select
              value={facultadId || ''}
              onChange={(e) => setFacultadId(Number(e.target.value) || undefined)}
              disabled={cargandoCatalogos || Boolean(idFacultadAsignada)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar Facultad...</option>
              {facultades.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Carrera
            </label>
            <select
              value={carreraId || ''}
              onChange={(e) => setCarreraId(Number(e.target.value) || undefined)}
              disabled={cargandoCatalogos || Boolean(idCarreraAsignada)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar Carrera...</option>
              {carrerasUnicas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-900/80 px-3.5 py-2 rounded-xl border border-gray-800 text-xs text-gray-400">
          <span>🎓 Ámbito de Evento:</span>
          <span className="font-semibold text-blue-400">Académico</span>
        </div>

        <button
          onClick={handleAbrirCrear}
          disabled={!carreraId && !facultadId}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Nueva Categoría
        </button>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Cargando categorías...</div>
        ) : listaSegura.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-gray-400 text-xs">No hay categorías registradas en esta unidad académica.</p>
            <button
              onClick={handlePrecargarBase}
              disabled={!carreraId && !facultadId}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-blue-400 text-xs font-medium rounded-xl border border-gray-700 transition cursor-pointer"
            >
              ⚡ Precargar categorías estándar (Congreso, Taller, Webinar, Seminario, Tesis)
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 uppercase text-[10px] font-bold text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4">Nombre</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {listaSegura.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-4 font-semibold text-white">{cat.nombre}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold">
                      {cat.tipo}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 max-w-md truncate">{cat.descripcion || 'Sin descripción'}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cat.estado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {cat.estado ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleAbrirEditar(cat)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleAbrirEliminar(cat)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FormCategoriaEventoModal
        isOpen={isModalFormOpen}
        onClose={() => setIsModalFormOpen(false)}
        onSuccess={cargarCategorias}
        categoriaAEditar={categoriaAEditar}
        facultadId={facultadId ? Number(facultadId) : undefined}
        carreraId={carreraId ? Number(carreraId) : undefined}
      />

      <ModalConfirmarEliminacion
        modalAbierto={isModalDeleteOpen}
        onClose={() => setIsModalDeleteOpen(false)}
        onConfirmar={handleConfirmarEliminar}
        titulo="Eliminar Categoría"
        mensaje={`¿Está seguro de eliminar la categoría "${categoriaAEliminar?.nombre || ''}"?`}
      />
    </div>
  );
};