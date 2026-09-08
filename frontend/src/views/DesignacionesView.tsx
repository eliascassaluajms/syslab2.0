import React, { useEffect, useState } from 'react';
import { DesignacionMateria, CrearDesignacionDTO } from '../interfaces/designacion.interface';
import { DesignacionService } from '../services/designacion.service';
import { httpClient } from '../services/httpClient';

export const DesignacionesView: React.FC = () => {
  const [designaciones, setDesignaciones] = useState<DesignacionMateria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gestionActual, setGestionActual] = useState<number>(new Date().getFullYear());

  // Estados para el Modal de Creación
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);
  const [formDocenteId, setFormDocenteId] = useState<number>(0);
  const [formMateriaId, setFormMateriaId] = useState<number>(0);
  const [formGrupo, setFormGrupo] = useState<number>(1);
  const [formTipoPeriodo, setFormTipoPeriodo] = useState<string>('Semestral');
  const [guardando, setGuardando] = useState<boolean>(false);

  const cargarDesignaciones = async (gestion: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await DesignacionService.listar(gestion);
      setDesignaciones(data);
    } catch (err: any) {
      setError('Error al cargar las designaciones de materias.');
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogosModal = async () => {
    try {
      const [resUsuarios, resMaterias] = await Promise.all([
        httpClient.get('/usuarios'),
        httpClient.get('/materias')
      ]);
      setDocentes(resUsuarios.data.data || resUsuarios.data || []);
      setMaterias(resMaterias.data.data || resMaterias.data || []);
    } catch (err) {
      console.error('Error al cargar catálogos para el formulario', err);
    }
  };

  useEffect(() => {
    cargarDesignaciones(gestionActual);
  }, [gestionActual]);

  const abrirModalCrear = () => {
    cargarCatalogosModal();
    setFormDocenteId(0);
    setFormMateriaId(0);
    setFormGrupo(1);
    setFormTipoPeriodo('Semestral');
    setModalAbierto(true);
  };

  const handleCrearDesignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDocenteId || !formMateriaId) {
      alert('Debe seleccionar un docente y una materia.');
      return;
    }

    try {
      setGuardando(true);
      const dto: CrearDesignacionDTO = {
        docenteId: Number(formDocenteId),
        materiaId: Number(formMateriaId),
        grupo: Number(formGrupo),
        gestion: gestionActual,
        tipoPeriodo: formTipoPeriodo
      };

      await DesignacionService.crear(dto);
      setModalAbierto(false);
      cargarDesignaciones(gestionActual);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar la designación.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Carga Académica Docente</h1>
          <p className="text-slate-400 text-sm">Administración de designaciones para materias anuales y semestrales.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">Gestión:</label>
            <input 
              type="number" 
              value={gestionActual} 
              onChange={(e) => setGestionActual(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white w-24 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Nueva Designación</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          Cargando designaciones...
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Docente</th>
                <th className="py-3 px-4">Materia</th>
                <th className="py-3 px-4">Grupo</th>
                <th className="py-3 px-4">Periodo</th>
                <th className="py-3 px-4">Gestión</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {designaciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No existen designaciones registradas para la gestión {gestionActual}.
                  </td>
                </tr>
              ) : (
                designaciones.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {item.docente ? `${item.docente.nombre} ${item.docente.apellido}` : 'Docente no asignado'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-blue-400 font-semibold mr-2">[{item.materia?.codigo}]</span>
                      {item.materia?.nombre}
                    </td>
                    <td className="py-3.5 px-4">Grupo {item.grupo}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded bg-slate-700/80 text-slate-300 border border-slate-600">
                        {item.periodo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{item.gestion}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={async () => {
                          if (confirm('¿Está seguro de eliminar esta designación?')) {
                            await DesignacionService.eliminar(item.id);
                            cargarDesignaciones(gestionActual);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs bg-red-950/40 hover:bg-red-900/50 border border-red-800/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700 bg-slate-900/50">
              <h3 className="text-lg font-bold text-white">Nueva Designación Docente</h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCrearDesignacion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Docente</label>
                <select
                  value={formDocenteId}
                  onChange={(e) => setFormDocenteId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Seleccione un docente...</option>
                  {docentes.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nombre} {doc.apellido} ({doc.correo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Materia</label>
                <select
                  value={formMateriaId}
                  onChange={(e) => setFormMateriaId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Seleccione una materia...</option>
                  {materias.map((mat: any) => (
                    <option key={mat.id} value={mat.id}>
                      [{mat.codigo}] {mat.nombre} ({mat.tipoPeriodo || 'Semestral'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Grupo</label>
                  <input
                    type="number"
                    min={1}
                    value={formGrupo}
                    onChange={(e) => setFormGrupo(Number(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Tipo de Periodo</label>
                  <select
                    value={formTipoPeriodo}
                    onChange={(e) => setFormTipoPeriodo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual (Todo el año)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Designación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};