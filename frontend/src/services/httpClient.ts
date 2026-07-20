import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 1. Interceptor de Peticiones: Inyección dinámica del JWT
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('syslab_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// 2. Interceptor de Respuestas: Manejo reactivo desacoplado
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    const esEndpointLogin = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !esEndpointLogin) {
      console.warn('⚠️ Sesión inválida o expirada detectada por el core.');
      localStorage.removeItem('syslab_token');
      // Emitimos el evento global, pero NO forzamos la recarga de la ventana
      window.dispatchEvent(new Event('auth_unauthorized'));
    }
    return Promise.reject(
      error.response?.data || { message: 'Error de red o servidor no disponible.' }
    );
  }
);