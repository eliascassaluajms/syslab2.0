import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { obtenerMiHorario } from '../services/horario.service';
import { ApiError } from '../services/api';
import type { Horario } from '../types/api';
import { colores } from '../theme/colors';
import { TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MiHorario'>;

const ORDEN_DIAS: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

export default function MiHorarioScreen(_props: Props) {
  const { token } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([]);
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
        const datos = await obtenerMiHorario(token);
        setHorarios(datos.sort((a, b) => (ORDEN_DIAS[a.diaSemana] ?? 0) - (ORDEN_DIAS[b.diaSemana] ?? 0) || a.horaInicio.localeCompare(b.horaInicio)));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el horario.');
      } finally {
        setEstado(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const grupos = new Map<string, Horario[]>();
  horarios.forEach((h) => {
    const lista = grupos.get(h.diaSemana) ?? [];
    lista.push(h);
    grupos.set(h.diaSemana, lista);
  });

  const datos: { dia: string; items: Horario[] }[] = Array.from(grupos.entries()).map(([dia, items]) => ({
    dia,
    items: items.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
  }));

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
        <TituloPantalla titulo="Mi horario" subtitulo="Materias y laboratorios de tu gestión" />
      </View>

      <FlatList
        data={datos}
        keyExtractor={(d) => d.dia}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} tintColor={colores.primario} />}
        contentContainerStyle={estilos.contenido}
        ListEmptyComponent={
          !error ? (
            <Text style={estilos.vacio}>No tienes horarios asignados en esta gestión.</Text>
          ) : (
            <Text style={estilos.error}>{error}</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={estilos.grupo}>
            <Text style={estilos.dia}>{item.dia}</Text>
            {item.items.map((h) => (
              <View key={h.id} style={estilos.tarjeta}>
                <View style={estilos.horas}>
                  <Text style={estilos.horaInicio}>{h.horaInicio}</Text>
                  <Text style={estilos.horaFin}>{h.horaFin}</Text>
                </View>
                <View style={estilos.info}>
                  <Text style={estilos.materia}>{h.materia.nombre}</Text>
                  <Text style={estilos.laboratorio}>
                    🧪 {h.laboratorio.nombre} · Grupo {h.grupo}
                  </Text>
                  <Text style={estilos.docente}>
                    👤 {h.docente.nombre} {h.docente.apellido}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  grupo: {
    marginBottom: 22,
  },
  dia: {
    color: colores.primario,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: colores.fondoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 10,
    overflow: 'hidden',
  },
  horas: {
    backgroundColor: colores.fondoCard2,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 74,
  },
  horaInicio: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  horaFin: {
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },
  info: {
    flex: 1,
    padding: 14,
  },
  materia: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  laboratorio: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 4,
  },
  docente: {
    color: colores.textoTenue,
    fontSize: 12,
    marginTop: 2,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  error: {
    color: colores.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});