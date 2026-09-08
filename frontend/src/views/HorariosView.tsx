import React, { useEffect, useMemo, useState, useRef } from 'react';
import { httpClient } from '../services/httpClient';
import { horariosService } from '../services/horarios.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ModalSolicitudExtraordinaria } from '../components/horarios/ModalSolicitudExtraordinaria';
import { AlertCircle, FileSpreadsheet, Plus } from 'lucide-react';

interface LaboratorioOption {
  id: number;
  nombre: string;
  codigo?: string;
  activo?: boolean;
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

const diasHorarios = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const materiaTexto = (horario: any) => horario.materia
  ? `${horario.materia.codigo ? `[${horario.materia.codigo}] ` : ''}${horario.materia.nombre}`
  : `Materia ID: ${horario.materiaId}`;

const docenteTexto = (horario: any) => horario.docente
  ? `${horario.docente.nombre} ${horario.docente.apellido || ''}`.trim()
  : `Docente ID: ${horario.docenteId}`;

export const HorariosView: React.FC = () => {
  const { tienePermiso, user } = useAuth();
  const { mostrarToast } = useToast();

  const [horarios, setHorarios] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<LaboratorioOption[]>([]);
  const [docentes, setDocentes] = useState<UsuarioOption[]>([]);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);

  const [form, setForm] = useState<HorarioForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busquedaMateria, setBusquedaMateria] = useState('');
  const [materiaAbierta, setMateriaAbierta] = useState(false);
  const [filtros, setFiltros] = useState({ materia: '', dia: '', laboratorio: '', docente: '' });

  const [labSeleccionado, setLabSeleccionado] = useState<LaboratorioOption | null>(null);
  const [solicitudAbierta, setSolicitudAbierta] = useState(false);
  const [loadingVista, setLoadingVista] = useState(false);
  const [, setTick] = useState(0);

  const materiaRef = useRef<HTMLDivElement>(null);

  const esDirectorOJefe = user?.rol
    ? typeof user.rol === 'string'
      ? /director|jefe|admin/i.test(user.rol)
      : /director|jefe|admin/i.test(String((user.rol as any).nombre || ''))
    : false;

  const cargarVista = async () => {
    setLoadingVista(true);
    try {
      const [horariosResponse, labsResponse, usuariosResponse, materiasResponse] = await Promise.all([
        horariosService.listar(),
        httpClient.get('/laboratorios'),
        httpClient.get('/usuarios'),
        httpClient.get('/materias'),
      ]);
      setHorarios(Array.isArray(horariosResponse) ? horariosResponse : []);
      setLaboratorios(Array.isArray(labsResponse.data?.data) ? labsResponse.data.data : []);
      setDocentes(Array.isArray(usuariosResponse.data?.data) ? usuariosResponse.data.data : []);
      const materiasData = materiasResponse.data?.data?.materias ?? materiasResponse.data?.data ?? [];
      setMaterias(Array.isArray(materiasData) ? materiasData : []);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'No se pudo cargar la información.';
      mostrarToast(errMsg, 'error');
    } finally {
      setLoadingVista(false);
    }
  };

  useEffect(() => {
    void cargarVista();
    const interval = setInterval(() => setTick((tick) => tick + 1), 30000);
    const close = (event: MouseEvent) => {
      if (materiaRef.current && !materiaRef.current.contains(event.target as Node)) {
        setMateriaAbierta(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', close);
    };
  }, []);

  const filtrados = useMemo(() => horarios.filter((horario) => {
    const materia = materiaTexto(horario).toLowerCase();
    const dia = String(horario.diaSemana || '').toLowerCase();
    const laboratorio = String(horario.laboratorio?.nombre || horario.laboratorioId).toLowerCase();
    const docente = docenteTexto(horario).toLowerCase();
    return materia.includes(filtros.materia.toLowerCase()) &&
      (!filtros.dia || dia.includes(filtros.dia.toLowerCase())) &&
      laboratorio.includes(filtros.laboratorio.toLowerCase()) &&
      docente.includes(filtros.docente.toLowerCase());
  }), [horarios, filtros]);

  const materiasFiltradas = materias.filter((materia) => [
    materia.nombre,
    materia.codigo,
    materia.sigla,
    materia.planEstudio?.nombre,
    materia.planEstudio?.codigo
  ].filter(Boolean).some((value) => String(value).toLowerCase().includes(busquedaMateria.toLowerCase())));

  const estadoLab = (labId: number) => {
    const now = timeToMinutes(getHoraActualHHMM());
    return horarios.find((item) =>
      Number(item.laboratorioId) === labId &&
      String(item.diaSemana || '').toLowerCase() === getDiaActualEs().toLowerCase() &&
      now >= timeToMinutes(item.horaInicio) &&
      now < timeToMinutes(item.horaFin)
    );
  };

  const cambiar = (field: keyof HorarioForm, value: string | number) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const reset = () => {
    setEditId(null);
    setForm(emptyForm);
    setBusquedaMateria('');
    setMostrarFormulario(false);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.materiaId) {
      mostrarToast('Por favor selecciona una materia válida de la lista.', 'warning');
      return;
    }
    try {
      const payload = {
        ...form,
        laboratorioId: Number(form.laboratorioId),
        materiaId: Number(form.materiaId),
        docenteId: Number(form.docenteId)
      };

      if (editId) {
        await horariosService.actualizar(editId, payload);
        mostrarToast('Horario actualizado correctamente.', 'success');
      } else {
        await horariosService.crear(payload);
        mostrarToast('Horario registrado correctamente.', 'success');
      }
      reset();
      await cargarVista();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'No se pudo guardar el horario.';
      mostrarToast(errMsg, 'error');
    }
  };

  const editar = (horario: any) => {
    setEditId(horario.id);
    setForm({
      laboratorioId: Number(horario.laboratorioId),
      materiaId: Number(horario.materiaId),
      docenteId: Number(horario.docenteId),
      diaSemana: horario.diaSemana || 'Lunes',
      horaInicio: horario.horaInicio || '08:00',
      horaFin: horario.horaFin || '10:00',
      semestre: Number(horario.semestre || 1),
      gestion: Number(horario.gestion || new Date().getFullYear()),
      grupo: Number(horario.grupo || 1),
      totalGrupos: Number(horario.totalGrupos || 1)
    });
    setBusquedaMateria(materiaTexto(horario));
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este horario?')) return;
    try {
      await horariosService.eliminar(id);
      mostrarToast('Horario eliminado con éxito.', 'success');
      await cargarVista();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'No se pudo eliminar el horario.';
      mostrarToast(errMsg, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-white">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Categoría Institucional · Académico</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Horarios y Cronograma</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {tienePermiso('solicitudes:crear') && (
            <button type="button" onClick={() => setSolicitudAbierta(true)} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold hover:bg-amber-500 cursor-pointer">
              ⚡ Solicitar extraordinario
            </button>
          )}
          {tienePermiso('horarios:crear') && (
            <>
              <button type="button" onClick={() => setMostrarFormulario((value) => !value)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 cursor-pointer">
                <Plus className="h-4 w-4" />{mostrarFormulario ? 'Cerrar registro' : 'Nuevo horario'}
              </button>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold hover:bg-emerald-500">
                <FileSpreadsheet className="h-4 w-4" />Importar Excel
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const response = await horariosService.importarExcel(file);
                    mostrarToast(response.message || 'Importación completada.', 'success');
                    await cargarVista();
                  } catch (err: any) {
                    mostrarToast(err.response?.data?.message || 'No se pudo importar el archivo Excel.', 'error');
                  }
                  event.target.value = '';
                }} />
              </label>
            </>
          )}
        </div>
      </header>

      {/* Grid de Estado Actual de Laboratorios (Excluyendo inactivos) */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-xl font-bold">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />Estado actual de laboratorios
          </h2>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300">
            {getDiaActualEs()} · {getHoraActualHHMM()}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {laboratorios.filter((lab) => lab.activo !== false).map((lab) => {
            const horario = estadoLab(lab.id);
            return (
              <button key={lab.id} type="button" onClick={() => setLabSeleccionado(lab)} className={`rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${horario ? 'border-rose-500/30 bg-rose-950/20' : 'border-emerald-500/30 bg-emerald-950/20'}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <b className="truncate">{lab.nombre}</b>
                  <span className="rounded-full border px-3 py-1 text-xs">{horario ? 'OCUPADO' : 'LIBRE'}</span>
                </div>
                {horario ? (
                  <>
                    <p className="truncate text-xs font-semibold text-rose-200">{materiaTexto(horario)}</p>
                    <p className="truncate text-xs text-slate-400">{docenteTexto(horario)}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Disponible para uso libre o reservas extraordinarias.</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Formulario de Registro / Edición con Laboratorios Activos */}
      {mostrarFormulario && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in duration-200">
          <div className="mb-5 flex justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold">{editId ? 'Editar registro de horario' : 'Registrar nuevo horario semestral'}</h2>
            <button type="button" onClick={reset} className="text-sm text-slate-400 hover:text-white cursor-pointer">&times; Cancelar</button>
          </div>
          <form onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs text-slate-300">Laboratorio *
              <select required value={form.laboratorioId || ''} onChange={(event) => cambiar('laboratorioId', Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm cursor-pointer">
                <option value="">Seleccionar laboratorio</option>
                {laboratorios.filter((lab) => lab.activo !== false).map((lab) => <option key={lab.id} value={lab.id}>{lab.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-300">Docente *
              <select
                required
                value={form.docenteId || ''}
                onChange={(event) => cambiar('docenteId', Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm cursor-pointer"
              >
                <option value="">Seleccionar docente</option>
                {docentes
                  .filter((docente: any) => {
                    const rolStr = typeof docente.rol === 'string'
                      ? docente.rol
                      : docente.rol?.nombre || docente.tipo || '';

                    // Filtra para incluir solo docentes/profesores y excluir estudiantes
                    return /docente|profesor|catedratico|jefe|director|admin/i.test(rolStr) &&
                      !/estudiante|alumno/i.test(rolStr);
                  })
                  .map((docente) => (
                    <option key={docente.id} value={docente.id}>
                      {docente.nombre} {docente.apellido || ''}
                    </option>
                  ))}
              </select>
            </label>
            <div ref={materiaRef} className="relative text-xs text-slate-300">
              <label>Materia y plan *
                <input required={!form.materiaId} value={busquedaMateria} onFocus={() => setMateriaAbierta(true)} onChange={(event) => { setBusquedaMateria(event.target.value); setMateriaAbierta(true); cambiar('materiaId', 0); }} placeholder="Buscar por nombre, sigla o plan..." className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              {materiaAbierta && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
                  {materiasFiltradas.map((materia) => (
                    <button key={materia.id} type="button" onClick={() => { cambiar('materiaId', materia.id); setBusquedaMateria(`${materia.codigo ? `[${materia.codigo}] ` : ''}${materia.nombre}`); setMateriaAbierta(false); }} className="block w-full border-b border-slate-900 px-3 py-2 text-left text-xs hover:bg-emerald-600/20 cursor-pointer">
                      {materia.codigo && <span className="mr-1 text-emerald-400">[{materia.codigo}]</span>}{materia.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="text-xs text-slate-300">Día
              <select value={form.diaSemana} onChange={(event) => cambiar('diaSemana', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm cursor-pointer">
                {diasHorarios.map((dia) => <option key={dia}>{dia}</option>)}
              </select>
            </label>
            {(['horaInicio', 'horaFin'] as const).map((field) => (
              <label key={field} className="text-xs text-slate-300">{field === 'horaInicio' ? 'Hora de inicio' : 'Hora de fin'}
                <input required type="time" value={form[field]} onChange={(event) => cambiar(field, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
            ))}
            {(['semestre', 'gestion', 'grupo', 'totalGrupos'] as const).map((field) => (
              <label key={field} className="text-xs text-slate-300">{field === 'totalGrupos' ? 'Total de grupos' : field[0].toUpperCase() + field.slice(1)}
                <input type="number" min={1} value={form[field]} onChange={(event) => cambiar(field, Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
            ))}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 md:col-span-3">
              <button type="button" onClick={reset} className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs hover:bg-slate-700 cursor-pointer">Cancelar</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold hover:bg-emerald-500 cursor-pointer">{editId ? 'Guardar cambios' : 'Registrar horario'}</button>
            </div>
          </form>
        </section>
      )}

      {/* Listado de Horarios Regulares con Botones de Acción Funcionales */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold">Listado de horarios regulares</h2>
            <p className="text-xs text-slate-400">Filtra desde los encabezados para encontrar una asignación.</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{filtrados.length} de {horarios.length} registros</span>
        </div>
        {loadingVista ? (
          <p className="py-12 text-center text-sm text-slate-400">Cargando registros académicos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  {['Materia', 'Día', 'Horario', 'Laboratorio / Aula', 'Docente', 'Grupo', 'Acciones'].map((title) => <th key={title} className="p-3">{title}</th>)}
                </tr>
                <tr className="border-b border-slate-800 bg-slate-950/80">
                  <th className="p-2"><input value={filtros.materia} onChange={(event) => setFiltros({ ...filtros, materia: event.target.value })} placeholder="Filtrar materia..." className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white" /></th>
                  <th className="p-2">
                    <select value={filtros.dia} onChange={(event) => setFiltros({ ...filtros, dia: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white cursor-pointer">
                      <option value="">Todos los días</option>
                      {diasHorarios.map((dia) => <option key={dia}>{dia}</option>)}
                    </select>
                  </th>
                  <th className="p-2 text-xs font-normal text-slate-500">Rango fijo</th>
                  <th className="p-2"><input value={filtros.laboratorio} onChange={(event) => setFiltros({ ...filtros, laboratorio: event.target.value })} placeholder="Filtrar lab..." className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white" /></th>
                  <th className="p-2"><input value={filtros.docente} onChange={(event) => setFiltros({ ...filtros, docente: event.target.value })} placeholder="Filtrar docente..." className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white" /></th>
                  <th />
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtrados.map((horario) => (
                  <tr key={horario.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-emerald-400">{materiaTexto(horario)}</td>
                    <td className="p-3">{horario.diaSemana}</td>
                    <td className="p-3 font-mono text-xs">{horario.horaInicio} - {horario.horaFin}</td>
                    <td className="p-3">{horario.laboratorio?.nombre || horario.laboratorioId}</td>
                    <td className="p-3">{docenteTexto(horario)}</td>
                    <td className="p-3 text-center text-xs">{horario.grupo || 1}/{horario.totalGrupos || 1}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-3">
                        <button type="button" onClick={() => editar(horario)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">Editar</button>
                        <button type="button" onClick={() => eliminar(horario.id)} className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtrados.length && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs text-slate-500">No se encontraron horarios con los filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {labSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs uppercase text-emerald-400">Cronograma del día · {getDiaActualEs()}</p>
                <h2 className="text-xl font-bold">{labSeleccionado.nombre}</h2>
              </div>
              <button type="button" onClick={() => setLabSeleccionado(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            {horarios.filter((horario) => Number(horario.laboratorioId) === labSeleccionado.id && String(horario.diaSemana || '').toLowerCase() === getDiaActualEs().toLowerCase()).map((horario) => (
              <div key={horario.id} className="mb-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="font-mono text-xs text-emerald-400">{horario.horaInicio} - {horario.horaFin}</p>
                <p className="font-bold">{materiaTexto(horario)}</p>
                <p className="text-xs text-slate-400">{docenteTexto(horario)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalSolicitudExtraordinaria isOpen={solicitudAbierta} onClose={() => setSolicitudAbierta(false)} onSuccess={() => { mostrarToast('Solicitud enviada correctamente.', 'success'); void cargarVista(); }} esDirectorOJefe={esDirectorOJefe} />
    </div>
  );
};
