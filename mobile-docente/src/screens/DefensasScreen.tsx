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
import { listarMisTrabajos } from '../services/defensas.service';
import type { TrabajoGradoResumenMovil } from '../types/defensa';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import { AvisoExito, CardAccion, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Defensas'>;

const ESTADOS_FILTRO: { valor: string; etiqueta: string; color: string }[] = [
  { valor: 'REGISTRADO', etiqueta: 'Registrado', color: colores.textoSuave },
  { valor: 'TRIBUNAL_DESIGNADO', etiqueta: 'Tribunal designado', color: colores.primario },
  { valor: 'CON_OBSERVACIONES', etiqueta: 'Con observaciones', color: colores.advertencia },
  { valor: 'APTO_PARA_DEFENSA', etiqueta: 'Apto para defensa', color: colores.exito },
  { valor: 'DEFENSA_PROGRAMADA', etiqueta: 'Defensa programada', color: colores.exito },
];

export function colorDeEstado(estado: string): string {
  return ESTADOS_FILTRO.find((e) => e.valor === estado)?.color ?? colores.textoSuave;
}

export function etiquetaDeEstado(estado: string): string {
  return ESTADOS_FILTRO.find((e) => e.valor === estado)?.etiqueta ?? estado;
}

export default function DefensasScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [trabajos, setTrabajos] = useState<TrabajoGradoResumenMovil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [solosMios, setSolosMios] = useState(true);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstado = esRefresh ? setRefrescando : setCargando;
      setEstado(true);
      setError('');
      try {
        const lista = await listarMisTrabajos(token, {
          solosMios: solosMios,
          estado: estadoSeleccionado || undefined,
        });
        setTrabajos(lista);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los trabajos de grado.');
      } finally {
        setEstado(false);
      }
    },
    [token, solosMios, estadoSeleccionado],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const resumen = useMemo(() => ({ total: trabajos.length }), [trabajos]);

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
    >
      <TituloPantalla titulo="Trabajos de grado" subtitulo="Tribunal asignado y observaciones." />

      {error ? <MensajeError mensaje={error} /> : null}
      {aviso ? <AvisoExito mensaje={aviso} /> : null}

      <CardAccion
        icono="🎓"
        titulo={solosMios ? 'Solo mis trabajos' : 'Todos los trabajos'}
        descripcion={solosMios ? 'Trabajos donde formas parte del tribunal.' : 'Todos los trabajos de grado registrados.'}
        onPress={() => setSolosMios((v) => !v)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.estados}>
        {ESTADOS_FILTRO.map((est) => {
          const activo = estadoSeleccionado === est.valor;
          return (
            <TouchableOpacity
              key={est.valor}
              onPress={() => setEstadoSeleccionado(activo ? '' : est.valor)}
              style={[estilos.chip, activo && { borderColor: est.color }]}
            >
              <Text style={[estilos.chipTexto, { color: activo ? est.color : colores.textoSuave }]}>{est.etiqueta}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={estilos.resumen}>
        <Text style={estilos.resumenNumero}>{resumen.total}</Text>
        <Text style={estilos.resumenTexto}>{resumen.total === 1 ? 'trabajo' : 'trabajos'}</Text>
      </View>

      {cargando && trabajos.length === 0 ? (
        <Text style={estilos.espera}>Cargando…</Text>
      ) : trabajos.length === 0 ? (
        <Text style={estilos.vacio}>No hay trabajos de grado que coincidan con los filtros seleccionados.</Text>
      ) : (
        trabajos.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={estilos.tarjeta}
            onPress={() => navigation.navigate('DetalleDefensa', { trabajoId: t.id })}
          >
            <View style={estilos.tarjetaIcono}>
              <Text style={estilos.tarjetaIconoTexto}>🎓</Text>
            </View>
            <View style={estilos.tarjetaTexto}>
              <Text style={estilos.tarjetaTitulo} numberOfLines={2}>{t.titulo}</Text>
              <Text style={estilos.tarjetaDescripcion} numberOfLines={1}>
                {[t.estudianteNombre, t.carrera?.nombre, t.gestion ? `Gestión ${t.gestion}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <View style={[estilos.badge, { backgroundColor: `${colorDeEstado(t.estado)}22`, borderColor: colorDeEstado(t.estado) }]}>
              <Text style={[estilos.badgeTexto, { color: colorDeEstado(t.estado) }]}>{etiquetaDeEstado(t.estado)}</Text>
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
  estados: {
    flexGrow: 0,
    marginTop: 14,
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
  resumen: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 16,
  },
  resumenNumero: {
    color: colores.primario,
    fontSize: 24,
    fontWeight: '900',
  },
  resumenTexto: {
    color: colores.textoSuave,
    fontSize: 13,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.fondoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 10,
  },
  tarjetaIcono: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: `${colores.primario}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaIconoTexto: {
    fontSize: 22,
  },
  tarjetaTexto: {
    flex: 1,
  },
  tarjetaTitulo: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  tarjetaDescripcion: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 3,
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
  espera: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
