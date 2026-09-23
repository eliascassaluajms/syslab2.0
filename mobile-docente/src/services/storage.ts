import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UsuarioSesion } from '../types/api';

const KEY_TOKEN = 'syslab.token';
const KEY_REFRESH_TOKEN = 'syslab.refreshToken';
const KEY_USUARIO = 'syslab.usuario';
const KEY_API_URL = 'syslab.apiUrl';
export const API_URL_DEFAULT = 'http://200.87.27.36:5000';

export async function guardarToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEY_TOKEN, token);
}

export async function obtenerToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_TOKEN);
}

export async function guardarRefreshToken(refreshToken: string): Promise<void> {
  await AsyncStorage.setItem(KEY_REFRESH_TOKEN, refreshToken);
}

export async function obtenerRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_REFRESH_TOKEN);
}

export async function eliminarRefreshToken(): Promise<void> {
  await AsyncStorage.removeItem(KEY_REFRESH_TOKEN);
}

export async function eliminarSesion(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_TOKEN, KEY_REFRESH_TOKEN, KEY_USUARIO]);
}

export async function guardarUsuario(usuario: UsuarioSesion): Promise<void> {
  await AsyncStorage.setItem(KEY_USUARIO, JSON.stringify(usuario));
}

export async function obtenerUsuario(): Promise<UsuarioSesion | null> {
  const raw = await AsyncStorage.getItem(KEY_USUARIO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export async function obtenerApiUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(KEY_API_URL);
  return url || API_URL_DEFAULT;
}

export async function guardarApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEY_API_URL, url);
}