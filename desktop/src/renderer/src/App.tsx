import { useCallback, useEffect, useState } from 'react';
import type { AppConfig } from '../../shared/types';
import Header from './components/Header';
import VistaDisponible from './views/VistaDisponible';
import VistaBloqueada from './views/VistaBloqueada';
import VistaVinculacion from './views/VistaVinculacion';
import VistaConfiguracion from './views/VistaConfiguracion';
import VistaError from './views/VistaError';
import VistaDesbloqueado from './views/VistaDesbloqueado';
import VistaExpirado from './views/VistaExpirado';
import { usarBloqueo } from './hooks/useBloqueo';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null | undefined>(undefined);
  const [enConfiguracion, setEnConfiguracion] = useState(false);

  const refrescarConfig = useCallback(async () => {
    setConfig(await window.syslabLock.loadConfig());
  }, []);

  useEffect(() => {
    void refrescarConfig();
  }, [refrescarConfig]);

  const alFinalizar = useCallback(() => {
    void refrescarConfig();
  }, [refrescarConfig]);

  const { fase, registrado, estadoConsulta, mensajeError, bloquear, terminarPendiente } = usarBloqueo(
    config ?? null,
    alFinalizar,
  );

  if (config === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <p className="animate-pulse text-sm text-slate-500">Cargando configuración…</p>
      </div>
    );
  }

  if (fase === 'bloqueado' && registrado) {
    return <VistaBloqueada registrado={registrado} estado={estadoConsulta} />;
  }

  if (fase === 'desbloqueado') {
    return <VistaDesbloqueado registrado={registrado} />;
  }

  if (fase === 'expirado') {
    const expiro = estadoConsulta?.estado === 'CANCELADO' ? 'cancelado' : 'expirado';
    return <VistaExpirado motivo={expiro} onReintentar={bloquear} />;
  }

  if (fase === 'error') {
    return <VistaError mensaje={mensajeError} onReintentar={bloquear} onVolver={terminarPendiente} />;
  }

  const sinVincular = !config?.dispositivo;
  const mostrandoPantallaBase = enConfiguracion || sinVincular;

  return (
    <div className="flex h-full flex-col">
      <Header
        config={config}
        sinVincular={sinVincular}
        mostrandoConfiguracion={enConfiguracion}
        onAbrirConfiguracion={() => setEnConfiguracion(true)}
        onCerrarConfiguracion={() => setEnConfiguracion(false)}
      />
      {mostrandoPantallaBase ? (
        enConfiguracion ? (
          <VistaConfiguracion config={config} onGuardar={refrescarConfig} onCerrar={() => setEnConfiguracion(false)} />
        ) : (
          <VistaVinculacion config={config} onVinculado={refrescarConfig} />
        )
      ) : (
        <VistaDisponible config={config} bloqueando={fase === 'bloqueando'} onBloquear={bloquear} />
      )}
    </div>
  );
}