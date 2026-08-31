import { useState, useEffect, useCallback, useMemo } from 'react';
import { httpClient } from '../services/httpClient';

export interface Facultad {
  id: number;
  nombre: string;
  codigo?: string;
  _count?: {
    carreras?: number;
    usuarioFacultades?: number;
  };
}

export interface Carrera {
  id: number;
  nombre: string;
  facultadId: number;
  facultad?: Facultad;
}

export const useCatalogos = () => {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de selección dinámica
  const [facultadId, setFacultadIdState] = useState<number | undefined>(undefined);
  const [carreraId, setCarreraIdState] = useState<number | undefined>(undefined);

  // Funciones de actualización memorizadas con useCallback para evitar fallos de referencia
  const setFacultadId = useCallback((id?: number) => {
    setFacultadIdState(id);
    setCarreraIdState(undefined);
  }, []);

  const setCarreraId = useCallback((id?: number) => {
    setCarreraIdState(id);
  }, []);

  // Carga sincronizada de catálogos
  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resFac, resCar] = await Promise.all([
        httpClient.get('/catalogos/facultades'),
        httpClient.get('/catalogos/carreras'),
      ]);
      setFacultades(Array.isArray(resFac.data) ? resFac.data : (resFac.data.data?.facultades || resFac.data.data || []));
      setCarreras(Array.isArray(resCar.data) ? resCar.data : (resCar.data.data?.carreras || resCar.data.data || []));
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al cargar catálogos institucionales.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Filtrar carreras automáticamente según la facultad seleccionada
  const carrerasFiltradas = useMemo(() => {
    if (!facultadId) return carreras;
    return carreras.filter((c) => c.facultadId === facultadId);
  }, [carreras, facultadId]);

  // ================= OPERACIONES CRUD =================
  const crearFacultad = async (nombre: string, codigo?: string) => {
    setError(null);
    try {
      await httpClient.post('/catalogos/facultades', { nombre, codigo });
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al crear la facultad.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const actualizarFacultad = async (id: number, nombre: string, codigo?: string) => {
    setError(null);
    try {
      await httpClient.put(`/catalogos/facultades/${id}`, { nombre, codigo });
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar la facultad.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const eliminarFacultad = async (id: number) => {
    setError(null);
    try {
      await httpClient.delete(`/catalogos/facultades/${id}`);
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al eliminar la facultad.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const crearCarrera = async (nombre: string, facultadId: number) => {
    setError(null);
    try {
      await httpClient.post('/catalogos/carreras', { nombre, facultadId });
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al crear la carrera.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const actualizarCarrera = async (id: number, nombre: string, facultadId: number) => {
    setError(null);
    try {
      await httpClient.put(`/catalogos/carreras/${id}`, { nombre, facultadId });
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar la carrera.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const eliminarCarrera = async (id: number) => {
    setError(null);
    try {
      await httpClient.delete(`/catalogos/carreras/${id}`);
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al eliminar la carrera.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  return {
    facultades,
    carreras: carrerasFiltradas,
    facultadId,
    setFacultadId,
    carreraId,
    setCarreraId,
    cargandoCatalogos: loading,
    loading,
    error,
    cargarCatalogos,
    crearFacultad,
    actualizarFacultad,
    eliminarFacultad,
    crearCarrera,
    actualizarCarrera,
    eliminarCarrera,
  };
};
