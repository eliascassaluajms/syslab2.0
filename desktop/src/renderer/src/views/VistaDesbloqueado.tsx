import type { RespuestaDesafio } from '../../../shared/types';

interface Props {
  registrado: { desafio: RespuestaDesafio; iniciadoEn: number } | null;
}

export default function VistaDesbloqueado({ registrado }: Props) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-100">Equipo desbloqueado</h2>
        <p className="mt-2 text-sm text-slate-400">
          {registrado ? `El equipo ${registrado.desafio.equipo.nombre || registrado.desafio.equipo.codigoPatrimonial} ha sido liberado.` : 'El equipo ha sido liberado.'}
        </p>
        <p className="mt-6 text-xs text-slate-500">El equipo volverá a estar disponible en unos segundos.</p>
      </div>
    </div>
  );
}