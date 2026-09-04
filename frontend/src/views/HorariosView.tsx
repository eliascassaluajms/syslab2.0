import React, { useEffect, useState, useRef } from 'react';
import { httpClient } from '../services/httpClient';
import { horariosService } from '../services/horarios.service';
import { useAuth } from '../context/AuthContext';
import { ModalSolicitudExtraordinaria } from '../components/horarios/ModalSolicitudExtraordinaria';

interface LaboratorioOption {
  id: number;
  nombre: string;
  codigo?: string;
}

interface UsuarioOption {
  id: number;
  nombre: string;
  apellido?: string;
  correo?: string;
}

interface MateriaOption {
  id: number;
  nombre: string;
  codigo?: string;
  sigla?: string;
  planEstudio?: {
    id: number;
    codigo?: string;
    descripcion?: string;
    nombre?: string;
    carrera?: {
      nombre?: string;
      sigla?: string;
    };
  };
}

interface HorarioForm {
  laboratorioId: number;
  materiaId: number;
  docenteId: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  semestre: number;
  gestion: number;
  grupo: number;
  totalGrupos: number;
}

const emptyForm: HorarioForm = {
  laboratorioId: 0,
  materiaId: 0,
  docenteId: 0,
  diaSemana: 'Lunes',
  horaInicio: '08:00',
  horaFin: '10:00',
  semestre: 1,
  gestion: new Date().getFullYear(),
  grupo: 1,
  totalGrupos: 1,
};

// Helper funciones de fecha y hora
const getDiaActualEs = (): string => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const now = new Date();
  return dias[now.getDay()];
};

const getHoraActualHHMM = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const HorariosView: React.FC = () => {
  const { tienePermiso, user } = useAuth();
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [horarios, setHorarios] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<LaboratorioOption[]>([]);
  const [docentes, setDocentes] = useState<UsuarioOption[]>([]);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);

  const esDirectorOJefe = user?.rol
    ? typeof user.rol === 'string'
      ? user.rol.toLowerCase().includes('director') || user.rol.toLowerCase().includes('jefe') || user.rol.toLowerCase().includes('admin')
      : String((user.rol as any).nombre || '').toLowerCase().includes('director') ||
        String((user.rol as any).nombre || '').toLowerCase().includes('jefe') ||
        String((user.rol as any).nombre || '').toLowerCase().includes('admin')
    : false;
  
  // Estados para la búsqueda desplegable de materia
  const [busquedaMateria, setBusquedaMateria] = useState('');
  const [dropdownMateriaAbierto, setDropdownMateriaAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado para el modal de cronograma diario por laboratorio
  const [labSeleccionadoModal, setLabSeleccionadoModal] = useState<LaboratorioOption | null>(null);

  // Tick para refresco visual en tiempo real cada 30s
  const [, setTick] = useState(0);

  const [form, setForm] = useState<HorarioForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [modalImportacionAbierto, setModalImportacionAbierto] = useState(false);
  const [importandoExcel, setImportandoExcel] = useState(false);

  // Carga de datos extendida
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resHorarios, resLabs, resUsuarios, resMaterias] = await Promise.all([
        horariosService.listar(),
        httpClient.get('/laboratorios'),
        httpClient.get('/usuarios'),
        httpClient.get('/materias'),
      ]);

      setHorarios(Array.isArray(resHorarios) ? resHorarios : resHorarios?.data || []);
      setLaboratorios(Array.isArray(resLabs.data?.data) ? resLabs.data.data : resLabs.data?.data || []);
      setDocentes(Array.isArray(resUsuarios.data?.data) ? resUsuarios.data.data : resUsuarios.data?.data || []);
      
      const listaMaterias = Array.isArray(resMaterias.data?.data?.materias)
        ? resMaterias.data.data.materias
        : (Array.isArray(resMaterias.data?.data) 
            ? resMaterias.data.data 
            : (Array.isArray(resMaterias.data) ? resMaterias.data : []));
      setMaterias(listaMaterias);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();

    // Actualización de estado en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownMateriaAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (field: keyof HorarioForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setBusquedaMateria('');
  };

  // Lógica de Estado en Tiempo Real por laboratorio
  const obtenerEstadoLaboratorio = (labId: number) => {
    const diaActual = getDiaActualEs();
    const horaActual = getHoraActualHHMM();
    const minsActual = timeToMinutes(horaActual);

    const ocupante = horarios.find((h) => {
      if (Number(h.laboratorioId) !== labId) return false;
      const diaH = (h.diaSemana || '').trim();
      if (diaH.toLowerCase() !== diaActual.toLowerCase()) return false;

      const ini = timeToMinutes(h.horaInicio);
      const fin = timeToMinutes(h.horaFin);

      return minsActual >= ini && minsActual < fin;
    });

    if (ocupante) {
      const materiaNombre = ocupante.materia
        ? `${ocupante.materia.codigo ? `[${ocupante.materia.codigo}] ` : ''}${ocupante.materia.nombre}`
        : `Materia ID: ${ocupante.materiaId}`;

      const docenteNombre = ocupante.docente
        ? `${ocupante.docente.nombre} ${ocupante.docente.apellido || ''}`.trim()
        : `Docente ID: ${ocupante.docenteId}`;

      return {
        estaOcupado: true,
        materiaActual: materiaNombre,
        docenteActual: docenteNombre,
        horarioActual: ocupante,
      };
    }

    return {
      estaOcupado: false,
    };
  };

  const abrirModalDetalleLab = (lab: LaboratorioOption) => {
    setLabSeleccionadoModal(lab);
  };

  const cerrarModal = () => {
    setLabSeleccionadoModal(null);
  };

  // Filtrado de materias dinámico por Nombre, Sigla o Plan
  const materiasFiltradas = materias.filter((mat) => {
    const query = busquedaMateria.toLowerCase();
    const nombre = (mat.nombre || '').toLowerCase();
    const sigla = (mat.codigo || mat.sigla || '').toLowerCase();
    const plan = (mat.planEstudio?.codigo || mat.planEstudio?.descripcion || mat.planEstudio?.nombre || '').toLowerCase();
    return nombre.includes(query) || sigla.includes(query) || plan.includes(query);
  });

  const handleSelectMateria = (materia: MateriaOption) => {
    handleChange('materiaId', materia.id);
    const code = materia.codigo || materia.sigla;
    const planText = materia.planEstudio?.descripcion || materia.planEstudio?.codigo || materia.planEstudio?.nombre;
    const label = `${code ? `[${code}] ` : ''}${materia.nombre}${
      planText ? ` (${planText})` : ''
    }`;
    setBusquedaMateria(label);
    setDropdownMateriaAbierto(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.materiaId) {
      setError('Por favor selecciona una materia válida de la lista.');
      return;
    }

    try {
      const payload = {
        laboratorioId: Number(form.laboratorioId),
        materiaId: Number(form.materiaId),
        docenteId: Number(form.docenteId),
        diaSemana: form.diaSemana,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        semestre: Number(form.semestre),
        gestion: Number(form.gestion),
        grupo: Number(form.grupo),
        totalGrupos: Number(form.totalGrupos),
      };

      if (editId) {
        await horariosService.actualizar(editId, payload);
      } else {
        await horariosService.crear(payload);
      }

      resetForm();
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo guardar el horario.');
    }
  };

  const handleEdit = (horario: any) => {
    setEditId(horario.id);
    setForm({
      laboratorioId: Number(horario.laboratorioId),
      materiaId: Number(horario.materiaId),
      docenteId: Number(horario.docenteId),
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      semestre: Number(horario.semestre),
      gestion: Number(horario.gestion),
      grupo: Number(horario.grupo || 1),
      totalGrupos: Number(horario.totalGrupos || 1),
    });

    if (horario.materia) {
      const mat = horario.materia;
      const code = mat.codigo || mat.sigla;
      setBusquedaMateria(`${code ? `[${code}] ` : ''}${mat.nombre}`);
    } else {
      const mat = materias.find((m) => m.id === Number(horario.materiaId));
      if (mat) {
        const code = mat.codigo || mat.sigla;
        setBusquedaMateria(`${code ? `[${code}] ` : ''}${mat.nombre}`);
      } else {
        setBusquedaMateria('');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este horario?')) return;

    try {
      await horariosService.eliminar(id);
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo eliminar el horario.');
    }
  };

  const handleImportarExcel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!archivoExcel) {
      setError('Selecciona un archivo Excel .xlsx para importar.');
      return;
    }

    setImportandoExcel(true);
    setError(null);
    setMensajeExito(null);
    try {
      const respuesta = await horariosService.importarExcel(archivoExcel);
      const resultado = respuesta.data || {};
      setMensajeExito(respuesta.message || `Importación completada: ${resultado.importados || 0} horarios procesados.`);
      setArchivoExcel(null);
      setModalImportacionAbierto(false);
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo importar el archivo Excel.');
    } finally {
      setImportandoExcel(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Académico</p>
          <h1 className="text-2xl font-bold">Horarios y Cronograma</h1>
        </div>
        <div className="flex items-center gap-3">
          {tienePermiso('horarios:crear') && (
            <button
              type="button"
              onClick={() => setModalImportacionAbierto(true)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2"
            >
              <span>📁</span> Importar Excel Semestral
            </button>
          )}
          {tienePermiso('solicitudes:crear') && (
            <button
              type="button"
              onClick={() => setModalSolicitudAbierto(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-amber-900/20"
            >
              <span>⚡</span> Solicitar Horario Extraordinario
            </button>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            {editId ? 'Cancelar edición' : 'Nuevo horario'}
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex justify-between items-center">
          <span>✅ {mensajeExito}</span>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-400 font-bold">&times;</button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {modalImportacionAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleImportarExcel} className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Importar Excel Semestral</h2>
                <p className="mt-1 text-xs text-gray-400">Selecciona la planilla oficial con la hoja 29-07.</p>
              </div>
              <button type="button" onClick={() => setModalImportacionAbierto(false)} className="text-gray-400 hover:text-white" aria-label="Cerrar">✕</button>
            </div>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setArchivoExcel(event.target.files?.[0] || null)}
              className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm text-gray-300"
            />
            <div className="mt-5 flex justify-end gap-3 border-t border-gray-800 pt-4">
              <button type="button" onClick={() => setModalImportacionAbierto(false)} className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Cancelar</button>
              <button type="submit" disabled={importandoExcel} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                {importandoExcel ? 'Procesando...' : 'Confirmar importación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Principal: Formulario y Tabla de Listado */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Editar horario' : 'Registrar horario'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-300">
              Laboratorio
              <select
                value={form.laboratorioId || ''}
                onChange={(e) => handleChange('laboratorioId', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Seleccionar laboratorio</option>
                {laboratorios.map((lab) => (
                  <option key={lab.id} value={lab.id}>{lab.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-300">
              Docente
              <select
                value={form.docenteId || ''}
                onChange={(e) => handleChange('docenteId', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Seleccionar docente</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nombre} {docente.apellido || ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Selector Buscable de Materia */}
            <div className="relative text-sm text-gray-300" ref={dropdownRef}>
              <label className="block mb-1">Materia y Plan</label>
              <input
                type="text"
                value={busquedaMateria}
                onFocus={() => setDropdownMateriaAbierto(true)}
                onChange={(e) => {
                  setBusquedaMateria(e.target.value);
                  setDropdownMateriaAbierto(true);
                  if (form.materiaId) handleChange('materiaId', 0);
                }}
                placeholder="Buscar por nombre, sigla o plan..."
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />

              {dropdownMateriaAbierto && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 shadow-2xl">
                  {materiasFiltradas.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">No se encontraron materias</div>
                  ) : (
                    materiasFiltradas.map((materia) => {
                      const code = materia.codigo || materia.sigla;
                      const planText = materia.planEstudio?.descripcion || materia.planEstudio?.codigo || materia.planEstudio?.nombre;
                      return (
                        <button
                          key={materia.id}
                          type="button"
                          onClick={() => handleSelectMateria(materia)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-600/20 hover:text-blue-300 border-b border-gray-900 last:border-none transition-colors cursor-pointer"
                        >
                          <div className="font-semibold text-white">
                            {code && <span className="text-blue-400 mr-1.5">[{code}]</span>}
                            {materia.nombre}
                          </div>
                          {materia.planEstudio && (
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Plan: {planText || 'General'} 
                              {materia.planEstudio.carrera?.sigla || materia.planEstudio.carrera?.nombre ? ` - ${materia.planEstudio.carrera.sigla || materia.planEstudio.carrera.nombre}` : ''}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <label className="text-sm text-gray-300">
              Día
              <select
                value={form.diaSemana}
                onChange={(e) => handleChange('diaSemana', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-300">
              Hora inicio
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => handleChange('horaInicio', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm text-gray-300">
              Hora fin
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => handleChange('horaFin', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm text-gray-300">
              Semestre
              <input
                type="number"
                min={1}
                value={form.semestre}
                onChange={(e) => handleChange('semestre', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm text-gray-300">
              Gestión
              <input
                type="number"
                min={2020}
                value={form.gestion}
                onChange={(e) => handleChange('gestion', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm text-gray-300">
              Grupo
              <input
                type="number"
                min={1}
                value={form.grupo}
                onChange={(e) => handleChange('grupo', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm text-gray-300">
              Total de grupos
              <input
                type="number"
                min={1}
                value={form.totalGrupos}
                onChange={(e) => handleChange('totalGrupos', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer shadow-lg shadow-green-600/20"
          >
            {editId ? 'Guardar cambios' : 'Guardar horario'}
          </button>
        </form>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Listado de horarios</h2>
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{horarios.length} registros</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Cargando horarios...</p>
          ) : horarios.length === 0 ? (
            <p className="text-sm text-gray-400">No hay horarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="py-2 pr-4">Materia</th>
                    <th className="py-2 pr-4">Día</th>
                    <th className="py-2 pr-4">Horario</th>
                    <th className="py-2 pr-4">Laboratorio</th>
                    <th className="py-2 pr-4">Docente</th>
                    <th className="py-2 pr-4">Grupo</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((horario) => (
                    <tr key={horario.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="py-2 pr-4 font-medium text-blue-400">
                        {horario.materia ? `${horario.materia.codigo ? `[${horario.materia.codigo}] ` : ''}${horario.materia.nombre}` : horario.materiaId}
                      </td>
                      <td className="py-2 pr-4">{horario.diaSemana}</td>
                      <td className="py-2 pr-4">{horario.horaInicio} - {horario.horaFin}</td>
                      <td className="py-2 pr-4">{horario.laboratorio?.nombre || horario.laboratorioId}</td>
                      <td className="py-2 pr-4">{horario.docente ? `${horario.docente.nombre} ${horario.docente.apellido || ''}` : horario.docenteId}</td>
                      <td className="py-2 pr-4 text-xs text-gray-400">{horario.grupo || 1}/{horario.totalGrupos || 1}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(horario)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(horario.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Estado en Tiempo Real de Laboratorios */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Estado Actual de Laboratorios
          </h2>
          <span className="text-xs text-gray-400">Actualizado en tiempo real ({getDiaActualEs()} {getHoraActualHHMM()})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {laboratorios.map((lab) => {
            const estadoInfo = obtenerEstadoLaboratorio(lab.id);
            return (
              <div
                key={lab.id}
                onClick={() => abrirModalDetalleLab(lab)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.02] ${
                  estadoInfo.estaOcupado
                    ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/60'
                    : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{lab.nombre}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      estadoInfo.estaOcupado
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {estadoInfo.estaOcupado ? 'Ocupado' : 'Libre'}
                  </span>
                </div>

                {estadoInfo.estaOcupado ? (
                  <div className="mt-2 text-xs text-gray-300 space-y-1">
                    <p className="font-medium text-red-200 truncate">{estadoInfo.materiaActual}</p>
                    <p className="text-gray-400 truncate">{estadoInfo.docenteActual}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">Disponible sin clase programada en este momento.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Cronograma Diario por Laboratorio */}
      {labSeleccionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400">Cronograma del Día ({getDiaActualEs()})</p>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {labSeleccionadoModal.nombre}
                  {labSeleccionadoModal.codigo && (
                    <span className="text-xs font-normal bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">
                      {labSeleccionadoModal.codigo}
                    </span>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-gray-400 hover:text-white rounded-lg p-1.5 hover:bg-gray-800 transition-colors text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Programación del día filtrada y ordenada */}
            {(() => {
              const diaActual = getDiaActualEs();
              const minsActual = timeToMinutes(getHoraActualHHMM());
              const cronogramaDia = horarios
                .filter(
                  (h) =>
                    Number(h.laboratorioId) === labSeleccionadoModal.id &&
                    (h.diaSemana || '').trim().toLowerCase() === diaActual.toLowerCase()
                )
                .sort((a, b) => timeToMinutes(a.horaInicio) - timeToMinutes(b.horaInicio));

              if (cronogramaDia.length === 0) {
                return (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-sm">No hay clases ni actividades programadas para hoy ({diaActual}) en este laboratorio.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {cronogramaDia.map((bloque) => {
                    const ini = timeToMinutes(bloque.horaInicio);
                    const fin = timeToMinutes(bloque.horaFin);
                    
                    let estadoBloque = { texto: 'Concluido', clase: 'bg-gray-800 text-gray-400 border border-gray-700' };
                    if (minsActual >= ini && minsActual < fin) {
                      estadoBloque = { texto: 'En curso', clase: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold' };
                    } else if (minsActual < ini) {
                      estadoBloque = { texto: 'Próximo', clase: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' };
                    }

                    const materiaText = bloque.materia
                      ? `${bloque.materia.codigo ? `[${bloque.materia.codigo}] ` : ''}${bloque.materia.nombre}`
                      : `Materia ID: ${bloque.materiaId}`;

                    const docenteText = bloque.docente
                      ? `${bloque.docente.nombre} ${bloque.docente.apellido || ''}`.trim()
                      : `Docente ID: ${bloque.docenteId}`;

                    return (
                      <div
                        key={bloque.id}
                        className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded-md">
                              {bloque.horaInicio} - {bloque.horaFin}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${estadoBloque.clase}`}>
                              {estadoBloque.texto}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-white">{materiaText}</h4>
                          <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                            <span>👨‍🏫 {docenteText}</span>
                            <span>•</span>
                            <span>Grupo: {bloque.grupo || 1}/{bloque.totalGrupos || 1}</span>
                            <span>•</span>
                            <span>Semestre: {bloque.semestre}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-6 border-t border-gray-800 pt-4 flex justify-end">
              <button
                type="button"
                onClick={cerrarModal}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asistente de Solicitud Extraordinaria */}
      <ModalSolicitudExtraordinaria
        isOpen={modalSolicitudAbierto}
        onClose={() => setModalSolicitudAbierto(false)}
        onSuccess={() => {
          setMensajeExito('Solicitud de horario extraordinario enviada correctamente.');
          void cargarDatos();
        }}
        esDirectorOJefe={esDirectorOJefe}
      />
    </div>
  );
};
