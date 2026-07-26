import React, { useState, useEffect } from 'react';
import { planesMateriasService } from '../services/planesMaterias.service';
import { FormPlanEstudioModal } from '../components/planes/FormPlanEstudioModal';
import { FormMateriaModal } from '../components/materias/FormMateriaModal';
import { ModalConfirmarEliminacion } from '../components/common/ModalConfirmarEliminacion';
// Asumiendo que usas un hook o contexto de notificaciones tipo toast global:
// import { useToast } from '../context/ToastContext';

export const PlanesMateriasView: React.FC = () => {
  // const { showToast } = useToast();
  const [carreraIdSeleccionada] = useState<number>(1); // Dinámico según el ámbito del usuario
  const [planes, setPlanes] = useState<any[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<any | null>(null);
  const [materias, setMaterias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Modales
  const [modalPlanAbierto, setModalPlanAbierto] = useState(false);
  const [planAEditar, setPlanAEditar] = useState<any | null>(null);

  const [modalMateriaAbierto, setModalMateriaAbierto] = useState(false);
  const [materiaAEditar, setMateriaAEditar] = useState<any | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [elementoAEliminar, setElementoAEliminar] = useState<{ tipo: 'plan' | 'materia'; id: number; nombre: string } | null>(null);

  useEffect(() => {
    cargarPlanes(carreraIdSeleccionada);
  }, [carreraIdSeleccionada]);

  useEffect(() => {
    if (planSeleccionado) {
      cargarMaterias(planSeleccionado.id);
    } else {
      setMaterias([]);
    }
  }, [planSeleccionado]);

  const cargarPlanes = async (carreraId: number) => {
    try {
      setLoading(true);
      const data = await planesMateriasService.listarPlanesPorCarrera(carreraId);
      setPlanes(data);
      if (data.length > 0 && !planSeleccionado) {
        setPlanSeleccionado(data[0]);
      }
    } catch (error) {
      console.error('Error al cargar planes', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMaterias = async (planId: number) => {
    try {
      const data = await planesMateriasService.listarMateriasPorPlan(planId);
      setMaterias(data);
    } catch (error) {
      console.error('Error al cargar materias', error);
    }
  };

  // Manejadores unificados para Planes
  const handleGuardarPlan = async (payload: any, id?: number) => {
    if (id) {
      await planesMateriasService.actualizarPlanEstudio(id, payload);
      // showToast('Plan actualizado exitosamente', 'success');
    } else {
      await planesMateriasService.crearPlanEstudio(payload);
      // showToast('Plan creado exitosamente', 'success');
    }
    cargarPlanes(carreraIdSeleccionada);
  };

  // Manejadores unificados para Materias
  const handleGuardarMateria = async (payload: any, id?: number) => {
    if (id) {
      await planesMateriasService.actualizarMateria(id, payload);
      // showToast('Materia actualizada exitosamente', 'success');
    } else {
      await planesMateriasService.crearMateria(payload);
      // showToast('Materia registrada exitosamente', 'success');
    }
    if (planSeleccionado) cargarMaterias(planSeleccionado.id);
  };

  // Ejecución de Eliminación
  const confirmarEliminacion = async () => {
    if (!elementoAEliminar) return;
    if (elementoAEliminar.tipo === 'plan') {
      await planesMateriasService.eliminarPlanEstudio(elementoAEliminar.id);
      // showToast('Plan eliminado correctamente', 'info');
      cargarPlanes(carreraIdSeleccionada);
      setPlanSeleccionado(null);
    } else {
      await planesMateriasService.eliminarMateria(elementoAEliminar.id);
      // showToast('Materia eliminada correctamente', 'info');
      if (planSeleccionado) cargarMaterias(planSeleccionado.id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>📋</span> Gestión de Planes de Estudio y Mallas Curriculares
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna de Planes */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-200">Planes de Estudio</h2>
            <button
              onClick={() => { setPlanAEditar(null); setModalPlanAbierto(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              + Nuevo Plan
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {planes.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setPlanSeleccionado(plan)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all flex justify-between items-center ${
                  planSeleccionado?.id === plan.id
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-gray-800 bg-gray-950/50 hover:bg-gray-800 text-gray-300'
                }`}
              >
                <div>
                  <p className="font-bold text-sm">Gestión: {plan.gestion}</p>
                  <p className="text-xs text-gray-400">{plan.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlanAEditar(plan); setModalPlanAbierto(true); }}
                    className="p-1 hover:text-blue-400 text-xs"
                    title="Editar Plan"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setElementoAEliminar({ tipo: 'plan', id: plan.id, nombre: `Plan ${plan.gestion}` }); setModalEliminarAbierto(true); }}
                    className="p-1 hover:text-red-400 text-xs"
                    title="Eliminar Plan"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna de Materias */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-200">
              Asignaturas {planSeleccionado ? `(Plan ${planSeleccionado.gestion})` : ''}
            </h2>
            {planSeleccionado && (
              <button
                onClick={() => { setMateriaAEditar(null); setModalMateriaAbierto(true); }}
                className="bg-green-600 hover:bg-green-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-green-600/20"
              >
                + Nueva Materia
              </button>
            )}
          </div>

          {planSeleccionado ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Semestre</th>
                    <th className="p-3">Periodo</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {materias.map((materia) => (
                    <tr key={materia.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-3 font-mono font-medium text-blue-400">{materia.codigo}</td>
                      <td className="p-3 text-gray-200 font-medium">{materia.nombre}</td>
                      <td className="p-3 text-gray-400">{materia.semestre}</td>
                      <td className="p-3 text-gray-400 capitalize">{materia.tipoPeriodo}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => { setMateriaAEditar(materia); setModalMateriaAbierto(true); }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => { setElementoAEliminar({ tipo: 'materia', id: materia.id, nombre: materia.nombre }); setModalEliminarAbierto(true); }}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {materias.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500 text-xs">
                        No hay asignaturas registradas para este plan de estudio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-xs">
              <span>👈</span>
              <p className="mt-2">Seleccione un plan de estudio en el panel izquierdo para gestionar su malla.</p>
            </div>
          )}
        </div>

      </div>

      {/* Renderizado de Modales */}
      <FormPlanEstudioModal
        modalAbierto={modalPlanAbierto}
        onClose={() => setModalPlanAbierto(false)}
        planAEditar={planAEditar}
        carreraId={carreraIdSeleccionada}
        onGuardar={handleGuardarPlan}
      />

      {planSeleccionado && (
        <FormMateriaModal
          modalAbierto={modalMateriaAbierto}
          onClose={() => setModalMateriaAbierto(false)}
          materiaAEditar={materiaAEditar}
          planId={planSeleccionado.id}
          onGuardar={handleGuardarMateria}
        />
      )}

      <ModalConfirmarEliminacion
        modalAbierto={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        titulo={`Eliminar ${elementoAEliminar?.tipo === 'plan' ? 'Plan de Estudio' : 'Materia'}`}
        mensaje={`¿Estás seguro de eliminar el registro "${elementoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirmar={confirmarEliminacion}
      />
    </div>
  );
};