import { useEffect, useState } from 'react';
import type { EstadoDesafio, RespuestaDesafio } from '../../../shared/types';

interface Props {
  registrado: { desafio: RespuestaDesafio; qr: string; iniciadoEn: number };
  estado: EstadoDesafio | null;
}

export default function VistaBloqueada({ registrado, estado }: Props) {
  const { desafio, qr } = registrado;
  const [tiempoRestante, setTiempoRestante] = useState(120);

  useEffect(() => {
    const actualizar = () => {
      const restante = Math.max(
        0,
        Math.floor((new Date(desafio.expiraEn).getTime() - Date.now()) / 1000),
      );
      setTiempoRestante(restante);
    };
    actualizar();
    const timer = setInterval(actualizar, 1000);
    return () => clearInterval(timer);
  }, [desafio.expiraEn]);

  const progreso = Math.max(0, Math.min(1, tiempoRestante / 120));

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-950 p-8">
      <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-10">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">
            {desafio.laboratorio.nombre} · {desafio.equipo.codigoPatrimonial}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-100">Equipo bloqueado</h2>
          <p className="mt-1 text-sm text-slate-400">
            Espere a que el estudiante ingrese el código o escanee el QR para desbloquear.
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 md:flex-row md:justify-between md:gap-16">
          <div className="text-center">
            <p className="etiqueta">Código de desbloqueo</p>
            <div className="flex items-center justify-center gap-3">
              {desafio.codigo.split('').map((digito, i) => (
                <span
                  key={i}
                  className="flex h-28 w-20 items-center justify-center rounded-2xl border border-slate-600 bg-slate-950 font-mono text-7xl font-bold text-cyan-300 shadow-inner"
                >
                  {digito}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">El código se muestra una sola vez.</p>
          </div>

          <div className="flex flex-col items-center">
            <img src={qr} alt="Código QR de desbloqueo" className="h-52 w-52 rounded-xl bg-white p-2" />
            <p className="mt-3 text-xs text-slate-500">Escanee para desbloquear</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Vigencia del código</span>
            <span
              className={`font-mono text-sm font-bold ${
                tiempoRestante <= 20 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {Math.floor(tiempoRestante / 60)}:{String(tiempoRestante % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                tiempoRestante <= 20 ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${progreso * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}