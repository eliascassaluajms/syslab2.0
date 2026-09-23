import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig, SyslabLockAPI, SistemaInfo } from '../shared/types.js';

const api: SyslabLockAPI = {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config: AppConfig) => ipcRenderer.invoke('config:save', config),
  clearConfig: () => ipcRenderer.invoke('config:clear'),
  getSistemaInfo: () => ipcRenderer.invoke('sistema:info') as Promise<SistemaInfo>,
  setKiosk: (enabled: boolean) => ipcRenderer.invoke('kiosk:set', enabled) as Promise<boolean>,
  bloquearOS: () => ipcRenderer.invoke('os:bloquear') as Promise<string>,
};

contextBridge.exposeInMainWorld('syslabLock', api);