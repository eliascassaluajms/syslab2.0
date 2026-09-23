import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { obtenerMiHorario } from '../services/horario.service';
import { iniciarSesion } from '../services/bitacora.service';
import { ApiError } from '../services/api';
import type { Horario } from '../types/api';
import { colores } from '../theme/colors';
import { Boton, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'IniciarSesion'>;

const ORDEN_DIAS: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

export default function IniciarSesionScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abriendo, setAbriendo] = useState<number | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const datos = await obtenerMiHorario(token);
      const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long' });
      const hoyNormalizado = hoy.charAt(0).toUpperCase() + hoy.slice(1);
      setHorarios(
        datos
          .filter((h) => h.diaSemana === hoyNormalizado)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar su horario.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrir = async (horario: Horario) => {
    if (!token || abriendo !== null) return;
    setAbriendo(horario.id);
    setError('');
    try {
      const sesion = await iniciarSesion(token, {
        laboratorioId: horario.laboratorio.id,
        materiaId: horario.materia.id,
      });
      navigation.replace('DetalleSesion', { sesionId: sesion.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo iniciar la sesión.');
      setAbriendo(null);
    }
  };

  const formatearHoy = () =>
    new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <TituloPantalla titulo="Iniciar sesión" subtitulo="Elija la materia de hoy para abrir la bitácora y generar el QR" />

      {error ? <MensajeError mensaje={error} /> : null}

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      ) : horarios.length === 0 ? (
        <Text style={estilos.vacio}>
          No tiene horarios registrados para hoy ({formatearHoy()}). Use una materia asignada en su gestión o contacte a Jefatura de Laboratorios.
        </Text>
      ) : (
        <>
          <Text style={estilos.diaTitulo}>Hoy · {formatearHoy()}</Text>
          {horarios.map((h) => (
            <View key={h.id} style={estilos.tarjeta}>
              <View style={estilos.tarjetaInfo}>
                <Text style={estilos.materia}>{h.materia.nombre}</Text>
                <Text style={estilos.detalle}>
                  🧪 {h.laboratorio.nombre} · Grupo {h.grupo} · {h.horaInicio}–{h.horaFin}
                </Text>
                <Text style={estilos.detalleSuave}>Código {h.materia.codigo} · {h.horaInicio}</Text>
              </View>
              <View style={estilos.accion}>
                <Boton
                  titulo="Iniciar"
                  onPress={() => void abrir(h)}
                  cargando={abriendo === h.id}
                />
              </View>
            </View>
          ))}
        </>
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
    paddingBottom: 40,
  },
  centro: {
    paddingVertical: 40,
  },
  diaTitulo: {
    color: colores.primario,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20,
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
  tarjetaInfo: {
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
  accion: {
    minWidth: 84,
  },
});