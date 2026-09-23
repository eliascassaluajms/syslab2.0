export type RootStackParamList = {
  Login: undefined;
  Configuracion: undefined;
  Inicio: undefined;
  MiHorario: undefined;
  IniciarSesion: undefined;
  Sesiones: undefined;
  DetalleSesion: { sesionId: number };
  Defensas: undefined;
  DetalleDefensa: { trabajoId: string };
  MisIncidencias: undefined;
  ReportarIncidencia: undefined;
  DetalleIncidencia: { incidenciaId: number };
};