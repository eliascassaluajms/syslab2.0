import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import {
  actualizarAsistencia,
  confirmarAsistencia,
  finalizarSesion,
  obtenerListaConsolidada,
} from '../services/bitacora.service';
import { ApiError } from '../services/api';
import type { EstadoAsistencia, EstudiantesLista, ListaConsolidada } from '../types/api';
import { colores } from '../theme/colors';
import { AvisoExito, Boton, MensajeError, TituloPantalla } from '../components/ui';
import { formatoFecha } from './SesionesScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleSesion'>;

const ESTADOS: { valor: EstadoAsistencia; etiqueta: string; color: string }[] = [
  { valor: 'PRESENTE', etiqueta: 'Presente', color: colores.exito },
  { valor: 'ATRASO', etiqueta: 'Atraso', color: colores.advertencia },
  { valor: 'LICENCIA', etiqueta: 'Licencia', color: colores.primario },
  { valor: 'FALTA', etiqueta: 'Falta', color: colores.danger },
];

const colorDe = (estado: string): string => {
  const match = ESTADOS.find((e) => e.valor === estado);
  return match?.color ?? colores.textoTenue;
};

const etiquetaDe = (estado: string): string => {
  const match = ESTADOS.find((e) => e.valor === estado);
  return match?.etiqueta ?? estado;
};

export default function DetalleSesionScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { sesionId } = route.params;
  const [datos, setDatos] = useState<ListaConsolidada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState<EstudiantesLista | null>(null);

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstado = esRefresh ? setRefrescando : setCargando;
      setEstado(true);
      setError('');
      try {
        const lista = await obtenerListaConsolidada(token, sesionId);
        setDatos(lista);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los datos de la sesión.');
      } finally {
        setEstado(false);
      }
    },
    [token, sesionId],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardarEstado = async (estado: EstadoAsistencia) => {
    if (!token || !editando || procesando) return;
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      await actualizarAsistencia(token, sesionId, editando.estudiante.id, estado);
      setEditando(null);
      await cargar(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la asistencia.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmar = async () => {
    if (!token || procesando) return;
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      const lista = await confirmarAsistencia(token, sesionId);
      setDatos(lista);
      setAviso('Lista de asistencia confirmada. Ya no se admiten más marcados.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo confirmar la lista.');
    } finally {
      setProcesando(false);
    }
  };

  const finalizar = () => {
    Alert.alert('Finalizar sesión', '¿Finalizar esta sesión de laboratorio? Ya no se admitirán asistencias.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', style: 'destructive', onPress: () => void ejecutarFinalizacion() },
    ]);
  };

  const ejecutarFinalizacion = async () => {
    if (!token || procesando) return;
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      await finalizarSesion(token, sesionId, { cumplio: true });
      await cargar(true);
      setAviso('Sesión finalizada correctamente.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo finalizar la sesión.');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando && !refrescando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  if (!datos) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>{error || 'No se encontró la sesión.'}</Text>
      </View>
    );
  }

  const sesion = datos.sesion;
  const activa = !sesion.cumplio;
  const pendienteConfirmar = activa && !sesion.listaConfirmada;
  const textoEstado = sesion.cumplio
    ? 'Finalizada'
    : sesion.listaConfirmada
      ? 'Lista confirmada'
      : 'Activa';

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
        contentContainerStyle={estilos.contenido}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.datos}>
            <TituloPantalla
              titulo={sesion.materiaNombre || sesion.materia?.nombre || 'Uso de laboratorio'}
              subtitulo={`${sesion.laboratorio.nombre} · Grupo ${sesion.grupo} · Gestión ${sesion.gestion}`}
            />
            <Text style={estilos.meta}>
              {formatoFecha(sesion.fecha)} · Inicio {sesion.horaInicio}
              {sesion.horaFin ? ` · Fin ${sesion.horaFin}` : ' · En curso'}
              {'  '}
              <Text style={{ color: colorDe(textoEstado) }}>{textoEstado}</Text>
            </Text>
          </View>
        </View>

        {error ? <MensajeError mensaje={error} /> : null}
        {aviso ? <AvisoExito mensaje={aviso} /> : null}

        {activa && sesion.tokenQR ? (
          <View style={estilos.qr}>
            <Text style={estilos.qrTitulo}>QR de la sesión</Text>
            <Text style={estilos.qrSubtitulo}>
              Los estudiantes escanean este código desde la app para marcar su asistencia.
            </Text>
            <View style={estilos.qrCaja}>
              <QRCode value={sesion.tokenQR} size={200} color={colores.fondo} backgroundColor={colores.blanco} quietZone={8} />
            </View>
            <Text style={estilos.qrToken} numberOfLines={2} selectable>
              {sesion.tokenQR}
            </Text>
            {pendienteConfirmar ? (
              <Text style={estilos.qrNota}>
                Se marcarán automáticamente como falta los inscritos que no hayan escaneado.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={estilos.resumen}>
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenNumero}>{datos.presentes}</Text>
            <Text style={estilos.resumenTexto}>Presentes</Text>
          </View>
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenNumero}>{datos.atrasos}</Text>
            <Text style={estilos.resumenTexto}>Atrasos</Text>
          </View>
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenNumero}>{datos.licencias}</Text>
            <Text style={estilos.resumenTexto}>Licencias</Text>
          </View>
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenNumero}>{datos.faltas}</Text>
            <Text style={estilos.resumenTexto}>Faltas</Text>
          </View>
        </View>

        <Text style={estilos.nominaTitulo}>Nómina ({datos.totalInscritos})</Text>

        {datos.estudiantes.length === 0 ? (
          <Text style={estilos.vacio}>No hay estudiantes matriculados para mostrar en esta sesión.</Text>
        ) : (
          datos.estudiantes.map((est) => (
            <TouchableOpacity
              key={est.estudiante.id}
              style={estilos.fila}
              disabled={!pendienteConfirmar}
              onPress={() => setEditando(est)}
            >
              <View style={estilos.filaInfo}>
                <Text style={estilos.estudianteNombre}>{est.nombreCompleto}</Text>
                <Text style={estilos.estudianteRu}>
                  RU {est.estudiante.username}
                  {est.equipo ? ` · 💻 ${est.equipo.codigoPatrimonial}` : ''}
                </Text>
              </View>
              <View style={[estilos.estado, { borderColor: colorDe(est.estado) }]}>
                <Text style={[estilos.estadoTexto, { color: colorDe(est.estado) }]}>{etiquetaDe(est.estado)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {activa ? (
          <View style={estilos.acciones}>
            {pendienteConfirmar ? (
              <>
                <Boton titulo="Confirmar lista" onPress={() => void confirmar()} cargando={procesando} />
                <Text style={estilos.accionNota}>
                  Confirmar bloquea los marcados y deja la asistencia como definitiva.
                </Text>
              </>
            ) : null}
            <Boton titulo="Finalizar sesión" onPress={finalizar} tipo="danger" cargando={procesando} />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={editando !== null} transparent animationType="slide" onRequestClose={() => setEditando(null)}>
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalTitulo}>{editando?.nombreCompleto}</Text>
            <Text style={estilos.modalSub}>RU {editando?.estudiante.username}</Text>
            <Text style={estilos.modalEtiqueta}>Estado de asistencia</Text>
            {ESTADOS.map((est) => (
              <TouchableOpacity
                key={est.valor}
                style={estilos.modalOpcion}
                onPress={() => void guardarEstado(est.valor)}
              >
                <Text style={estilos.modalOpcionTexto}>{est.etiqueta}</Text>
                {editando?.estado === est.valor ? <Text style={[estilos.modalCheck, { color: est.color }]}>✓</Text> : null}
              </TouchableOpacity>
            ))}
            <Boton titulo="Cancelar" onPress={() => setEditando(null)} tipo="secundario" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.fondo,
    padding: 24,
  },
  contenido: {
    padding: 20,
    paddingBottom: 60,
  },
  cabecera: {
    marginBottom: 16,
  },
  datos: {
    flex: 1,
  },
  meta: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 6,
  },
  qr: {
    backgroundColor: colores.fondoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '800',
  },
  qrSubtitulo: {
    color: colores.textoSuave,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  qrCaja: {
    padding: 14,
    backgroundColor: colores.blanco,
    borderRadius: 12,
  },
  qrToken: {
    color: colores.textoTenue,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  qrNota: {
    color: colores.advertencia,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  resumen: {
    flexDirection: 'row',
    backgroundColor: colores.fondoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingVertical: 12,
    marginBottom: 18,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenNumero: {
    color: colores.texto,
    fontSize: 20,
    fontWeight: '800',
  },
  resumenTexto: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  nominaTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: colores.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 12,
    marginBottom: 8,
  },
  filaInfo: {
    flex: 1,
  },
  estudianteNombre: {
    color: colores.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  estudianteRu: {
    color: colores.textoTenue,
    fontSize: 12,
    marginTop: 2,
  },
  estado: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 86,
    alignItems: 'center',
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  acciones: {
    marginTop: 20,
    gap: 12,
  },
  accionNota: {
    color: colores.textoTenue,
    fontSize: 12,
    textAlign: 'center',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colores.fondoCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 8,
  },
  modalTitulo: {
    color: colores.texto,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: colores.textoSuave,
    fontSize: 13,
    marginBottom: 8,
  },
  modalEtiqueta: {
    color: colores.textoTenue,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  modalOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colores.fondoCard2,
    borderRadius: 12,
    padding: 14,
  },
  modalOpcionTexto: {
    color: colores.texto,
    fontSize: 15,
  },
  modalCheck: {
    fontSize: 16,
    fontWeight: '900',
  },
});