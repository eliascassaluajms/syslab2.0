import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { listarSesiones } from '../services/bitacora.service';
import { ApiError } from '../services/api';
import type { SesionBitacora } from '../types/api';
import { colores } from '../theme/colors';
import { TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Sesiones'>;

export function formatoFecha(fechaISO: string): string {
  if (!fechaISO) return '';
  try {
    return new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fechaISO;
  }
}

function EstadoSesion({ sesion }: { sesion: SesionBitacora }) {
  const texto = sesion.cumplio
    ? 'Finalizada'
    : sesion.listaConfirmada
      ? 'Lista confirmada'
      : 'Activa';
  const color = sesion.cumplio
    ? colores.textoTenue
    : sesion.listaConfirmada
      ? colores.advertencia
      : colores.exito;
  return (
    <View style={[estilos.etiqueta, { borderColor: color }]}>
      <Text style={[estilos.etiquetaTexto, { color }]}>{texto}</Text>
    </View>
  );
}

export default function SesionesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [sesiones, setSesiones] = useState<SesionBitacora[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!token) return;
      const setEstado = esRefresh ? setRefrescando : setCargando;
      setEstado(true);
      setError('');
      try {
        const datos = await listarSesiones(token);
        setSesiones(datos);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las sesiones.');
      } finally {
        setEstado(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando && !refrescando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TituloPantalla titulo="Mis sesiones" subtitulo="Bitácoras de laboratorio iniciadas" />
      </View>

      <FlatList
        data={sesiones}
        keyExtractor={(s) => String(s.id)}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />
        }
        contentContainerStyle={estilos.contenido}
        ListEmptyComponent={
          !error ? (
            <Text style={estilos.vacio}>
              No has iniciado ninguna sesión aún. Ve a «Iniciar sesión de laboratorio» desde el inicio.
            </Text>
          ) : (
            <Text style={estilos.error}>{error}</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={estilos.tarjeta}
            onPress={() => navigation.navigate('DetalleSesion', { sesionId: item.id })}
          >
            <View style={estilos.fila}>
              <View style={estilos.info}>
                <Text style={estilos.materia}>{item.materiaNombre || item.materia?.nombre || 'Uso de laboratorio'}</Text>
                <Text style={estilos.detalle}>
                  🧪 {item.laboratorio.nombre} · Grupo {item.grupo}
                </Text>
                <Text style={estilos.detalleSuave}>
                  {formatoFecha(item.fecha)} · {item.horaInicio}
                  {item.horaFin ? ` – ${item.horaFin}` : ' (activa)'}
                </Text>
              </View>
              <EstadoSesion sesion={item} />
            </View>
          </TouchableOpacity>
        )}
      />
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
  },
  cabecera: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 40,
  },
  error: {
    color: colores.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  tarjeta: {
    backgroundColor: colores.fondoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  info: {
    flex: 1,
  },
  materia: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  detalle: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 4,
  },
  detalleSuave: {
    color: colores.textoTenue,
    fontSize: 12,
    marginTop: 2,
  },
  etiqueta: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  etiquetaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
});