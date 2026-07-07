import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// URL base extraída de las variables de entorno de Vite o fallback de desarrollo
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de tolerancia para redes de laboratorio congestionadas
});

/**
 * 1. Interceptor de Peticiones: Inyección dinámica del JWT
 */
// Modificar las secciones de error para que incluyan el tipo ': any' o ': unknown'
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('syslab_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Sesión inválida o expirada.');
      localStorage.removeItem('syslab_token');
      localStorage.removeItem('syslab_user');
      window.dispatchEvent(new Event('auth_unauthorized'));
      window.location.href = '/login';
    }
    return Promise.reject(
      error.response?.data || { message: 'Error de red o servidor no disponible.' }
    );
  }
);