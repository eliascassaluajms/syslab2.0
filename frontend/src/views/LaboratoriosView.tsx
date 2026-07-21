import React, { useState, useEffect } from 'react';
import { httpClient as api } from '../services/httpClient';

interface Laboratorio {
  id: number;
  codigo: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  descripcion: string;
  activo: boolean;
}

export const LaboratoriosView: React.FC = () => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados Modal
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [labEditar, setLabEditar] = useState<Laboratorio | null>(null);
  
  // Campos del Formulario
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [ubicacion, setUbicacion] = useState<string>('');
  const [capacidad, setCapacidad] = useState<number>(20);
  const [descripcion, setDescripcion] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Cargar Laboratorios desde Backend
  const cargarLaboratorios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/laboratorios');
      setLaboratorios(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener la lista de laboratorios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLaboratorios();
  }, []);

  // Abrir Modal para Crear o Modificar
  const handleAbrirModal = (lab?: Laboratorio) => {
    if (lab) {
      setLabEditar(lab);
      setCodigo(lab.codigo);
      setNombre(lab.nombre);
      setUbicacion(lab.ubicacion || '');
      setCapacidad(lab.capacidad || 0);
      setDescripcion(lab.descripcion || '');
    } else {
      setLabEditar(null);
      setCodigo('');
      setNombre('');
      setUbicacion('');
      setCapacidad(20);
      setDescripcion('');
    }
    setModalAbierto(true);
  };

  // Guardar (Crear o Editar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) return;
    setGuardando(true);

    const payload = { codigo, nombre, ubicacion, capacidad, descripcion };

    try {
      if (labEditar) {
        await api.put(`/laboratorios/${labEditar.id}`, payload);
      } else {
        await api.post('/laboratorios', payload);
      }
      setModalAbierto(false);
      await cargarLaboratorios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar los datos del laboratorio.');
    } finally {
      setGuardando(false);
    }
  };

  // 🟢 ELIMINACIÓN LÓGICA / CAMBIO DE ESTADO (Activo <-> Inactivo)
  const handleToggleEstado = async (lab: Laboratorio) => {
    const accion = lab.activo ? 'desactivar (eliminar lógicamente)' : 'reactivar';
    const confirmacion = window.confirm(`¿Está seguro de ${accion} el laboratorio "${lab.nombre}"?`);
    if (!confirmacion) return;

    try {
      await api.patch(`/laboratorios/${lab.id}/estado`, { activo: !lab.activo });
      await cargarLaboratorios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado del laboratorio.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="border-b border-gray-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>🔬</span> Gestión de Laboratorios
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Administración de ambientes de práctica, equipamiento e infraestructura universitaria.
          </p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          ➕ Nuevo Laboratorio
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Tabla de Laboratorios */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="py-4 px-6">Código</th>
              <th className="py-4 px-6">Nombre del Laboratorio</th>
              <th className="py-4 px-6">Ubicación</th>
              <th className="py-4 px-6 text-center">Capacidad</th>
              <th className="py-4 px-6 text-center">Estado (Lógico)</th>
              <th className="py-4 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {laboratorios.length > 0 ? (
              laboratorios.map((lab) => (
                <tr key={lab.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-4 px-6 text-blue-400 font-mono text-xs font-bold">{lab.codigo}</td>
                  <td className="py-4 px-6 font-semibold text-white">
                    {lab.nombre}
                    {lab.descripcion && (
                      <p className="text-[11px] text-gray-500 font-normal">{lab.descripcion}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-xs">{lab.ubicacion || 'Sin asignar'}</td>
                  <td className="py-4 px-6 text-center font-mono text-xs text-gray-300">
                    {lab.capacidad} PCs / Estaciones
                  </td>

                  {/* Estado Lógico */}
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        lab.activo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {lab.activo ? '🟢 Activo' : '🔴 Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-center space-x-2">
                    <button
                      onClick={() => handleAbrirModal(lab)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      ✏️ Modificar
                    </button>
                    <button
                      onClick={() => handleToggleEstado(lab)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
                        lab.activo
                          ? 'text-red-400 hover:bg-red-500/10 border-red-500/30'
                          : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      {lab.activo ? '🗑️ Desactivar' : '🔄 Reactivar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-xs italic">
                  No hay laboratorios registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Modificar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-white">
            <h3 className="text-lg font-bold border-b border-gray-800 pb-3">
              {labEditar ? '✏️ Modificar Laboratorio' : '➕ Registrar Nuevo Laboratorio'}
            </h3>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. LAB-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                    Capacidad (PCs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={capacidad}
                    onChange={(e) => setCapacidad(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                  Nombre del Laboratorio *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Laboratorio de Redes y Seguridad"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                  Ubicación Física
                </label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Campus Pajoso - Bloque B"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">
                  Descripción u Observaciones
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-20"
                  placeholder="Especificaciones o equipamiento del aula..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Laboratorio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};