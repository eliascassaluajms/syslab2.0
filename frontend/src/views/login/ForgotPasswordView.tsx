import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '../../services/httpClient.js';

export const ForgotPasswordView: React.FC = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validación estricta del dominio institucional antes de golpear la API
    if (!correo.endsWith('@uajms.edu.bo')) {
      setMessage({
        type: 'error',
        text: 'Por favor, ingrese un correo institucional válido (@uajms.edu.bo).'
      });
      return;
    }

    setSubmitting(true);

    try {
      // Petición al endpoint del backend
      await httpClient.post('/auth/forgot-password', { correo });
      
      setMessage({
        type: 'success',
        text: 'Se ha enviado un enlace de recuperación a su correo institucional. Revise su bandeja de entrada.'
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al procesar la solicitud. Intente más tarde.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-gray-900 p-8 shadow-2xl border border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Recuperar <span className="text-blue-500">Acceso</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            SysLab 2.0 - UAJMS Yacuiba
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`rounded-lg p-3 border text-center text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Correo Institucional
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="usuario@uajms.edu.bo"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Despachando correo...' : 'Enviar Enlace'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex justify-center rounded-lg bg-transparent border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-all cursor-pointer"
            >
              Volver al Inicio de Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};