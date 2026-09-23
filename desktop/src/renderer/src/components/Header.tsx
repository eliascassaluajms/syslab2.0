import type { AppConfig } from '../../../shared/types';

interface Props {
  config: AppConfig | null;
  sinVincular: boolean;
  mostrandoConfiguracion: boolean;
  onAbrirConfiguracion: () => void;
  onCerrarConfiguracion: () => void;
}

export default function Header({
  config,
  sinVincular,
  mostrandoConfiguracion,
  onAbrirConfiguracion,
  onCerrarConfiguracion,
}: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight tracking-tight text-slate-100">SysLab Lock</h1>
          <p className="text-[11px] leading-tight text-slate-500">Bloqueo y desbloqueo de equipos</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!sinVincular && config?.dispositivo && (
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold text-slate-200">{config.dispositivo.equipo.nombre}</p>
            <p className="text-[11px] text-slate-500">{config.dispositivo.laboratorio.nombre}</p>
          </div>
        )}
        <button
          type="button"
          onClick={mostrandoConfiguracion ? onCerrarConfiguracion : onAbrirConfiguracion}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {mostrandoConfiguracion ? 'Cerrar' : 'Configuración'}
        </button>
      </div>
    </header>
  );
}