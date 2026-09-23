import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import {
  emitirConformidad,
  obtenerDetalleTrabajo,
  registrarObservacion,
} from '../services/defensas.service';
import type {
  TrabajoGradoDetalleMovil,
} from '../types/defensa';
import { nombreDeTribunal } from '../types/defensa';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import {
  AvisoExito,
  Boton,
  MensajeError,
  TituloPantalla,
} from '../components/ui';
import { colorDeEstado, etiquetaDeEstado } from './DefensasScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleDefensa'>;

interface ArchivoSeleccionado {
  uri: string;
  nombre: string;
  tipo: string;
  tamanio?: number;
}

export default function DetalleDefensaScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { trabajoId } = route.params;

  const [detalle, setDetalle] = useState<TrabajoGradoDetalleMovil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [designacionId, setDesignacionId] = useState<string | null>(null);
  const [detalleObservacion, setDetalleObservacion] = useState('');
  const [esExtraordinaria, setEsExtraordinaria] = useState(false);
  const [archivo, setArchivo] = useState<ArchivoSeleccionado | null>(null);

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstado = esRefresh ? setRefrescando : setCargando;
      setEstado(true);
      setError('');
      try {
        const d = await obtenerDetalleTrabajo(token, trabajoId);
        setDetalle(d);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle del trabajo.');
      } finally {
        setEstado(false);
      }
    },
    [token, trabajoId],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const elegirArchivo = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const a = resultado.assets[0];
    setArchivo({ uri: a.uri, nombre: a.name, tipo: a.mimeType ?? 'application/octet-stream' });
  };

  const registrar = async () => {
    if (!token) return;
    if (!designacionId) {
      setError('Selecciona un tribunal para asociar la observación.');
      return;
    }
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      await registrarObservacion(
        token,
        trabajoId,
        { designacionId, detalleObservacion, esExtraordinaria },
        archivo ?? undefined,
      );
      setModalAbierto(false);
      setDesignacionId(null);
      setDetalleObservacion('');
      setEsExtraordinaria(false);
      setArchivo(null);
      setAviso('Observación registrada correctamente.');
      await cargar(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la observación.');
    } finally {
      setProcesando(false);
    }
  };

  const conformidad = (desId: string) => {
    if (!token) return;
    setProcesando(true);
    setError('');
    setAviso('');
    void (async () => {
      try {
        await emitirConformidad(token, trabajoId, desId);
        setAviso('Conformidad emitida correctamente.');
        await cargar(true);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo emitir la conformidad.');
      } finally {
        setProcesando(false);
      }
    })();
  };

  if (cargando && !detalle) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  if (!detalle) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>{error || 'No se encontró el trabajo de grado.'}</Text>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
      >
        <TituloPantalla titulo={detalle.titulo} subtitulo={detalle.estudianteNombre} />

        {error ? <MensajeError mensaje={error} /> : null}
        {aviso ? <AvisoExito mensaje={aviso} /> : null}

        <View style={estilos.meta}>
          <Text style={estilos.metaTexto}>
            {[detalle.carrera?.nombre, detalle.gestion ? `Gestión ${detalle.gestion}` : null, detalle.modalidad]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <View style={[estilos.badge, { backgroundColor: `${colorDeEstado(detalle.estado)}22`, borderColor: colorDeEstado(detalle.estado) }]}>
            <Text style={[estilos.badgeTexto, { color: colorDeEstado(detalle.estado) }]}>{etiquetaDeEstado(detalle.estado)}</Text>
          </View>
        </View>

        <Text style={estilos.seccionTitulo}>Tribunal</Text>
        {detalle.tribunales && detalle.tribunales.length > 0 ? (
          detalle.tribunales.map((t) => (
            <View key={t.id} style={estilos.fila}>
              <View style={estilos.filaIcono}>
                <Text style={estilos.filaIconoTexto}>{t.preside ? '⚖️' : '👤'}</Text>
              </View>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaNombre}>{t.preside ? 'Presidenta del tribunal' : 'Miembro del tribunal'}</Text>
                <Text style={estilos.filaDetalle}>{nombreDeTribunal(t)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={estilos.vacio}>Aún no hay tribunal designado.</Text>
        )}

        <Text style={estilos.seccionTitulo}>Versiones</Text>
        {detalle.versiones && detalle.versiones.length > 0 ? (
          detalle.versiones.map((v) => (
            <View key={v.id} style={estilos.fila}>
              <View style={estilos.filaIcono}>
                <Text style={estilos.filaIconoTexto}>📄</Text>
              </View>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaNombre}>Versión {v.numeroVersion}</Text>
                <Text style={estilos.filaDetalle}>{v.descripcionCambios ?? 'Sin descripción'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={estilos.vacio}>No hay versiones registradas.</Text>
        )}

        <Text style={estilos.seccionTitulo}>Observaciones</Text>
        {detalle.observaciones && detalle.observaciones.length > 0 ? (
          detalle.observaciones.map((o) => (
            <View key={o.id} style={estilos.fila}>
              <View style={estilos.filaIcono}>
                <Text style={estilos.filaIconoTexto}>{o.esExtraordinaria ? '🚩' : '📝'}</Text>
              </View>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaNombre}>Revisión {o.numeroRevision}{o.esExtraordinaria ? ' · Extraordinaria' : ''}</Text>
                <Text style={estilos.filaDetalle}>{o.detalleObservacion ?? 'Observación sin detalle'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={estilos.vacio}>Aún no hay observaciones.</Text>
        )}

        <View style={estilos.acciones}>
          <Boton
            titulo="Registrar observación"
            onPress={() => setModalAbierto(true)}
            tipo="primario"
          />
          {detalle.tribunales?.map((t) =>
            t.preside ? (
              <Boton
                key={t.id}
                titulo="Emitir conformidad"
                onPress={() => conformidad(t.id)}
                tipo="secundario"
                cargando={procesando}
              />
            ) : null,
          )}
        </View>
      </ScrollView>

      <Modal visible={modalAbierto} transparent animationType="slide" onRequestClose={() => setModalAbierto(false)}>
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalTitulo}>Registrar observación</Text>
            <Text style={estilos.modalSub}>El tribunal que formula la observación:</Text>
            {detalle.tribunales?.map((t) => (
              <TouchableOpacity key={t.id} style={estilos.modalOpcion} onPress={() => setDesignacionId(t.id)}>
                <Text style={estilos.modalOpcionTexto}>
                  {nombreDeTribunal(t)}
                </Text>
                {designacionId === t.id ? <Text style={estilos.modalCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}

            <Text style={estilos.modalEtiqueta}>Detalle</Text>
            <TextInput
              style={estilos.texto}
              placeholder="Describe la observación…"
              placeholderTextColor={colores.textoTenue}
              multiline
              value={detalleObservacion}
              onChangeText={setDetalleObservacion}
            />

            <TouchableOpacity style={estilos.modalOpcion} onPress={() => setEsExtraordinaria((v) => !v)}>
              <Text style={estilos.modalOpcionTexto}>Observación extraordinaria</Text>
              {esExtraordinaria ? <Text style={estilos.modalCheck}>✓</Text> : null}
            </TouchableOpacity>

            <TouchableOpacity style={estilos.modalOpcion} onPress={() => void elegirArchivo()}>
              <Text style={estilos.modalOpcionTexto}>{archivo ? `📎 ${archivo.nombre}` : 'Adjuntar archivo (opcional)'}</Text>
            </TouchableOpacity>

            <Boton titulo="Guardar" onPress={() => void registrar()} cargando={procesando} />
            <Boton titulo="Cancelar" onPress={() => setModalAbierto(false)} tipo="secundario" />
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
  contenido: {
    padding: 20,
    paddingBottom: 60,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.fondo,
    padding: 24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  metaTexto: {
    color: colores.textoSuave,
    fontSize: 13,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  seccionTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 10,
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
  filaIcono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colores.primario}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaIconoTexto: {
    fontSize: 20,
  },
  filaTexto: {
    flex: 1,
  },
  filaNombre: {
    color: colores.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  filaDetalle: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  acciones: {
    marginTop: 20,
    gap: 12,
  },
  error: {
    color: colores.texto,
    fontSize: 14,
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
    color: colores.primario,
    fontSize: 16,
    fontWeight: '900',
  },
  texto: {
    backgroundColor: colores.fondoCard2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    color: colores.texto,
    fontSize: 14,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
