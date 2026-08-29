import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EventoParticipanteService } from '../services/eventoParticipante.service';

export const LandingFIRNTView: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoParticipante, setTipoParticipante] = useState('ESTUDIANTE');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [configPago, setConfigPago] = useState<any>(null);

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const config = await EventoParticipanteService.obtenerConfiguracionPago();
        setConfigPago(config);
      } catch (err) {
        console.error('Error al cargar configuración de pago:', err);
      }
    };
    cargarConfiguracion();
  }, []);

  const handleContinuarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !correo || !telefono) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }
    setErrorMsg('');
    setModalAbierto(true);
  };

  const handleFinalizarPreinscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroTransaccion) {
      setErrorMsg('Debes ingresar el número de comprobante/transacción.');
      return;
    }

    setCargando(true);
    setErrorMsg('');

    try {
      await EventoParticipanteService.registrar({
        nombre,
        apellido,
        correo,
        telefono,
        tipoParticipante,
        numeroTransaccion,
      });
      setMensajeExito(true);
      setModalAbierto(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Error al procesar la preinscripción.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Marca de agua del fondo aclarada y ampliada */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/media/imagenes/WhatsApp Image 2026-08-13 at 11.28.00 AM.jpeg"
          alt="CITREN 2026 Watermark"
          className="w-[85%] max-w-5xl object-contain opacity-20 filter contrast-125 transform rotate-[-5deg] scale-110 select-none"
        />
      </div>

      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-slate-800 bg-slate-950/70 backdrop-blur-md relative z-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block">
            Universidad Autónoma Juan Misael Saracho
          </span>
          <h1 className="text-sm font-bold text-slate-200">
            Facultad de Ingeniería de Recursos Naturales y Tecnologías
          </h1>
        </div>
        <Link
          to="/login"
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded border border-slate-700/60 hover:border-emerald-500/50"
        >
          Acceder al Sistema →
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 w-full flex-grow flex flex-col gap-10 relative z-10">
        <section className="bg-slate-800/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
                CITREN 2026 · Evento Vigente
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Congreso de Tecnologías e Ingeniería de Recursos Naturales
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Participa en las ponencias magistrales, talleres especializados y accede a nuestras tutorías oficiales diseñadas para potenciar tu perfil profesional.
              </p>
              <div className="flex gap-3 pt-2">
                <span className="text-xs bg-slate-700/60 px-3 py-1.5 rounded text-slate-300 border border-slate-700">
                  📅 15 - 18 de Agosto
                </span>
                <span className="text-xs bg-slate-700/60 px-3 py-1.5 rounded text-slate-300 border border-slate-700">
                  📍 Campus Yacuiba
                </span>
              </div>
            </div>

            {/* Publicidad Oficial con el Banner */}
            <div className="w-full md:w-80 h-52 rounded-xl overflow-hidden shadow-xl relative border border-slate-700/80 group">
              <img
                src="/media/imagenes/WhatsApp Image 2026-08-13 at 11.28.00 AM.jpeg"
                alt="Publicidad Oficial CITREN 2026"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/40 uppercase tracking-wider">
                Publicidad Oficial
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-800/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto w-full shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">Registro de Participantes</h3>
            <p className="text-xs text-slate-400 mt-1">
              Completa tus datos personales para avanzar a la verificación de pago.
            </p>
          </div>

          {mensajeExito ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-center space-y-2">
              <p className="font-bold">¡Preinscripción realizada con éxito!</p>
              <p className="text-xs text-slate-300">
                Tu registro ha sido recibido correctamente y se encuentra pendiente de verificación de pago.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContinuarPago} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded text-xs text-center">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@uajms.edu.bo"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="70000000"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Participante</label>
                <select
                  value={tipoParticipante}
                  onChange={(e) => setTipoParticipante(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="PROFESIONAL">Profesional</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                Continuar al Pago →
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Modal de Validación de Pago */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 text-base">Validación de Pago del Evento</h4>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {configPago && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Banco:</span>
                  <span className="font-medium text-slate-200">{configPago.banco}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">N° Cuenta:</span>
                  <span className="font-medium text-slate-200">{configPago.numeroCuenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular:</span>
                  <span className="font-medium text-slate-200">{configPago.nombreReceptor}</span>
                </div>
                {configPago.qrImagenUrl && (
                  <div className="flex justify-center pt-2">
                    <img
                      src={configPago.qrImagenUrl}
                      alt="QR de Pago"
                      className="w-36 h-36 object-contain rounded border border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleFinalizarPreinscripcion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  N° de Comprobante / Transacción
                </label>
                <input
                  type="text"
                  required
                  value={numeroTransaccion}
                  onChange={(e) => setNumeroTransaccion(e.target.value)}
                  placeholder="Ej. 98451236"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400">{errorMsg}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {cargando ? 'Procesando...' : 'Finalizar Preinscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 relative z-10 bg-slate-950/50">
        Sistema de Gestión de Laboratorios y Eventos — UAJMS FIRNT Yacuiba
      </footer>
    </div>
  );
};
