import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Intento best-effort de bloquear la sesión del sistema operativo.
 * - Windows: rundll32 user32.dll,LockWorkStation
 * - Linux: loginctl lock-session (requiere permisos del usuario gráfico)
 * Devuelve el resultado como texto informativo.
 */
export async function bloquearSistema(plataforma: NodeJS.Platform): Promise<string> {
  try {
    if (plataforma === 'win32') {
      await execAsync('rundll32.exe user32.dll,LockWorkStation');
      return 'Sesión de Windows bloqueada.';
    }
    if (plataforma === 'linux') {
      await execAsync('loginctl lock-session');
      return 'Sesión del equipo bloqueada.';
    }
    if (plataforma === 'darwin') {
      await execAsync('pmset displaysleepnow');
      return 'Pantalla apagada (macOS).';
    }
    return `Bloqueo de ${plataforma} no implementado.`;
  } catch {
    return 'No fue posible bloquear la sesión del sistema (permisos insuficientes).';
  }
}