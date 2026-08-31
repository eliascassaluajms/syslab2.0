import React, { useState, useEffect } from 'react';
import { Can } from '../components/common/Can';
import { useAuth } from '../hooks/useAuth';
import { httpClient as api } from '../services/httpClient';

// Alineado con Prisma Schema
interface Facultad {
  id: number;
  nombre: string;
  sigla: string;
  _count?: { carreras: number };
}

interface Carrera {
  id: number;
  nombre: string;
  descripcion?: string | null;
  facultadId: number;
  facultad?: { id: number; nombre: string; sigla: string };
}

export const CatalogosView: React.FC = () => {
  const { user } = useAuth();

  const [tabActiva, setTabActiva] = useState<'facultades' | 'carreras'>('facultades');

  // Datos
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro
  const [facultadFiltroId, setFacultadFiltroId] = useState<number | ''>('');

  // Modales y Formulario
  const [modalFacultad, setModalFacultad] = useState<boolean>(false);
  const [modalCarrera, setModalCarrera] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  const [nombreFacultad, setNombreFacultad] = useState<string>('');
  const [siglaFacultad, setSiglaFacultad] = useState<string>('');

  const [nombreCarrera, setNombreCarrera] = useState<string>('');
  const [facultadIdSeleccionada, setFacultadIdSeleccionada] = useState<number | ''>('');

  // Extraer datos de respuesta de forma segura
  const extractData = (res: any) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  };

  const cargarCatalogos = async () => {
    setLoading(true);
    setError(null);
    try {
      const esAdmin = user?.rol === 'Administrador';
      const tienePermisoFacultades = esAdmin || user?.permisos?.includes('facultades:listar');
      const tienePermisoCarreras = esAdmin || user?.permisos?.includes('carreras:listar');

      const peticiones = [];

      if (tienePermisoFacultades) {
        peticiones.push(api.get('/catalogos/facultades'));
      } else {
        peticiones.push(Promise.resolve({ data: [] }));
      }

      if (tienePermisoCarreras) {
        peticiones.push(api.get('/catalogos/carreras'));
      } else {
        peticiones.push(Promise.resolve({ data: [] }));
      }

      const [resFacultades, resCarreras] = await Promise.all(peticiones);

      setFacultades(extractData(resFacultades));
      setCarreras(extractData(resCarreras));

      if (!tienePermisoFacultades && tienePermisoCarreras) {
        setTabActiva('carreras');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la información institucional.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const handleCrearFacultad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreFacultad.trim() || !siglaFacultad.trim()) return;
    setGuardando(true);
    setError(null);

    try {
      await api.post('/catalogos/facultades', {
        nombre: nombreFacultad.trim(),
        sigla: siglaFacultad.trim().toUpperCase(),
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

  const handleCrearCarrera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCarrera.trim() || !facultadIdSeleccionada) return;
    setGuardando(true);
    setError(null);

    try {
      await api.post('/catalogos/carreras', {
        nombre: nombreCarrera.trim(),
        facultadId: Number(facultadIdSeleccionada),
      });

      setNombreCarrera('');
      setFacultadIdSeleccionada('');
      setModalCarrera(false);
      await cargarCatalogos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la carrera.');
    } finally {
      setGuardando(false);
    }
  };

  const carrerasFiltradas = facultadFiltroId
    ? carreras.filter((c) => c.facultadId === Number(facultadFiltroId))
    : carreras;

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
      {/* Encabezado */}
      <div className="border-b border-gray-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">🏢</span> Catálogos Institucionales
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión de la estructura orgánica: Facultades y Carreras universitarias
          </p>
        </div>

        {tabActiva === 'facultades' && (
          <Can permiso="facultades:crear">
            <button
              onClick={() => { setError(null); setModalFacultad(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30"
            >
              ➕ Nueva Facultad
            </button>
          </Can>
        )}

        {tabActiva === 'carreras' && (
          <Can permiso="carreras:crear">
            <button
              onClick={() => { setError(null); setModalCarrera(true); }}
              disabled={facultades.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➕ Nueva Carrera
            </button>
          </Can>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm font-medium text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-red-400 hover:underline">
            Descartar
          </button>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-gray-800 space-x-2">
        <Can permiso="facultades:listar">
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
        </Can>

        <Can permiso="carreras:listar">
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
        </Can>
      </div>

      {/* TAB 1: FACULTADES */}
      {tabActiva === 'facultades' && (
        <Can permiso="facultades:listar" fallback={<div className="bg-gray-900 p-8 text-center text-gray-400 text-sm border border-gray-800 rounded-2xl">🚫 No posee permisos para listar facultades.</div>}>
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
                        <td className="py-4 px-6 font-mono text-xs text-blue-400 font-bold">{f.sigla}</td>
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
                        No hay facultades creadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Can>
      )}

      {/* TAB 2: CARRERAS */}
      {tabActiva === 'carreras' && (
        <Can permiso="carreras:listar" fallback={<div className="bg-gray-900 p-8 text-center text-gray-400 text-sm border border-gray-800 rounded-2xl">🚫 No posee permisos para listar carreras.</div>}>
          <div className="space-y-4">
            {/* Filtro dinámico por facultad */}
            <div className="flex items-center gap-3 bg-gray-900/90 p-3.5 border border-gray-800 rounded-xl">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtrar por Facultad:</label>
              <select
                value={facultadFiltroId}
                onChange={(e) => setFacultadFiltroId(e.target.value ? Number(e.target.value) : '')}
                className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg p-2 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[240px]"
              >
                <option value="">-- Todas las Facultades --</option>
                {facultades.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} ({f.sigla})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Nombre de Carrera</th>
                      <th className="py-4 px-6">Facultad Perteneciente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-sm">
                    {carrerasFiltradas.length > 0 ? (
                      carrerasFiltradas.map((c) => {
                        const facultad = facultades.find((f) => f.id === c.facultadId) || c.facultad;
                        return (
                          <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="py-4 px-6 text-gray-500 font-mono text-xs">#{c.id}</td>
                            <td className="py-4 px-6 font-semibold text-white">{c.nombre}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {facultad ? `${facultad.nombre} (${facultad.sigla})` : `Facultad #${c.facultadId}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500 text-xs italic">
                          {facultadFiltroId ? 'No hay carreras registradas para la facultad seleccionada.' : 'No hay carreras registradas.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Can>
      )}

      {/* MODAL: REGISTRAR FACULTAD */}
      {modalFacultad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-white">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏢</span> Registrar Nueva Facultad
              </h3>
            </div>

            <form onSubmit={handleCrearFacultad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Nombre de la Facultad *
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
                  Sigla o Abreviatura *
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="Ej. FICYT"
                  value={siglaFacultad}
                  onChange={(e) => setSiglaFacultad(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Seleccionar Facultad --</option>
                  {facultades.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre} ({f.sigla})
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