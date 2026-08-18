// frontend/src/hooks/usePlanesMaterias.ts
import { useState, useEffect, useCallback } from 'react';
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

  // Carreras filtradas según la facultad seleccionada en cascada
  const carrerasFiltradas = facultadIdSeleccionada 
    ? carreras.filter(c => c.facultadId === Number(facultadIdSeleccionada))
    : [];

  // Autoseleccionar la primera facultad y carrera por defecto si están vacías
  useEffect(() => {
    if (facultades.length > 0 && !facultadIdSeleccionada) {
      setFacultadIdSeleccionada(facultades[0].id);
    }
  }, [facultades, facultadIdSeleccionada]);

  useEffect(() => {
    if (carrerasFiltradas.length > 0 && (!carreraIdSeleccionada || !carrerasFiltradas.some(c => c.id === carreraIdSeleccionada))) {
      setCarreraIdSeleccionada(carrerasFiltradas[0].id);
    } else if (carrerasFiltradas.length === 0) {
      setCarreraIdSeleccionada('');
    }
  }, [carrerasFiltradas, carreraIdSeleccionada]);

  // Cargar planes de estudio al cambiar la carrera seleccionada
  const cargarPlanes = useCallback(async (carreraId: number) => {
    try {
      setLoadingDatos(true);
      const data = await planesMateriasService.listarPlanesPorCarrera(carreraId);
      setPlanes(data);
      if (data.length > 0) {
        setPlanSeleccionado(data[0]);
      } else {
        setPlanSeleccionado(null);
        setMaterias([]);
      }
    } catch (error) {
      console.error('Error al cargar planes de estudio:', error);
      setPlanes([]);
      setPlanSeleccionado(null);
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
      setMaterias(data);
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setMaterias([]);
    }
  }, []);

  useEffect(() => {
    if (planSeleccionado) {
      cargarMaterias(planSeleccionado.id);
    } else {
      setMaterias([]);
    }
  }, [planSeleccionado, cargarMaterias]);

  const seleccionarFacultad = (id: number | '') => {
    setFacultadIdSeleccionada(id);
    setCarreraIdSeleccionada('');
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
    recargarMaterias: () => planSeleccionado && cargarMaterias(planSeleccionado.id)
  };
};