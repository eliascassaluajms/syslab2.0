import { useEffect, useState } from 'react';
import type { AppConfig, SistemaInfo } from '../../../shared/types';
import { probarConexion, registrarDispositivo } from '../services/api';

interface Props {
  config: AppConfig | null;
  onVinculado: () => void;
}

export default function VistaVinculacion({ config, onVinculado }: Props) {
  const [info, setInfo] = useState<SistemaInfo | null>(null);
  const [apiUrl, setApiUrl] = useState(config?.apiUrl ?? '');
  const [authToken, setAuthToken] = useState('');
  const [codigoPatrimonial, setCodigoPatrimonial] = useState('');
  const [laboratorioId, setLaboratorioId] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [conectado, setConectado] = useState<boolean | null>(null);

  useEffect(() => {
    void window.syslabLock.getSistemaInfo().then((i) => {
      setInfo(i);
      setNombreEquipo((prev) => prev || i.hostname);
    });
  }, []);

  const verificarConexion = async () => {
    setError('');
    setConectado(null);
    const ok = await probarConexion(apiUrl);
    setConectado(ok);
  };

  const vincular = async () => {
    setError('');
    setCargando(true);
    try {
      const labId = Number(laboratorioId);
      if (!codigoPatrimonial.trim() || !labId || Number.isNaN(labId)) {
        throw new Error('Ingrese el código patrimonial y el ID del laboratorio.');
      }
      if (!apiUrl.trim() || !authToken.trim()) {
        throw new Error('Indique la URL del servidor y su token de administrador.');
      }

      const dispositivo = await registrarDispositivo(apiUrl.trim(), authToken.trim(), {
        codigoPatrimonial: codigoPatrimonial.trim(),
        laboratorioId: labId,
        nombreEquipo: nombreEquipo.trim() || info?.hostname,
      });

      await window.syslabLock.saveConfig({
        ...(config ?? { apiUrl: '', nombreEquipo: '', modoKiosk: true, bloquearOS: false, dispositivo: null }),
        apiUrl: apiUrl.trim(),
        nombreEquipo: nombreEquipo.trim() || info?.hostname || '',
        dispositivo,
      });
      onVinculado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo vincular el equipo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-100">Vincular este equipo</h2>
          <p className="mt-1 text-sm text-slate-400">
            Asocie esta PC a un equipo del laboratorio para habilitar el bloqueo con código de desbloqueo.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="apiUrl">URL del servidor SysLab</label>
            <div className="flex gap-2">
              <input
                id="apiUrl"
                className="input-syslab"
                placeholder="https://api.syslab.edu.bo"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void verificarConexion()}
                className="btn-secundario shrink-0 px-4 py-2 text-xs"
              >
                Probar
              </button>
            </div>
            {conectado === true && <p className="mt-1 text-xs text-emerald-400">Servidor accesible.</p>}
            {conectado === false && <p className="mt-1 text-xs text-rose-400">No se pudo conectar al servidor.</p>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="authToken">Token de administrador / jefatura</label>
            <input
              id="authToken"
              type="password"
              className="input-syslab"
              placeholder="JWT del encargado del laboratorio"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Sesión con permiso <code className="text-cyan-400">equipos:crear</code>. No se almacena en el equipo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className="etiqueta" htmlFor="codigoPatrimonial">Código patrimonial</label>
              <input
                id="codigoPatrimonial"
                className="input-syslab font-mono"
                placeholder="EQ-0001"
                value={codigoPatrimonial}
                onChange={(e) => setCodigoPatrimonial(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="etiqueta" htmlFor="laboratorioId">ID de laboratorio</label>
              <input
                id="laboratorioId"
                type="number"
                className="input-syslab"
                placeholder="1"
                value={laboratorioId}
                onChange={(e) => setLaboratorioId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="etiqueta" htmlFor="nombreEquipo">Nombre del equipo</label>
            <input
              id="nombreEquipo"
              className="input-syslab"
              placeholder={info?.hostname || 'Nombre visible de esta PC'}
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}

          <button type="button" onClick={() => void vincular()} disabled={cargando} className="btn-primario w-full">
            {cargando ? 'Vinculando…' : 'Vincular equipo'}
          </button>
        </div>
      </div>
    </div>
  );
}