import React, { useEffect, useState } from 'react';
import { httpClient } from '../../services/httpClient';
import { useToast } from '../../context/ToastContext';

interface ModalAsignarTribunalProps {
  trabajoId: string | null;
  abierto: boolean;
  onCerrar: () => void;
  onAsignado: () => void;
}

interface UsuarioDocente {
  id: number;
  nombre: string;
  apellido?: string;
  correo?: string;
}

const roles: Array<'PRESIDENTE' | 'SECRETARIO' | 'VOCAL'> = ['PRESIDENTE', 'SECRETARIO', 'VOCAL'];

const defaultTribunales = [
  { docenteId: '', rol: 'PRESIDENTE' as const },
  { docenteId: '', rol: 'SECRETARIO' as const },
  { docenteId: '', rol: 'VOCAL' as const },
];

export const ModalAsignarTribunal: React.FC<ModalAsignarTribunalProps> = ({ trabajoId, abierto, onCerrar, onAsignado }) => {
  const { mostrarToast } = useToast();
  const [docentes, setDocentes] = useState<UsuarioDocente[]>([]);
  const [tribunales, setTribunales] = useState(defaultTribunales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    const cargarDocentes = async () => {
      try {
        const response = await httpClient.get('/usuarios');
        const lista = Array.isArray(response.data?.data) ? response.data.data : [];
        const docentesDisponibles = lista.filter((usuario: any) => usuario.activo !== false && (usuario.roles?.length || usuario.rol));
        setDocentes(docentesDisponibles as UsuarioDocente[]);
      } catch (error) {
        console.error('No se pudieron cargar los docentes.', error);
      }
    };

    cargarDocentes();
    setTribunales(defaultTribunales);
  }, [abierto]);

  const handleChange = (index: number, value: string) => {
    setTribunales((prev) => prev.map((tribunal, i) => (i === index ? { ...tribunal, docenteId: value } : tribunal)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trabajoId) return;

    const payload = tribunales.map((tribunal) => ({
      docenteId: Number(tribunal.docenteId),
      rol: tribunal.rol,
    }));

    try {
      setGuardando(true);
      await httpClient.post(`/defensas/${trabajoId}/tribunales`, { tribunales: payload });
      mostrarToast('Tribunal designado correctamente.', 'success');
      onAsignado();
      onCerrar();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || 'No se pudo asignar el tribunal.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !trabajoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-lg">🧑‍🏫</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">Evaluación docente</p>
              <h2 className="mt-1 text-xl font-bold text-white">Designar tribunal</h2>
            </div>
          </div>
          <button onClick={onCerrar} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {tribunales.map((tribunal, index) => (
            <div key={tribunal.rol} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{tribunal.rol}</label>
              <select value={tribunal.docenteId} onChange={(e) => handleChange(index, e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500" required>
                <option value="">Seleccione un docente</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>{docente.nombre} {docente.apellido || ''}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button type="button" onClick={onCerrar} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700">Cancelar</button>
            <button type="submit" disabled={guardando} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Asignar tribunal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
