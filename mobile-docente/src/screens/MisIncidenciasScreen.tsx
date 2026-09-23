import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { listarMisIncidencias } from '../services/incidencias.service';
import type {
  EstadoIncidenciaMovil,
  IncidenciaConteosMovil,
  IncidenciaMovil,
} from '../types/incidencia';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import { Boton, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MisIncidencias'>;

const ESTADOS: { valor: string; etiqueta: string; color: string }[] = [
  { valor: '', etiqueta: 'Todos', color: colores.textoSuave },
  { valor: 'PENDIENTE', etiqueta: 'Pendiente', color: colores.advertencia },
  { valor: 'EN_REVISION', etiqueta: 'En revisión', color: colores.primario },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso', color: colores.primario },
  { valor: 'RESUELTO', etiqueta: 'Resuelto', color: colores.exito },
  { valor: 'DESCARTADO', etiqueta: 'Descartado', color: colores.textoTenue },
];

function colorDeEstado(estado: string): string {
  return ESTADOS.find((e) => e.valor === estado)?.color ?? colores.textoSuave;
}

function etiquetaDeEstado(estado: string): string {
  return ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado;
}

export default function MisIncidenciasScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [incidencias, setIncidencias] = useState<IncidenciaMovil[]>([]);
  const [conteos, setConteos] = useState<IncidenciaConteosMovil>({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltas: 0,
    descartadas: 0,
  });
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstadoCarga = esRefresh ? setRefrescando : setCargando;
      setEstadoCarga(true);
      setError('');
      try {
        const res = await listarMisIncidencias(token, { estado: estado || undefined });
        setIncidencias(res.incidencias ?? []);
        setConteos(res.conteos ?? { total: 0, pendientes: 0, enProceso: 0, resueltas: 0, descartadas: 0 });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar sus reportes.');
      } finally {
        setEstadoCarga(false);
      }
    },
    [token, estado],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abiertas = useMemo(() => conteos.pendientes + (conteos.enProceso || 0), [conteos]);

  const abrirDetalle = (id: number) => navigation.navigate('DetalleIncidencia', { incidenciaId: id });

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
    >
      <TituloPantalla titulo="Mis incidencias" subtitulo="Estado de los reportes que realizaste." />

      {error ? <MensajeError mensaje={error} /> : null}

      <View style={estilos.metricas}>
        <View style={estilos.metrica}>
          <Text style={estilos.metricaNumero}>{conteos.total}</Text>
          <Text style={estilos.metricaEtiqueta}>Total</Text>
        </View>
        <View style={estilos.metrica}>
          <Text style={[estilos.metricaNumero, { color: colores.advertencia }]}>{abiertas}</Text>
          <Text style={estilos.metricaEtiqueta}>Abiertas</Text>
        </View>
        <View style={estilos.metrica}>
          <Text style={[estilos.metricaNumero, { color: colores.exito }]}>{conteos.resueltas}</Text>
          <Text style={estilos.metricaEtiqueta}>Resueltas</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.estados}>
        {ESTADOS.map((est) => {
          const activo = estado === est.valor;
          return (
            <TouchableOpacity
              key={est.valor}
              onPress={() => setEstado(est.valor)}
              style={[estilos.chip, activo && { borderColor: est.color }]}
            >
              <Text style={[estilos.chipTexto, { color: activo ? est.color : colores.textoSuave }]}>{est.etiqueta}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Boton
        titulo="+ Reportar falla"
        onPress={() => navigation.navigate('ReportarIncidencia')}
        tipo="primario"
      />

      {cargando && incidencias.length === 0 ? (
        <Text style={estilos.espera}>Cargando…</Text>
      ) : incidencias.length === 0 ? (
        <Text style={estilos.vacio}>
          No tienes reportes {estado ? 'con este estado' : 'registrados'}. Si detectas una falla en un laboratorio, repórtala.
        </Text>
      ) : (
        incidencias.map((item) => (
          <TouchableOpacity key={item.id} style={estilos.tarjeta} onPress={() => abrirDetalle(item.id)}>
            <View style={estilos.tarjetaCabecera}>
              <Text style={estilos.folio}>{item.folio}</Text>
              <View style={[estilos.badge, { backgroundColor: `${colorDeEstado(item.estado)}22`, borderColor: colorDeEstado(item.estado) }]}>
                <Text style={[estilos.badgeTexto, { color: colorDeEstado(item.estado) }]}>{etiquetaDeEstado(item.estado)}</Text>
              </View>
            </View>
            <Text style={estilos.tarjetaTitulo} numberOfLines={2}>{item.titulo}</Text>
            <Text style={estilos.tarjetaDescripcion} numberOfLines={2}>{item.descripcion}</Text>
            <View style={estilos.tarjetaPie}>
              <Text style={estilos.pieTexto} numberOfLines={1}>{item.laboratorio?.nombre}</Text>
              <Text style={estilos.pieFecha}>{new Date(item.fechaReporte).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
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
  metricas: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metrica: {
    flex: 1,
    backgroundColor: colores.fondoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    alignItems: 'center',
  },
  metricaNumero: {
    color: colores.texto,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricaEtiqueta: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  estados: {
    flexGrow: 0,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  espera: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 28,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 20,
  },
  tarjeta: {
    backgroundColor: colores.fondoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginTop: 10,
  },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folio: {
    color: colores.exito,
    fontSize: 13,
    fontWeight: '700',
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
  tarjetaTitulo: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  tarjetaDescripcion: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 4,
  },
  tarjetaPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  pieTexto: {
    color: colores.textoSuave,
    fontSize: 12,
    flex: 1,
  },
  pieFecha: {
    color: colores.textoTenue,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});