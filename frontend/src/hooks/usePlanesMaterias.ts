import { useState, useEffect, useCallback, useMemo } from 'react';
import { planesMateriasService } from '../services/planesMaterias.service';
import { useCatalogos } from './useCatalogos';

export const usePlanesMaterias = () => {
  const { facultades, carreras, loading: loadingCatalogos } = useCatalogos();
  
  const [facultadIdSeleccionada, setFacultadIdSeleccionada] = useState<number | ''>('');
  const [carreraIdSeleccionada, setCarreraIdSeleccionada] = useState<number | ''>('');
  
  const [planes, setPlanes] = useState<any[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<any | null>(null);
  const [materias, setMaterias] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState<boolean>(false);

  // Memoizar carrerasFiltradas para evitar bucles de renderizado por cambio de referencias
  const carrerasFiltradas = useMemo(() => {
    if (!facultadIdSeleccionada) return [];
    return carreras.filter(c => Number(c.facultadId) === Number(facultadIdSeleccionada));
  }, [carreras, facultadIdSeleccionada]);

  // Autoseleccionar la primera facultad disponible
  useEffect(() => {
    if (facultades.length > 0 && !facultadIdSeleccionada) {
      setFacultadIdSeleccionada(facultades[0].id);
    }
  }, [facultades, facultadIdSeleccionada]);

  // Autoseleccionar la primera carrera de la facultad activa
  useEffect(() => {
    if (carrerasFiltradas.length > 0) {
      const existeSeleccion = carrerasFiltradas.some(c => Number(c.id) === Number(carreraIdSeleccionada));
      if (!carreraIdSeleccionada || !existeSeleccion) {
        setCarreraIdSeleccionada(carrerasFiltradas[0].id);
      }
    } else {
      setCarreraIdSeleccionada('');
      setPlanes([]);
      setPlanSeleccionado(null);
      setMaterias([]);
    }
  }, [carrerasFiltradas, carreraIdSeleccionada]);

  // Cargar planes de estudio al cambiar la carrera seleccionada
  const cargarPlanes = useCallback(async (carreraId: number) => {
    try {
      setLoadingDatos(true);
      const data = await planesMateriasService.listarPlanesPorCarrera(carreraId);
      const planesLista = Array.isArray(data) ? data : [];
      setPlanes(planesLista);
      
      if (planesLista.length > 0) {
        setPlanSeleccionado(planesLista[0]);
      } else {
        setPlanSeleccionado(null);
        setMaterias([]);
      }
    } catch (error) {
      console.error('Error al cargar planes de estudio:', error);
      setPlanes([]);
      setPlanSeleccionado(null);
      setMaterias([]);
    } finally {
      setLoadingDatos(false);
    }
  }, []);

  useEffect(() => {
    if (carreraIdSeleccionada) {
      cargarPlanes(Number(carreraIdSeleccionada));
    } else {
      setPlanes([]);
      setPlanSeleccionado(null);
      setMaterias([]);
    }
  }, [carreraIdSeleccionada, cargarPlanes]);

  // Cargar materias al seleccionar un plan
  const cargarMaterias = useCallback(async (planId: number) => {
    try {
      const data = await planesMateriasService.listarMateriasPorPlan(planId);
      setMaterias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setMaterias([]);
    }
  }, []);

  useEffect(() => {
    if (planSeleccionado?.id) {
      cargarMaterias(planSeleccionado.id);
    } else {
      setMaterias([]);
    }
  }, [planSeleccionado, cargarMaterias]);

  const seleccionarFacultad = (id: number | '') => {
    setFacultadIdSeleccionada(id);
    setCarreraIdSeleccionada('');
    setPlanes([]);
    setPlanSeleccionado(null);
    setMaterias([]);
  };

  return {
    facultades,
    carrerasFiltradas,
    facultadIdSeleccionada,
    carreraIdSeleccionada,
    seleccionarFacultad,
    setCarreraIdSeleccionada,
    planes,
    planSeleccionado,
    setPlanSeleccionado,
    materias,
    loading: loadingCatalogos || loadingDatos,
    recargarPlanes: () => carreraIdSeleccionada && cargarPlanes(Number(carreraIdSeleccionada)),
    recargarMaterias: () => planSeleccionado?.id && cargarMaterias(planSeleccionado.id)
  };
};
