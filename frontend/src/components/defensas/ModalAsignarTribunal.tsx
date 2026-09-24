import React, { useEffect, useState } from 'react';
import { defensasService } from '../../services/defensas.service';
import { useToast } from '../../context/ToastContext';
import {
  CredencialTribunalExterno,
  DocenteTribunalOption,
  TribunalAsignacionPayload,
} from '../../interfaces/defensa';

interface ModalAsignarTribunalProps {
  trabajoId: string | null;
  carreraId?: number | null;
  abierto: boolean;
  onCerrar: () => void;
  onAsignado: () => void;
}

interface MiembroTribunal {
  key: string;
  tipo: 'interno' | 'externo';
  docenteId: string;
  nombre: string;
  apellido: string;
  correo: string;
  ci: string;
  institucion: string;
  preside: boolean;
}

const nuevoMiembro = (label: string): MiembroTribunal => ({
  key: label,
  tipo: 'interno',
  docenteId: '',
  nombre: '',
  apellido: '',
  correo: '',
  ci: '',
  institucion: '',
  preside: false,
});

export const ModalAsignarTribunal: React.FC<ModalAsignarTribunalProps> = ({
  trabajoId,
  carreraId,
  abierto,
  onCerrar,
  onAsignado,
}) => {
  const { mostrarToast } = useToast();
  const [docentes, setDocentes] = useState<DocenteTribunalOption[]>([]);
  const [cargandoDocentes, setCargandoDocentes] = useState(false);
  const [miembros, setMiembros] = useState<MiembroTribunal[]>([nuevoMiembro('1'), nuevoMiembro('2')]);
  const [confirmacionesOtrasCarreras, setConfirmacionesOtrasCarreras] = useState<Record<string, boolean>>({});
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState<CredencialTribunalExterno[]>([]);

  useEffect(() => {
    if (!abierto) return;

    setCredenciales([]);
    setMiembros([nuevoMiembro('1'), nuevoMiembro('2')]);
    setConfirmacionesOtrasCarreras({});

    const cargarDocentes = async () => {
      try {
        setCargandoDocentes(true);
        const cid = carreraId ? Number(carreraId) : 1;
        const lista = await defensasService.obtenerDocentesTribunal(cid);
        setDocentes(lista || []);
      } catch (error) {
        console.error('No se pudieron cargar los docentes de la carrera.', error);
        mostrarToast('Error al cargar la nómina de docentes para tribunal.', 'error');
        setDocentes([]);
      } finally {
        setCargandoDocentes(false);
      }
    };

    cargarDocentes();
  }, [abierto, carreraId]);

  const actualizarMiembro = (index: number, patch: Partial<MiembroTribunal>) => {
    setMiembros((prev) =>
      prev.map((miembro, i) => {
        if (i !== index) {
          return patch.preside ? { ...miembro, preside: false } : miembro;
        }
        return { ...miembro, ...patch };
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trabajoId) return;

    const tribunales: TribunalAsignacionPayload[] = miembros.map((miembro) => {
      const base: TribunalAsignacionPayload = {
        rol: 'TRIBUNAL',
        preside: miembro.preside,
        esExterno: miembro.tipo === 'externo',
        institucionProcedencia: miembro.institucion.trim() || undefined,
      };
      if (miembro.tipo === 'externo') {
        return {
          ...base,
          nombre: miembro.nombre,
          apellido: miembro.apellido,
          correo: miembro.correo,
          ci: miembro.ci.trim() || undefined,
        };
      }
      return { ...base, docenteId: Number(miembro.docenteId) };
    });

    if (tribunales.some((t) => t.esExterno && (!t.nombre || !t.apellido || !t.correo))) {
      mostrarToast('Complete nombre, apellido y correo del tribunal externo.', 'error');
      return;
    }
    if (tribunales.some((t) => !t.esExterno && !t.docenteId)) {
      mostrarToast('Seleccione un docente para cada tribunal.', 'error');
      return;
    }

    // Verificar si algún docente interno tiene materias en otras carreras y no fue confirmado
    for (const miembro of miembros) {
      if (miembro.tipo === 'interno' && miembro.docenteId) {
        const doc = docentes.find((d) => String(d.id) === miembro.docenteId);
        if (doc && doc.tieneMateriasEnOtrasCarreras && !confirmacionesOtrasCarreras[miembro.key]) {
          mostrarToast(
            `Debe confirmar la designación del docente ${doc.nombreCompleto}, quien imparte materias en: ${doc.materiasEnOtrasCarreras.join(', ')}.`,
            'error'
          );
          return;
        }
      }
    }

    try {
      setGuardando(true);
      const resultado = await defensasService.asignarTribunales(trabajoId, tribunales);
      setCredenciales(resultado.credencialesExternos || []);
      if (resultado.credencialesExternos?.length) {
        mostrarToast(
          'Tribunal designado. Guarde las credenciales del tribunal externo (se muestran una sola vez).',
          'success'
        );
        return;
      }
      mostrarToast('Tribunal designado correctamente. Se generaron los memorándums correspondientes.', 'success');
      onAsignado();
      onCerrar();
    } catch (error: any) {
      mostrarToast(error?.response?.data?.message || error?.message || 'No se pudo asignar el tribunal.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !trabajoId) return null;

  const opcionPresideActiva = miembros.some((m) => m.preside);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50 my-6 ${
          credenciales.length ? '' : 'max-h-[90vh] overflow-y-auto'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-lg">
              🧑‍🏫
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">Tribunal de defensa</p>
              <h2 className="mt-0.5 text-xl font-bold text-white">Designar tribunal (2 miembros)</h2>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {credenciales.length > 0 ? (
          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              Los siguientes tribunales externos fueron creados como usuarios de acceso.{' '}
              <b>Guarde estas credenciales ahora: se muestran una única vez.</b>
            </div>
            {credenciales.map((cred) => (
              <div key={cred.username} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-semibold text-white">{cred.nombre}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Usuario</p>
                    <p className="mt-1 font-mono text-sm text-emerald-200">{cred.username}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Contraseña</p>
                    <p className="mt-1 font-mono text-sm text-emerald-200">{cred.password}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  onAsignado();
                  onCerrar();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
              El tribunal se integra por <b className="text-white">exactamente 2 miembros</b> con rol{' '}
              <b className="text-white">TRIBUNAL</b>. El miembro que <b className="text-white">preside</b> el acto
              suscribirá el acta de defensa.
            </div>

            {miembros.map((miembro, index) => {
              const docenteSeleccionado = docentes.find((d) => String(d.id) === miembro.docenteId);
              const tieneOtras = Boolean(docenteSeleccionado?.tieneMateriasEnOtrasCarreras);

              return (
                <div key={miembro.key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                      Tribunal {miembro.key}
                    </label>
                    <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => actualizarMiembro(index, { tipo: 'interno' })}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                          miembro.tipo === 'interno'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Interno
                      </button>
                      <button
                        type="button"
                        onClick={() => actualizarMiembro(index, { tipo: 'externo' })}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                          miembro.tipo === 'externo'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Externo
                      </button>
                    </div>
                  </div>

                  {miembro.tipo === 'interno' ? (
                    <div>
                      <select
                        value={miembro.docenteId}
                        onChange={(e) => {
                          actualizarMiembro(index, { docenteId: e.target.value });
                          // Limpiar confirmación previa al cambiar docente
                          setConfirmacionesOtrasCarreras((prev) => ({ ...prev, [miembro.key]: false }));
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                        disabled={cargandoDocentes}
                        required
                      >
                        <option value="">
                          {cargandoDocentes
                            ? 'Cargando docentes de la carrera...'
                            : 'Seleccione un docente de la carrera'}
                        </option>
                        {docentes.map((docente) => (
                          <option key={docente.id} value={docente.id}>
                            {docente.nombreCompleto} {docente.tieneMateriasEnOtrasCarreras ? '⚠️ (Dicta en otras carreras)' : ''}
                          </option>
                        ))}
                      </select>

                      {/* Aviso y confirmación si dicta materias en otras carreras */}
                      {tieneOtras && docenteSeleccionado && (
                        <div className="mt-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-base leading-none">⚠️</span>
                            <div className="flex-1">
                              <p className="font-semibold text-amber-100">
                                Docente con materias en otras carreras
                              </p>
                              <p className="mt-0.5 text-slate-300">
                                El docente <b className="text-white">{docenteSeleccionado.nombreCompleto}</b> también imparte clases en:{' '}
                                <span className="font-semibold text-amber-300">
                                  {docenteSeleccionado.materiasEnOtrasCarreras.join(', ')}
                                </span>.
                              </p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/20 text-amber-300 font-medium">
                            <input
                              type="checkbox"
                              checked={confirmacionesOtrasCarreras[miembro.key] || false}
                              onChange={(e) =>
                                setConfirmacionesOtrasCarreras((prev) => ({
                                  ...prev,
                                  [miembro.key]: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>Confirmo la designación de este docente para el tribunal de esta carrera</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={miembro.nombre}
                        onChange={(e) => actualizarMiembro(index, { nombre: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        placeholder="Nombre *"
                        required
                      />
                      <input
                        value={miembro.apellido}
                        onChange={(e) => actualizarMiembro(index, { apellido: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        placeholder="Apellido *"
                        required
                      />
                      <input
                        type="email"
                        value={miembro.correo}
                        onChange={(e) => actualizarMiembro(index, { correo: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        placeholder="correo@externo.edu.bo *"
                        required
                      />
                      <input
                        value={miembro.ci}
                        onChange={(e) => actualizarMiembro(index, { ci: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        placeholder="CI (opcional)"
                      />
                      <input
                        value={miembro.institucion}
                        onChange={(e) => actualizarMiembro(index, { institucion: e.target.value })}
                        className="md:col-span-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        placeholder="Institución de procedencia (opcional)"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={miembro.preside}
                      disabled={opcionPresideActiva && !miembro.preside}
                      onChange={(e) => actualizarMiembro(index, { preside: e.target.checked })}
                      className="h-4 w-4 accent-emerald-500 rounded"
                    />
                    <span>Preside el acto de defensa</span>
                  </label>
                </div>
              );
            })}

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {guardando ? 'Designando...' : 'Designar tribunal y generar memorándums'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};