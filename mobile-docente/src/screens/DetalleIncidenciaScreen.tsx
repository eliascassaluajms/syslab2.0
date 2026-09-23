import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { agregarNotaIncidencia, obtenerDetalleIncidencia } from '../services/incidencias.service';
import type {
  EstadoIncidenciaMovil,
  IncidenciaDetalleMovil,
} from '../types/incidencia';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import { Boton, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleIncidencia'>;

const ESTADOS_COLOR: Record<EstadoIncidenciaMovil, string> = {
  PENDIENTE: colores.advertencia,
  EN_REVISION: colores.primario,
  EN_PROCESO: colores.primario,
  RESUELTO: colores.exito,
  DESCARTADO: colores.textoTenue,
};

const ETIQUETAS_ESTADO: Record<EstadoIncidenciaMovil, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  DESCARTADO: 'Descartado',
};

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  PC: 'PC / Equipo de escritorio',
  PROYECTOR: 'Proyector',
  AIRE_ACONDICIONADO: 'Aire acondicionado',
  RED_INTERNET: 'Red / Internet',
  PERIFERICO: 'Periférico',
  SOFTWARE: 'Software',
  OTRO: 'Otro',
};

const ETIQUETAS_PRIORIDAD: Record<string, string> = {
  BAJA: 'Leve',
  MEDIA: 'Moderada',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

const PASOS: { estado: EstadoIncidenciaMovil; etiqueta: string }[] = [
  { estado: 'PENDIENTE', etiqueta: 'Ticket recibido' },
  { estado: 'EN_REVISION', etiqueta: 'Asignado a técnico' },
  { estado: 'EN_PROCESO', etiqueta: 'Diagnóstico en proceso' },
  { estado: 'RESUELTO', etiqueta: 'Solucionado y verificado' },
];

export default function DetalleIncidenciaScreen({ route }: Props) {
  const { token } = useAuth();
  const { incidenciaId } = route.params;

  const [detalle, setDetalle] = useState<IncidenciaDetalleMovil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [notasAbiertas, setNotasAbiertas] = useState(true);

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstado = esRefresh ? setRefrescando : setCargando;
      setEstado(true);
      setError('');
      try {
        const d = await obtenerDetalleIncidencia(token, incidenciaId);
        setDetalle(d);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle de la incidencia.');
      } finally {
        setEstado(false);
      }
    },
    [token, incidenciaId],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const enviarNota = async () => {
    if (!token || !detalle) return;
    if (!nota.trim()) return;
    setEnviando(true);
    setError('');
    try {
      await agregarNotaIncidencia(token, detalle.id, nota.trim());
      setNota('');
      await cargar(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo agregar la nota.');
    } finally {
      setEnviando(false);
    }
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
        <Text style={estilos.error}>{error || 'No se encontró la incidencia.'}</Text>
      </View>
    );
  }

  const color = ESTADOS_COLOR[detalle.estado];
  const estadoIndex = PASOS.findIndex((p) => p.estado === detalle.estado);

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.folioBadge}>
            <Text style={estilos.folio}>{detalle.folio}</Text>
            <View style={[estilos.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
              <Text style={[estilos.badgeTexto, { color }]}>{ETIQUETAS_ESTADO[detalle.estado]}</Text>
            </View>
          </View>
          <Text style={estilos.titulo}>{detalle.titulo}</Text>
          <Text style={estilos.meta}>
            {detalle.laboratorio?.nombre} · {ETIQUETAS_CATEGORIA[detalle.categoriaEquipo] || detalle.categoriaEquipo}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.adminBadges}>
          <Text style={[estilos.badgeChip, { color: colores.advertencia, borderColor: colores.advertencia }]}>
            Prioridad {ETIQUETAS_PRIORIDAD[detalle.prioridad]}
          </Text>
          <View style={estilos.badgeEspaciador} />
          <Text style={estilos.badgeChip}>
            Reportado {new Date(detalle.fechaReporte).toLocaleString()}
          </Text>
        </ScrollView>

        {error ? <MensajeError mensaje={error} /> : null}

        <Text style={estilos.seccionTitulo}>Progreso</Text>
        {detalle.estado === 'DESCARTADO' ? (
          <Text style={estilos.vacio}>Esta incidencia fue descartada por el personal técnico.</Text>
        ) : (
          <View style={estilos.stepper}>
            {PASOS.map((paso, idx) => {
              const completado = idx <= estadoIndex;
              return (
                <View key={paso.estado} style={estilos.step}>
                  <View style={estilos.stepIzq}>
                    <View style={[estilos.stepCirculo, completado && { backgroundColor: `${colores.exito}22`, borderColor: colores.exito }]}>
                      <Text style={[estilos.stepNumero, completado && { color: colores.exito }]}>{idx + 1}</Text>
                    </View>
                    {idx < PASOS.length - 1 ? (
                      <View style={[estilos.stepLinea, completado && { backgroundColor: colores.exito }]} />
                    ) : null}
                  </View>
                  <Text style={[estilos.stepTexto, completado && { color: colores.texto }]}>{paso.etiqueta}</Text>
                </View>
              );
            })}
          </View>
        )}

        {detalle.tecnicoAsignado ? (
          <View style={estilos.fila}>
            <View style={estilos.filaIcono}>
              <Text style={estilos.filaIconoTexto}>🧑‍🔧</Text>
            </View>
            <View style={estilos.filaTexto}>
              <Text style={estilos.filaNombre}>
                {detalle.tecnicoAsignado.nombre} {detalle.tecnicoAsignado.apellido || ''}
              </Text>
              <Text style={estilos.filaDetalle}>Técnico asignado</Text>
            </View>
          </View>
        ) : null}

        {detalle.solucion ? (
          <>
            <Text style={estilos.seccionTitulo}>Solución aplicada</Text>
            <View style={estilos.solucion}>
              <Text style={estilos.solucionTexto}>{detalle.solucion}</Text>
            </View>
          </>
        ) : null}

        <Text style={estilos.seccionTitulo}>Descripción del reporte</Text>
        <View style={estilos.detalle}>
          <Text style={estilos.detalleTexto}>{detalle.descripcion}</Text>
        </View>

        {detalle.evidenciaUrl ? (
          <>
            <Text style={estilos.seccionTitulo}>Evidencia adjunta</Text>
            <Image source={{ uri: detalle.evidenciaUrl }} style={estilos.evidencia} resizeMode="cover" />
          </>
        ) : null}

        <TouchableOpacity style={estilos.notasCabecera} onPress={() => setNotasAbiertas((v) => !v)}>
          <Text style={estilos.notasTitulo}>Historial y notas ({detalle.notas.length})</Text>
          <Text style={estilos.notasFlecha}>{notasAbiertas ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {notasAbiertas ? (
          <>
            {detalle.notas.length === 0 ? (
              <Text style={estilos.vacio}>Aún no hay notas registradas.</Text>
            ) : (
              detalle.notas.map((n) => (
                <View key={n.id} style={estilos.nota}>
                  <Text style={[estilos.notaAutor, n.esSistema && { color: colores.primario }]}>
                    {n.esSistema ? 'Sistema' : n.autor ? `${n.autor.nombre} ${n.autor.apellido || ''}` : 'Docente'}
                  </Text>
                  <Text style={estilos.notaTexto}>{n.mensaje}</Text>
                  <Text style={estilos.notaFecha}>{new Date(n.fecha).toLocaleString()}</Text>
                </View>
              ))
            )}
          </>
        ) : null}

        <Text style={estilos.seccionTitulo}>Añadir nota de seguimiento</Text>
        <TextInput
          style={[estilos.campo, estilos.area]}
          placeholder="Describe el avance o detalle adicional…"
          placeholderTextColor={colores.textoTenue}
          multiline
          value={nota}
          onChangeText={setNota}
        />
        <Boton
          titulo="Agregar nota"
          onPress={() => void enviarNota()}
          cargando={enviando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  error: {
    color: colores.texto,
    fontSize: 14,
    textAlign: 'center',
  },
  cabecera: {
    marginBottom: 8,
  },
  folioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folio: {
    color: colores.exito,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
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
  titulo: {
    color: colores.texto,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  meta: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 4,
  },
  adminBadges: {
    flexGrow: 0,
    marginBottom: 12,
  },
  badgeChip: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colores.textoSuave,
  },
  badgeEspaciador: {
    width: 8,
  },
  seccionTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },
  stepper: {
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIzq: {
    alignItems: 'center',
    width: 40,
  },
  stepCirculo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumero: {
    color: colores.textoTenue,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLinea: {
    width: 2,
    height: 28,
    backgroundColor: colores.borde,
  },
  stepTexto: {
    color: colores.textoTenue,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingTop: 6,
    paddingLeft: 6,
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
    marginTop: 12,
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
  solucion: {
    backgroundColor: `${colores.exito}14`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colores.exito}44`,
    padding: 14,
  },
  solucionTexto: {
    color: colores.exito,
    fontSize: 14,
    lineHeight: 20,
  },
  detalle: {
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 4,
  },
  detalleTexto: {
    color: colores.texto,
    fontSize: 14,
    lineHeight: 20,
  },
  evidencia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.fondoCard,
    marginBottom: 4,
  },
  notasCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  notasTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '800',
  },
  notasFlecha: {
    color: colores.textoSuave,
    fontSize: 12,
  },
  nota: {
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 12,
    marginBottom: 8,
  },
  notaAutor: {
    color: colores.textoSuave,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notaTexto: {
    color: colores.texto,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 19,
  },
  notaFecha: {
    color: colores.textoTenue,
    fontSize: 11,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
  campo: {
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colores.texto,
  },
  area: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
});