export interface RegistroDispositivoDTO {
  codigoPatrimonial: string;
  laboratorioId: number;
  nombreEquipo?: string;
}

export interface LiberarDesafioDTO {
  codigo: string;
  laboratorioId?: number;
}

export interface RespuestaDesafioDTO {
  desafioId: number;
  codigo: string;
  expiraEn: string;
  equipo: { id: number; codigoPatrimonial: string | null; nombre: string };
  laboratorio: { id: number; nombre: string };
}