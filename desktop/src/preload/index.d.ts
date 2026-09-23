import type { SyslabLockAPI } from '../shared/types.js';

declare global {
  interface Window {
    syslabLock: SyslabLockAPI;
  }
}

export {};