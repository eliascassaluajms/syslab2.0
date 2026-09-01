import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EventoParticipanteService } from '../services/eventoParticipante.service';
import { activityService } from '../services/activity.service';
import { httpClient } from '../services/httpClient';
interface IActividad {
  id: string | number;
  title: string;
  description?: string;
  bannerUrl?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fecha?: string;
}

interface IConfigPago {
  banco: string;
  numeroCuenta: string;
  nombreReceptor: string;
  qrImagenUrl?: string;
}

interface IPreinscripcionPayload {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo: string;
  activityId: string | number;
  codigoTransaccion: string;
  comprobanteUrl?: string;
}

export const LandingFIRNTView: React.FC = () => {
  const [actividades, setActividades] = useState<IActividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<IActividad | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoParticipante, setTipoParticipante] = useState('ESTUDIANTE');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [monto, setMonto] = useState<string | number>('');
  const [configPago, setConfigPago] = useState<IConfigPago | null>(null);

  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState<number>(() => Date.now());

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const config = await (EventoParticipanteService as any).obtenerConfiguracionPago?.();
        if (config) {
          setConfigPago(config);
        }

        const listaActividades = await activityService.listar();
        const items: IActividad[] = Array.isArray(listaActividades) ? listaActividades : [];
        setActividades(items);
      } catch (err) {
        console.error('Error al cargar catálogos e información inicial:', err);
      }
    };
    cargarCatalogos();
  }, []);

  // Filtrado de eventos vigentes por fecha
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const eventosVigentes = actividades.filter((act) => {
    const fechaRef = act.fechaFin || act.fecha || act.fechaInicio;
    if (!fechaRef) return true;
    const fechaEvento = new Date(fechaRef);
    return fechaEvento >= hoy;
  });

  const ultimosTresVigentes = eventosVigentes.slice(-3);

  useEffect(() => {
    if (ultimosTresVigentes.length > 0) {
      if (!actividadSeleccionada || !ultimosTresVigentes.some((a) => a.id === actividadSeleccionada.id)) {
        setActividadSeleccionada(ultimosTresVigentes[0]);
        setCurrentIndex(0);
      }
    }
  }, [actividades]);

  const siguienteSlide = () => {
    if (ultimosTresVigentes.length === 0) return;
    const nuevoIndice = (currentIndex + 1) % ultimosTresVigentes.length;
    setCurrentIndex(nuevoIndice);
    setActividadSeleccionada(ultimosTresVigentes[nuevoIndice]);
  };

  const anteriorSlide = () => {
    if (ultimosTresVigentes.length === 0) return;
    const nuevoIndice = (currentIndex - 1 + ultimosTresVigentes.length) % ultimosTresVigentes.length;
    setCurrentIndex(nuevoIndice);
    setActividadSeleccionada(ultimosTresVigentes[nuevoIndice]);
  };

  const registrarPreinscripcion = async (payload: IPreinscripcionPayload) => {
    const response = await httpClient.post('/evento-participantes', payload);
    return response.data;
  };

  const handleContinuarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !correo || !telefono || !actividadSeleccionada) {
      setErrorMsg('Por favor completa todos los campos requeridos y selecciona un evento.');
      return;
    }

    const fechaRef = actividadSeleccionada.fechaFin || actividadSeleccionada.fecha || actividadSeleccionada.fechaInicio;
    if (fechaRef) {
      const fechaEvento = new Date(fechaRef);
      fechaEvento.setHours(23, 59, 59, 999);
      if (fechaEvento < new Date()) {
        setErrorMsg('No es posible realizar la preinscripción: la fecha de este evento ya ha expirado.');
        return;
      }
    }

    setErrorMsg('');
    setModalAbierto(true);
  };

  const handleFinalizarPreinscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificación rápida en frontend contra envíos instantáneos / bots
    if ((Date.now() - formStartTime) < 2500 || honeypot !== '') {
      setErrorMsg('Por favor completa el formulario de manera habitual.');
      return;
    }

    const codigoLimpio = numeroTransaccion.trim();

    const regexTransaccion = /^\d{6,25}$/;
    if (!regexTransaccion.test(codigoLimpio)) {
      setErrorMsg('El número de comprobante o transacción debe contener exclusivamente dígitos numéricos (entre 6 y 25 caracteres).');
      return;
    }

    if (!actividadSeleccionada) {
      setErrorMsg('No hay una actividad seleccionada.');
      return;
    }

    setCargando(true);
    setErrorMsg('');

    try {
      await registrarPreinscripcion({
        nombre,
        apellido,
        correo,
        telefono,
        tipo: tipoParticipante,
        activityId: actividadSeleccionada.id,
        codigoTransaccion: codigoLimpio,
        comprobanteUrl: (window as any).__comprobanteUrlSubido || undefined,
        honeypot,
        formStartTime,
      } as any);
      setMensajeExito(true);
      setModalAbierto(false);
      setNumeroTransaccion('');
      delete (window as any).__comprobanteUrlSubido;
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Error al procesar la preinscripción. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Fondo institucional CITREN 2026 con marca de agua */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center overflow-hidden z-0">
        <img
          src="/media/imagenes/fondo-citren.jpeg"
          alt="CITREN 2026 Background"
          className="w-[120%] h-[120%] object-contain filter grayscale contrast-200"
          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
        />
      </div>

      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-slate-800 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block">
            Universidad Autónoma Juan Misael Saracho
          </span>
          <h1 className="text-sm font-bold text-slate-200">
            Facultad de Ingeniería de Recursos Naturales y Tecnologías — CITREN 2026
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
        {ultimosTresVigentes.length === 0 ? (
          <div className="bg-slate-800/60 backdrop-blur-md border border-slate-800 rounded-2xl p-10 text-center space-y-3 shadow-2xl">
            <h2 className="text-xl font-bold text-white">No hay eventos vigentes disponibles</h2>
            <p className="text-slate-400 text-sm">
              En este momento no se encuentran actividades o congresos activos para preinscripción. Por favor, vuelve más tarde.
            </p>
          </div>
        ) : (
          <>
            {/* Carrusel de Eventos / CITREN 2026 con Fondo Promocional */}
            {actividadSeleccionada && (
              <section className="bg-slate-800/70 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Fondo sutil del logotipo CITREN dentro de la tarjeta */}
                <div className="absolute right-0 bottom-0 w-96 h-96 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                  <img src="/media/imagenes/CITREN-logo.jpeg" alt="Watermark" className="w-full h-full object-contain" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
                        CITREN 2026 — Vigente ({currentIndex + 1} de {ultimosTresVigentes.length})
                      </span>
                      {actividadSeleccionada.fechaFin || actividadSeleccionada.fecha || actividadSeleccionada.fechaInicio ? (
                        <span className="text-xs text-slate-300 font-mono bg-slate-900/60 px-2 py-1 rounded border border-slate-700">
                          📅 {actividadSeleccionada.fechaFin || actividadSeleccionada.fecha || actividadSeleccionada.fechaInicio}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight text-white">
                      {actividadSeleccionada.title}
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {actividadSeleccionada.description || 'Participa en el 1er Congreso Internacional de Tecnología y Recursos Naturales.'}
                    </p>

                    {ultimosTresVigentes.length > 1 && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={anteriorSlide}
                          className="bg-slate-900/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer shadow"
                        >
                          ← Anterior
                        </button>
                        <button
                          onClick={siguienteSlide}
                          className="bg-slate-900/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer shadow"
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Banner / Afiche con la imagen publicitaria del congreso */}
                  <div className="w-full md:w-80 h-52 rounded-xl overflow-hidden shadow-xl relative border border-slate-700/90 group bg-slate-950 shrink-0">
                    <img
                      src={actividadSeleccionada.bannerUrl || '/media/imagenes/fondo-citren.jpeg'}
                      alt={actividadSeleccionada.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/40 uppercase tracking-wider">
                      Afiche Oficial CITREN
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Formulario de Preinscripción */}
            <section className="bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto w-full shadow-2xl relative">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">Preinscripción — CITREN 2026</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona el evento vigente e ingresa tus datos completos para la confirmación y certificado del congreso.
                </p>
              </div>

              {mensajeExito ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-6 rounded-xl text-center space-y-3">
                  <p className="font-bold text-lg">¡Preinscripción realizada con éxito!</p>
                  <p className="text-xs text-slate-300">
                    Tu registro al congreso fue recibido correctamente. El equipo administrativo verificará tu transacción.
                  </p>
                  <button
                    onClick={() => setMensajeExito(false)}
                    className="mt-2 text-xs text-emerald-400 underline hover:text-emerald-300 cursor-pointer"
                  >
                    Realizar otra inscripción
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContinuarPago} className="space-y-4">
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded text-xs text-center">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Seleccionar Evento / Congreso Vigente *</label>
                    <select
                      value={actividadSeleccionada?.id || ''}
                      onChange={(e) => {
                        const act = eventosVigentes.find((a) => String(a.id) === e.target.value);
                        if (act) {
                          setActividadSeleccionada(act);
                          const idx = ultimosTresVigentes.findIndex((a) => a.id === act.id);
                          if (idx !== -1) setCurrentIndex(idx);
                        }
                      }}
                      className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {eventosVigentes.length === 0 ? (
                        <option value="" disabled>No hay eventos vigentes disponibles</option>
                      ) : (
                        eventosVigentes.map((act) => (
                          <option key={act.id} value={act.id}>
                            {act.title} {act.fechaFin || act.fecha || act.fechaInicio ? `(📅 ${act.fechaFin || act.fecha || act.fechaInicio})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Juan Carlos"
                        className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="Ej. Pérez Baldiviezo"
                        className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="usuario@uajms.edu.bo"
                        className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="70000000"
                        className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Participante</label>
                    <select
                      value={tipoParticipante}
                      onChange={(e) => setTipoParticipante(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ESTUDIANTE">Estudiante</option>
                      <option value="PROFESIONAL">Profesional</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
                  >
                    Continuar a Verificación de Pago →
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modal de Confirmación de Pago */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 text-sm">Resumen de Inscripción & Pago — CITREN</h4>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <img
                src={actividadSeleccionada?.bannerUrl || '/media/imagenes/default-banner.jpeg'}
                alt="Miniatura"
                className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{actividadSeleccionada?.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{nombre} {apellido}</p>
                <p className="text-[10px] text-emerald-400 font-mono truncate">{correo}</p>
              </div>
            </div>

            {configPago && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Banco:</span><span className="font-medium text-slate-200">{configPago.banco}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">N° Cuenta:</span><span className="font-medium text-slate-200">{configPago.numeroCuenta}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Titular:</span><span className="font-medium text-slate-200">{configPago.nombreReceptor}</span></div>
                {configPago.qrImagenUrl && (
                  <div className="flex justify-center pt-2">
                    <img src={configPago.qrImagenUrl} alt="QR de Pago" className="w-28 h-28 object-contain rounded border border-slate-700" />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleFinalizarPreinscripcion} className="space-y-3">
              {/* Campo trampa Honeypot (invisible para personas reales) */}
              <div className="opacity-0 absolute -left-[9999px] top-0 h-0 w-0 z-[-1] pointer-events-none" aria-hidden="true">
                <label htmlFor="user_fax_website">No completar este campo</label>
                <input
                  id="user_fax_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2 rounded text-xs text-center">
                  {errorMsg}
                </div>
              )}

              {/* Sección de Subida de Comprobante y Escaneo OCR */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Comprobante de Pago (Imagen / Voucher) *</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-3 py-2 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors text-xs text-slate-400">
                    <span>📁 Subir imagen de comprobante</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('comprobante', file);

                        try {
                          setCargando(true);
                          setErrorMsg('');
                          // Petición al endpoint OCR preparado en el backend
                          const res = await httpClient.post('/evento-participantes/ocr', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          
                          const resData = res.data?.data || res.data;
                          if (resData?.codigoTransaccion) {
                            setNumeroTransaccion(resData.codigoTransaccion);
                          }
                          if (resData?.monto !== undefined && resData?.monto !== null) {
                            setMonto(resData.monto);
                          }
                          if (resData?.comprobanteUrl) {
                            // Guardamos opcionalmente la ruta del archivo subido
                            (window as any).__comprobanteUrlSubido = resData.comprobanteUrl;
                          }
                        } catch (err) {
                          setErrorMsg('No se pudo escanear el comprobante automáticamente. Ingrese el número manualmente.');
                        } finally {
                          setCargando(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <span className="text-[10px] text-slate-500 block">El escaneo OCR detectará automáticamente el Nro. Documento/Transacción y el Monto (Bs.).</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">N° de Comprobante *</label>
                  <input
                    type="text"
                    required
                    value={numeroTransaccion}
                    onChange={(e) => setNumeroTransaccion(e.target.value)}
                    placeholder="Ej. 5718439691"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monto Registrado (Bs.)</label>
                  <input
                    type="text"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="Ej. 50.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs transition-colors cursor-pointer"
                >
                  Modificar Datos
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {cargando ? 'Procesando...' : 'Confirmar Preinscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 relative z-10 bg-slate-950/50">
        1er Congreso Internacional de Tecnología y Recursos Naturales (CITREN 2026) — UAJMS FIRNT Yacuiba
      </footer>
    </div>
  );
};

export default LandingFIRNTView;