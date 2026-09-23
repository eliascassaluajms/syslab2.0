import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import os from 'os';
import { configStore, type AppConfig } from './store.js';
import { bloquearSistema } from './os-lock.js';
import type { SistemaInfo } from '../shared/types.js';

let mainWindow: BrowserWindow | null = null;
let kioskActivo = false;
let permitirCierre = false;

async function crearVentana(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('close', (evento) => {
    if (kioskActivo && !permitirCierre) {
      evento.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((detalles) => {
    shell.openExternal(detalles.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

function configurarKiosk(activo: boolean): boolean {
  kioskActivo = activo;
  if (!mainWindow) return false;
  if (activo) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setFullScreen(true);
  } else {
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBounds({ width: 1280, height: 800 });
  }
  return true;
}

function registrarIpc(): void {
  ipcMain.handle('config:load', (): AppConfig => configStore.load());

  ipcMain.handle('config:save', (_evento, config: AppConfig): void => {
    configStore.save(config);
  });

  ipcMain.handle('config:clear', (): void => {
    configStore.clear();
  });

  ipcMain.handle('sistema:info', (): SistemaInfo => ({
    hostname: os.hostname(),
    plataforma: process.platform,
    arquitectura: process.arch,
    usuario: process.env['USER'] || process.env['USERNAME'] || '',
  }));

  ipcMain.handle('kiosk:set', (_evento, activo: boolean): boolean => configurarKiosk(activo));

  ipcMain.handle('os:bloquear', async (): Promise<string> => bloquearSistema(process.platform));
}

app.whenReady().then(() => {
  registrarIpc();
  void crearVentana();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void crearVentana();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export function permitirSalida(): void {
  permitirCierre = true;
}

export function kioskHabilitado(): boolean {
  return kioskActivo;
}