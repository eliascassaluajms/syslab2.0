import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppConfig, EstadoDesafio, RespuestaDesafio } from '../../../shared/types';
import { bloquearEquipo, consultarDesafio } from '../services/api';

export type FaseBloqueo =
  | 'disponible'
  | 'bloqueando'
  | 'bloqueado'
  | 'desbloqueado'
  | 'expirado'
  | 'error';

interface BloqueoRegistrado {
  desafio: RespuestaDesafio;
  qr: string;
  iniciadoEn: number;
}

export function usarBloqueo(
  config: AppConfig | null,
  onFinalizado: () => void,
) {
  const [fase, setFase] = useState<FaseBloqueo>('disponible');
  const [registrado, setRegistrado] = useState<BloqueoRegistrado | null>(null);
  const [estadoConsulta, setEstadoConsulta] = useState<EstadoDesafio | null>(null);
  const [mensajeError, setMensajeError] = useState('');
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRestauraRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpiarTimers = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    if (timeoutRestauraRef.current) {
      clearTimeout(timeoutRestauraRef.current);
      timeoutRestauraRef.current = null;
    }
  }, []);

  const terminarPendiente = useCallback(() => {
    limpiarTimers();
    setRegistrado(null);
    setEstadoConsulta(null);
    setFase('disponible');
    void window.syslabLock.setKiosk(false);
    onFinalizado();
  }, [limpiarTimers, onFinalizado]);

  useEffect(() => {
    return () => {
      limpiarTimers();
      void window.syslabLock.setKiosk(false);
    };
  }, [limpiarTimers]);

  const bloquear = useCallback(async () => {
    if (!config?.dispositivo) return;
    setMensajeError('');
    setFase('bloqueando');
    try {
      const desafio = await bloquearEquipo(config.apiUrl, config.dispositivo.deviceToken);
      const qr = await import('qrcode').then(({ toDataURL }) =>
        toDataURL(JSON.stringify({ d: desafio.desafioId, c: desafio.codigo, l: desafio.laboratorio.id }), {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
        }),
      );

      if (config.bloquearOS) {
        void window.syslabLock.bloquearOS();
      }
      void window.syslabLock.setKiosk(true);

      setRegistrado({ desafio, qr, iniciadoEn: Date.now() });
      setFase('bloqueado');
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : 'No se pudo bloquear el equipo.');
      setFase('error');
    }
  }, [config]);

  useEffect(() => {
    if (fase !== 'bloqueado' || !registrado) return;

    const interrogar = async () => {
      if (!config?.dispositivo) return;
      try {
        const estado = await consultarDesafio(
          config.apiUrl,
          config.dispositivo.deviceToken,
          registrado.desafio.desafioId,
        );
        setEstadoConsulta(estado);

        if (estado.estado === 'LIBERADO') {
          limpiarTimers();
          setFase('desbloqueado');
          void window.syslabLock.setKiosk(false);

          timeoutRestauraRef.current = setTimeout(() => {
            setRegistrado(null);
            setEstadoConsulta(null);
            setFase('disponible');
            onFinalizado();
          }, 8000);
        } else if (estado.estado === 'EXPIRADO' || estado.estado === 'CANCELADO') {
          limpiarTimers();
          setFase('expirado');
          void window.syslabLock.setKiosk(false);
        }
      } catch {
        // Si falla una consulta puntual se reintenta en el siguiente ciclo.
      }
    };

    void interrogar();
    intervaloRef.current = setInterval(() => void interrogar(), 2500);
    return () => limpiarTimers();
  }, [fase, registrado, config, limpiarTimers, onFinalizado]);

  return {
    fase,
    registrado,
    estadoConsulta,
    mensajeError,
    bloquear,
    terminarPendiente,
  };
}