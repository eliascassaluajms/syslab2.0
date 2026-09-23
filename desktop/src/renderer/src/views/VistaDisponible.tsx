import type { AppConfig } from '../../../shared/types';

interface Props {
  config: AppConfig;
  bloqueando: boolean;
  onBloquear: () => void;
}

export default function VistaDisponible({ config, bloqueando, onBloquear }: Props) {
  const disp = config.dispositivo!;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Equipo disponible</h2>
          <p className="mt-1 text-sm text-slate-400">
            Bloquee el equipo para que un estudiante lo desbloquee con su código de 2 dígitos.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="etiqueta">Equipo</p>
            <p className="text-sm font-semibold text-slate-100">{disp.equipo.nombre || '—'}</p>
            <p className="font-mono text-xs text-slate-500">{disp.equipo.codigoPatrimonial}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="etiqueta">Laboratorio</p>
            <p className="text-sm font-semibold text-slate-100">{disp.laboratorio.nombre}</p>
            <p className="text-xs text-slate-500">ID {disp.laboratorio.id}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            disabled={bloqueando}
            onClick={onBloquear}
            className="btn-primario w-full max-w-sm !bg-rose-500 !py-4 text-base hover:!bg-rose-400"
          >
            {bloqueando ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/40 border-t-slate-950" />
                Generando código…
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                </svg>
                Bloquear equipo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}