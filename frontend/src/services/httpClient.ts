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
// 2. COLA DE PETICIONES Y CONTROL DE ROTACIÓN DE REFRESH TOKEN
// ============================================================================
let estaRefrescando = false;
let peticionesEnEspera: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const procesarCola = (error: unknown, token: string | null = null) => {
  peticionesEnEspera.forEach((promesa) => {
    if (error) {
      promesa.reject(error);
    } else if (token) {
      promesa.resolve(token);
    }
  });
  peticionesEnEspera = [];
};

// ============================================================================
// 3. INTERCEPTOR DE RESPUESTAS CON RENOVACIÓN AUTOMÁTICA
// ============================================================================
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const peticionOriginal = error.config as InternalAxiosRequestConfig & { _reintentado?: boolean };

    const url = peticionOriginal?.url || '';
    const esEndpointAuth = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    // Manejo de token expirado o no autorizado (401)
    if (error.response?.status === 401 && !esEndpointAuth && peticionOriginal && !peticionOriginal._reintentado) {
      const refreshToken = localStorage.getItem('syslab_refresh_token');

      // Si no existe refresh token, desloguear directamente
      if (!refreshToken) {
        localStorage.removeItem('syslab_token');
        localStorage.removeItem('syslab_refresh_token');
        window.dispatchEvent(new Event('auth_unauthorized'));
        return Promise.reject(error);
      }

      if (estaRefrescando) {
        // Encolar peticiones mientras la rotación del token está en vuelo
        return new Promise<string>((resolve, reject) => {
          peticionesEnEspera.push({ resolve, reject });
        })
          .then((nuevoToken) => {
            if (peticionOriginal.headers) {
              peticionOriginal.headers.Authorization = `Bearer ${nuevoToken}`;
            }
            return httpClient(peticionOriginal);
          })
          .catch((err) => Promise.reject(err));
      }

      peticionOriginal._reintentado = true;
      estaRefrescando = true;

      try {
        // Instancia limpia para evitar loops de interceptores
        const { data: respuestaRefresh } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const nuevoAccessToken = respuestaRefresh.token;
        const nuevoRefreshToken = respuestaRefresh.refreshToken;

        if (!nuevoAccessToken) {
          throw new Error('La respuesta de renovación no contiene token de acceso.');
        }

        localStorage.setItem('syslab_token', nuevoAccessToken);
        if (nuevoRefreshToken) {
          localStorage.setItem('syslab_refresh_token', nuevoRefreshToken);
        }

        if (peticionOriginal.headers) {
          peticionOriginal.headers.Authorization = `Bearer ${nuevoAccessToken}`;
        }

        procesarCola(null, nuevoAccessToken);
        return httpClient(peticionOriginal);
      } catch (errorRefresh) {
        procesarCola(errorRefresh, null);
        localStorage.removeItem('syslab_token');
        localStorage.removeItem('syslab_refresh_token');
        localStorage.removeItem('syslab_user');
        window.dispatchEvent(new Event('auth_unauthorized'));
        return Promise.reject(errorRefresh);
      } finally {
        estaRefrescando = false;
      }
    }

    return Promise.reject(error);
  }
);