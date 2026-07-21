import { useState, useEffect, useCallback } from 'react';
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

/**
 * Custom Hook: useCatalogos
 * Gestiona el catálogo de Facultades y Carreras universitarias (UAJMS).
 */
export const useCatalogos = () => {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Carga sincronizada de catálogos
  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resFac, resCar] = await Promise.all([
        httpClient.get('/facultades'),
        httpClient.get('/carreras'),
      ]);
      setFacultades(resFac.data.data || resFac.data || []);
      setCarreras(resCar.data.data || resCar.data || []);
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

  // ================= OPERACIONES CRUD FACULTADES =================
  const crearFacultad = async (nombre: string, codigo?: string) => {
    setError(null);
    try {
      await httpClient.post('/facultades', { nombre, codigo });
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
      await httpClient.put(`/facultades/${id}`, { nombre, codigo });
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
      await httpClient.delete(`/facultades/${id}`);
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al eliminar la facultad.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  // ================= OPERACIONES CRUD CARRERAS =================
  const crearCarrera = async (nombre: string, facultadId: number) => {
    setError(null);
    try {
      await httpClient.post('/carreras', { nombre, facultadId });
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
      await httpClient.put(`/carreras/${id}`, { nombre, facultadId });
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
      await httpClient.delete(`/carreras/${id}`);
      await cargarCatalogos();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al eliminar la carrera.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  return {
    facultades,
    carreras,
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