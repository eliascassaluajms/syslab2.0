import React from 'react';
import { Link } from 'react-router-dom'; // Asumiendo que usas react-router-dom

export const LandingFIRNTView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* 🔹 ENCABEZADO DISCRETO */}
      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block">
            Universidad Autónoma Juan Misael Saracho
          </span>
          <h1 className="text-sm font-bold text-slate-200">
            Facultad de Ciencias de la Ingeniería de Recursos Naturales y Tecnologías
          </h1>
        </div>
        {/* Enlace discreto al login existente */}
        <Link 
          to="/login" 
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded border border-slate-700/60 hover:border-emerald-500/50"
        >
          Acceder al Sistema →
        </Link>
      </header>

      {/* 🔹 CONTENIDO PRINCIPAL (SIN SIDEBAR) */}
      <main className="max-w-5xl mx-auto px-4 py-10 w-full flex-grow flex flex-col gap-10">
        
        {/* SECCIÓN HERO / CARRUSEL (Hardcodeado temporalmente) */}
        <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
                Evento Vigente 2026
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Congreso de Tecnologías e Ingeniería de Recursos Naturales
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Participa en las ponencias magistrales, talleres especializados y accede a nuestras tutorías académicas oficiales diseñadas para potenciar tu perfil profesional.
              </p>
              <div className="flex gap-3 pt-2">
                <span className="text-xs bg-slate-700/50 px-3 py-1.5 rounded text-slate-300">📅 15 - 18 de Agosto</span>
                <span className="text-xs bg-slate-700/50 px-3 py-1.5 rounded text-slate-300">📍 Campus Yacuiba</span>
              </div>
            </div>

            {/* Simulación visual del carrusel / Banner promocional */}
            <div className="w-full md:w-80 h-48 bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-xl p-5 flex flex-col justify-between shadow-inner relative">
              <div className="text-white/80 text-xs font-semibold">PUBLICIDAD OFICIAL</div>
              <div>
                <h3 className="text-lg font-bold text-white">Ciclo de Tutorías Técnicas</h3>
                <p className="text-xs text-white/90 mt-1">Refuerza tus habilidades en redes, programación y bases de datos.</p>
              </div>
              <div className="flex justify-between items-center text-xs text-white/70">
                <span>Cupos Limitados</span>
                <span className="underline cursor-pointer text-white font-semibold">Ver más</span>
              </div>
            </div>
          </div>
        </section>

        {/* 🔹 FORMULARIO DE REGISTRO RÁPIDO PARA PARTICIPAR */}
        <section className="bg-slate-800/20 border border-slate-800/80 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto w-full">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">Registro de Participantes</h3>
            <p className="text-xs text-slate-400 mt-1">Regístrate para asegurar tu certificación y acceso a las tutorías.</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Registro simulado con éxito'); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  placeholder="Ej. Juan Pérez" 
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Correo Institucional / Personal</label>
                <input 
                  type="email" 
                  placeholder="correo@uajms.edu.bo" 
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Selecciona tu interés principal</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
                <option>Congreso General y Ponencias</option>
                <option>Tutorías de Programación y Redes</option>
                <option>Talleres Prácticos de Laboratorio</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              Completar Registro
            </button>
          </form>
        </section>

      </main>

      {/* PIE DE PÁGINA */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
        Sistema de Gestión de Laboratorios y Eventos — UAJMS FCIRNT Yacuiba
      </footer>

    </div>
  );
};