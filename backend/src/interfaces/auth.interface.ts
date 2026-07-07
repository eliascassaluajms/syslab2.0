export interface IJwtPayload {
  id: number; 
  nombre: string;
  correo: string;
  rol: string;
  permisos: string[];
  carreras: number[];
}