import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// URL base para la API REST del backend (Ajustar en el .env si no usa el prefijo /api)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================================================
// 1. INTERCEPTOR DE PETICIONES
// ============================================================================
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('syslab_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// 2. INTERCEPTOR DE RESPUESTAS
// ============================================================================
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const esEndpointLogin = error.config?.url?.includes('/auth/login');

    // Manejo de token expirado o no autorizado (401)
    if (error.response?.status === 401 && !esEndpointLogin) {
      console.warn('⚠️ Sesión inválida o expirada detectada por el sistema.');
      localStorage.removeItem('syslab_token');
      window.dispatchEvent(new Event('auth_unauthorized'));
    }

    // Se retorna el objeto de error intacto de Axios
    return Promise.reject(error);
  }
);