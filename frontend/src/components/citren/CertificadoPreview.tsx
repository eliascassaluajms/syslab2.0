import React from 'react';

interface CertificadoPreviewProps {
  nombre: string;
  apellido: string;
}

export const CertificadoPreview: React.FC<CertificadoPreviewProps> = ({ nombre, apellido }) => {
  const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`.trim();

  return (
    <div className="w-full bg-slate-950/80 rounded-2xl border border-sky-500/20 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm" aria-hidden="true">🎓</span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Vista Previa del Certificado Oficial
          </span>
        </div>
        <span className="self-start text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono">
          Carga Horaria: 40 hrs CEUB
        </span>
      </div>

      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl p-5 sm:p-6 border-2 border-amber-500/30 shadow-inner">
        <div className="absolute inset-1.5 border border-sky-500/20 rounded-lg pointer-events-none" />

        <div className="text-center space-y-1 relative z-10">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            Universidad Autónoma Juan Misael Saracho - FCIY
          </p>
          <h4 className="text-xs sm:text-sm font-black tracking-wider text-amber-300 uppercase">
            Certificado de Acreditación
          </h4>
          <p className="text-[8px] sm:text-[9px] text-slate-400">
            1<sup>er</sup> Congreso Internacional de Tecnología y Recursos Naturales (CITREN 2026)
          </p>
        </div>

        <div className="my-5 text-center relative z-10">
          <p className="text-[10px] text-slate-400 italic mb-1">
            Se otorga el presente reconocimiento a:
          </p>
          <div className="min-h-[36px] flex items-center justify-center px-4 py-1.5 bg-slate-950/70 border border-sky-500/30 rounded-lg">
            {nombreCompleto ? (
              <span className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-sky-300 uppercase tracking-wider break-words text-center">
                {nombreCompleto}
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic font-mono animate-pulse text-center">
                [Tus Nombres y Apellidos aparecerán aquí]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[8px] text-slate-400 relative z-10">
          <div className="text-center w-24 border-t border-slate-700 pt-1">
            <span className="block text-[7px] text-slate-400">Firma Decanatura</span>
            <span className="font-semibold text-slate-300">FCIY - UAJMS</span>
          </div>
          <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400 font-bold shadow-sm">
            CEUB
          </div>
          <div className="text-center w-24 border-t border-slate-700 pt-1">
            <span className="block text-[7px] text-slate-400">Jefatura Laboratorios</span>
            <span className="font-semibold text-slate-300">Comité Organizador</span>
          </div>
        </div>
      </div>

      {nombreCompleto && (
        <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl relative z-10">
          <span className="text-xs" aria-hidden="true">⚠️</span>
          <span>
            Verifica acentos, mayúsculas y nombres completos. El certificado se imprimirá automáticamente con estos datos exactos.
          </span>
        </div>
      )}
    </div>
  );
};
