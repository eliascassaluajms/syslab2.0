import { useState } from 'react';
import type { AppConfig } from '../../../shared/types';

interface Props {
  config: AppConfig | null;
  onGuardar: () => void;
  onCerrar: () => void;
}

export default function VistaConfiguracion({ config, onGuardar, onCerrar }: Props) {
  const [apiUrl, setApiUrl] = useState(config?.apiUrl ?? '');
  const [modoKiosk, setModoKiosk] = useState(config?.modoKiosk ?? true);
  const [bloquearOS, setBloquearOS] = useState(config?.bloquearOS ?? false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await window.syslabLock.saveConfig({
        ...(config ?? { apiUrl: '', nombreEquipo: '', modoKiosk: true, bloquearOS: false, dispositivo: null }),
        apiUrl: apiUrl.trim(),
        modoKiosk,
        bloquearOS,
      });
      onGuardar();
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  const desvincular = async () => {
    const { dispositivo } = config ?? { dispositivo: null };
    const nombre = dispositivo?.equipo.nombre || dispositivo?.equipo.codigoPatrimonial || 'este equipo';
    const confirmado = confirm(`¿Desvincular ${nombre}? El equipo quedará disponible sin bloqueo.`);
    if (!confirmado) return;
    await window.syslabLock.saveConfig({ ...(config ?? { apiUrl: '', nombreEquipo: '', modoKiosk: true, bloquearOS: false, dispositivo: null }), dispositivo: null });
    onGuardar();
    onCerrar();
  };

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-100">Configuración</h2>

        <div className="space-y-5">
          <div>
            <label className="etiqueta" htmlFor="cfgApiUrl">URL del servidor</label>
            <input
              id="cfgApiUrl"
              className="input-syslab"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm text-slate-300">
                Mostrar la pantalla de bloqueo a pantalla completa
                <span className="block text-xs text-slate-500">Evita que se cierre sin autorización.</span>
              </span>
              <input
                type="checkbox"
                checked={modoKiosk}
                onChange={(e) => setModoKiosk(e.target.checked)}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm text-slate-300">
                Bloquear la sesión del sistema al bloquear
                <span className="block text-xs text-slate-500">Windows y la mayoría de escritorios Linux.</span>
              </span>
              <input
                type="checkbox"
                checked={bloquearOS}
                onChange={(e) => setBloquearOS(e.target.checked)}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
            <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn-primario flex-1">
              Guardar cambios
            </button>
            <button type="button" onClick={onCerrar} disabled={guardando} className="btn-secundario">
              Cancelar
            </button>
          </div>

          {config?.dispositivo && (
            <button
              type="button"
              onClick={() => void desvincular()}
              className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              Desvincular equipo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}