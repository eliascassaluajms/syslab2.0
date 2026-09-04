import React, { useMemo, useState } from 'react';
import { useCatalogos } from '../../hooks/useCatalogos';
import { defensasService } from '../../services/defensas.service';
import { useToast } from '../../context/ToastContext';

interface ModalNuevoTrabajoProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}

const initialForm = {
  titulo: '',
  modalidad: 'Trabajo Dirigido',
  gradoOptado: 'Licenciatura en Ingeniería Informática',
  carreraId: '',
  estudianteNombre: '',
  estudianteCi: '',
  estudianteRu: '',
  estudianteEmail: '',
  estudianteTelefono: '',
};

export const ModalNuevoTrabajo: React.FC<ModalNuevoTrabajoProps> = ({ abierto, onCerrar, onCreado }) => {
  const { carreras, loading: cargandoCatalogos } = useCatalogos();
  const { mostrarToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [guardando, setGuardando] = useState(false);

  const opcionesCarreras = useMemo(() => carreras || [], [carreras]);

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.titulo.trim() || !form.estudianteNombre.trim() || !form.carreraId) {
      mostrarToast('Complete los campos obligatorios del trabajo de grado.', 'error');
      return;
    }

    try {
      setGuardando(true);
      await defensasService.crear({
        titulo: form.titulo,
        modalidad: form.modalidad,
        gradoOptado: form.gradoOptado,
        carreraId: Number(form.carreraId),
        estudianteNombre: form.estudianteNombre,
        estudianteCi: form.estudianteCi,
        estudianteRu: form.estudianteRu,
        estudianteEmail: form.estudianteEmail,
        estudianteTelefono: form.estudianteTelefono,
      });

      mostrarToast('Trabajo de grado registrado correctamente.', 'success');
      setForm(initialForm);
      onCreado();
      onCerrar();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || error?.message || 'No se pudo registrar el trabajo de grado.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-lg">📄</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-blue-300">Registro académico</p>
              <h2 className="mt-1 text-xl font-bold text-white">Nuevo trabajo de grado</h2>
            </div>
          </div>
          <button onClick={onCerrar} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Título</span>
              <input value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Ej. Diseño de un sistema de gestión..." />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Modalidad</span>
              <input value={form.modalidad} onChange={(e) => handleChange('modalidad', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Grado</span>
              <input value={form.gradoOptado} onChange={(e) => handleChange('gradoOptado', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Carrera</span>
              <select value={form.carreraId} onChange={(e) => handleChange('carreraId', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" disabled={cargandoCatalogos}>
                <option value="">Seleccione una carrera</option>
                {opcionesCarreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Estudiante</span>
              <input value={form.estudianteNombre} onChange={(e) => handleChange('estudianteNombre', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Nombre completo" />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">CI</span>
              <input value={form.estudianteCi} onChange={(e) => handleChange('estudianteCi', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Ej. 1234567" />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">RU</span>
              <input value={form.estudianteRu} onChange={(e) => handleChange('estudianteRu', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Ej. 20231234" />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Teléfono</span>
              <input value={form.estudianteTelefono} onChange={(e) => handleChange('estudianteTelefono', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Opcional" />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Correo institucional</span>
              <input type="email" value={form.estudianteEmail} onChange={(e) => handleChange('estudianteEmail', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="estudiante@uajms.edu.bo" />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button type="button" onClick={onCerrar} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700">Cancelar</button>
            <button type="submit" disabled={guardando} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
