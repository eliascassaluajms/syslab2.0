import React, { useEffect, useState } from 'react';
import { httpClient } from '../services/httpClient';
import { horariosService } from '../services/horarios.service';

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

export const HorariosView: React.FC = () => {
  const [horarios, setHorarios] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<LaboratorioOption[]>([]);
  const [docentes, setDocentes] = useState<UsuarioOption[]>([]);
  const [form, setForm] = useState<HorarioForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resHorarios, resLabs, resUsuarios] = await Promise.all([
        horariosService.listar(),
        httpClient.get('/laboratorios'),
        httpClient.get('/usuarios'),
      ]);

      setHorarios(Array.isArray(resHorarios) ? resHorarios : resHorarios?.data || []);
      setLaboratorios(Array.isArray(resLabs.data?.data) ? resLabs.data.data : resLabs.data?.data || []);
      setDocentes(Array.isArray(resUsuarios.data?.data) ? resUsuarios.data.data : resUsuarios.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cargar la información de horarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const handleChange = (field: keyof HorarioForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Académico</p>
          <h1 className="text-2xl font-bold">Horarios y Cronograma</h1>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          {editId ? 'Cancelar edición' : 'Nuevo horario'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Editar horario' : 'Registrar horario'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-300">
              Laboratorio
              <select
                value={form.laboratorioId || ''}
                onChange={(e) => handleChange('laboratorioId', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
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
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              >
                <option value="">Seleccionar docente</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nombre} {docente.apellido || ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-300">
              Materia ID
              <input
                type="number"
                min={1}
                value={form.materiaId || ''}
                onChange={(e) => handleChange('materiaId', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                placeholder="Ej. 12"
              />
            </label>

            <label className="text-sm text-gray-300">
              Día
              <select
                value={form.diaSemana}
                onChange={(e) => handleChange('diaSemana', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
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
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Hora fin
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => handleChange('horaFin', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Semestre
              <input
                type="number"
                min={1}
                value={form.semestre}
                onChange={(e) => handleChange('semestre', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Gestión
              <input
                type="number"
                min={2020}
                value={form.gestion}
                onChange={(e) => handleChange('gestion', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Grupo
              <input
                type="number"
                min={1}
                value={form.grupo}
                onChange={(e) => handleChange('grupo', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Total de grupos
              <input
                type="number"
                min={1}
                value={form.totalGrupos}
                onChange={(e) => handleChange('totalGrupos', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-semibold text-white"
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
                    <th className="py-2 pr-4">Día</th>
                    <th className="py-2 pr-4">Horario</th>
                    <th className="py-2 pr-4">Laboratorio</th>
                    <th className="py-2 pr-4">Docente</th>
                    <th className="py-2 pr-4">Semestre</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((horario) => (
                    <tr key={horario.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="py-2 pr-4">{horario.diaSemana}</td>
                      <td className="py-2 pr-4">{horario.horaInicio} - {horario.horaFin}</td>
                      <td className="py-2 pr-4">{horario.laboratorio?.nombre || horario.laboratorioId}</td>
                      <td className="py-2 pr-4">{horario.docente ? `${horario.docente.nombre} ${horario.docente.apellido || ''}` : horario.docenteId}</td>
                      <td className="py-2 pr-4">{horario.semestre}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(horario)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(horario.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold"
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
    </div>
  );
};
