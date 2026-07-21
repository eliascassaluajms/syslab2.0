import React, { useState, useEffect } from 'react';
import { Can } from '../components/common/Can';
import { httpClient as api } from '../services/httpClient';

interface Facultad {
  id: number;
  nombre: string;
  sigla: string;
  _count?: { carreras: number };
}

interface Carrera {
  id: number;
  nombre: string;
  sigla: string;
  facultadId: number;
  facultad?: { id: number; nombre: string; sigla: string };
}

export const CatalogosView: React.FC = () => {
  // Pestaña activa: 'facultades' | 'carreras'
  const [tabActiva, setTabActiva] = useState<'facultades' | 'carreras'>('facultades');

  // Datos
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Modales
  const [modalFacultad, setModalFacultad] = useState<boolean>(false);
  const [modalCarrera, setModalCarrera] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Formulario Facultad
  const [nombreFacultad, setNombreFacultad] = useState<string>('');
  const [siglaFacultad, setSiglaFacultad] = useState<string>('');

  // Formulario Carrera
  const [nombreCarrera, setNombreCarrera] = useState<string>('');
  const [siglaCarrera, setSiglaCarrera] = useState<string>('');
  const [facultadIdSeleccionada, setFacultadIdSeleccionada] = useState<number | ''>('');

  // Cargar Catálogos Iniciales
  const cargarCatalogos = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🟢 Reemplazado fetch por api.get
      const resFacultades = await api.get('/catalogos/facultades');
      setFacultades(resFacultades.data?.data || []);

      const resCarreras = await api.get('/catalogos/carreras');
      setCarreras(resCarreras.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la información institucional.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Guardar Nueva Facultad
  const handleCrearFacultad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreFacultad.trim()) return;
    setGuardando(true);

    try {
      // 🟢 Reemplazado fetch por api.post
      await api.post('/catalogos/facultades', {
        nombre: nombreFacultad,
        sigla: siglaFacultad,
      });

      setNombreFacultad('');
      setSiglaFacultad('');
      setModalFacultad(false);
      await cargarCatalogos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la facultad.');
    } finally {
      setGuardando(false);
    }
  };

  // Guardar Nueva Carrera
  const handleCrearCarrera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCarrera.trim() || !facultadIdSeleccionada) return;
    setGuardando(true);

    try {
      // 🟢 Reemplazado fetch por api.post
      await api.post('/catalogos/carreras', {
        nombre: nombreCarrera,
        sigla: siglaCarrera,
        facultadId: Number(facultadIdSeleccionada),
      });

      setNombreCarrera('');
      setSiglaCarrera('');
      setFacultadIdSeleccionada('');
      setModalCarrera(false);
      await cargarCatalogos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la carrera.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs text-gray-400 tracking-wider animate-pulse">Cargando catálogos de UAJMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="border-b border-gray-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">🏢</span> Catálogos Institucionales
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión de la estructura orgánica: Facultades y Carreras universitarias
          </p>
        </div>

        {/* Acciones según la pestaña activa */}
        <Can permiso="catalogos:crear">
          {tabActiva === 'facultades' ? (
            <button
              onClick={() => setModalFacultad(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30"
            >
              ➕ Nueva Facultad
            </button>
          ) : (
            <button
              onClick={() => setModalCarrera(true)}
              disabled={facultades.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➕ Nueva Carrera
            </button>
          )}
        </Can>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm font-medium text-red-400 flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Navegación por Pestañas (Tabs) */}
      <div className="flex border-b border-gray-800 space-x-2">
        <button
          onClick={() => setTabActiva('facultades')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            tabActiva === 'facultades'
              ? 'border-blue-500 text-blue-400 bg-gray-900/80'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Facultades ({facultades.length})
        </button>

        <button
          onClick={() => setTabActiva('carreras')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            tabActiva === 'carreras'
              ? 'border-blue-500 text-blue-400 bg-gray-900/80'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Carreras ({carreras.length})
        </button>
      </div>

      {/* TAB 1: TABLA DE FACULTADES */}
      {tabActiva === 'facultades' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Nombre de Facultad</th>
                  <th className="py-4 px-6">Sigla</th>
                  <th className="py-4 px-6 text-center">Carreras Registradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {facultades.length > 0 ? (
                  facultades.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6 text-gray-500 font-mono text-xs">#{f.id}</td>
                      <td className="py-4 px-6 font-semibold text-white">{f.nombre}</td>
                      <td className="py-4 px-6 font-mono text-xs text-blue-400 font-bold">{f.sigla || '-'}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {f._count?.carreras ?? carreras.filter((c) => c.facultadId === f.id).length} carrera(s)
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-xs italic">
                      No hay facultades creadas. Haz clic en "Nueva Facultad" para iniciar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TABLA DE CARRERAS */}
      {tabActiva === 'carreras' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Nombre de Carrera</th>
                  <th className="py-4 px-6">Sigla</th>
                  <th className="py-4 px-6">Facultad Perteneciente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {carreras.length > 0 ? (
                  carreras.map((c) => {
                    const facultad = facultades.find((f) => f.id === c.facultadId) || c.facultad;
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-6 text-gray-500 font-mono text-xs">#{c.id}</td>
                        <td className="py-4 px-6 font-semibold text-white">{c.nombre}</td>
                        <td className="py-4 px-6 font-mono text-xs text-purple-400 font-bold">{c.sigla || '-'}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {facultad ? facultad.nombre : `Facultad #${c.facultadId}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-xs italic">
                      No hay carreras registradas. Asegúrate de tener al menos una Facultad antes de crear Carreras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR FACULTAD */}
      {modalFacultad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏢</span> Registrar Nueva Facultad
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Estructura superior institucional UAJMS.
              </p>
            </div>

            <form onSubmit={handleCrearFacultad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Nombre de la Facultad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Facultad de Ciencias y Tecnología"
                  value={nombreFacultad}
                  onChange={(e) => setNombreFacultad(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Sigla o Abreviatura
                </label>
                <input
                  type="text"
                  placeholder="Ej. FICYT"
                  value={siglaFacultad}
                  onChange={(e) => setSiglaFacultad(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalFacultad(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {guardando ? 'Guardando...' : 'Guardar Facultad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CARRERA */}
      {modalCarrera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎓</span> Registrar Nueva Carrera
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Asocie la carrera a una Facultad previamente registrada.
              </p>
            </div>

            <form onSubmit={handleCrearCarrera} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Facultad de Pertenencia *
                </label>
                <select
                  required
                  value={facultadIdSeleccionada}
                  onChange={(e) => setFacultadIdSeleccionada(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Seleccionar Facultad --</option>
                  {facultades.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre} ({f.sigla || `#${f.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Nombre de la Carrera *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ingeniería Informática"
                  value={nombreCarrera}
                  onChange={(e) => setNombreCarrera(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Sigla de Carrera
                </label>
                <input
                  type="text"
                  placeholder="Ej. INF"
                  value={siglaCarrera}
                  onChange={(e) => setSiglaCarrera(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalCarrera(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {guardando ? 'Guardando...' : 'Guardar Carrera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};