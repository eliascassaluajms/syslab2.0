import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme/colors';
import { CardAccion } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

export default function InicioScreen({ navigation }: Props) {
  const { usuario, cerrarSesion } = useAuth();
  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Docente';
  const iniciales = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <View style={estilos.perfil}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{iniciales}</Text>
        </View>
        <View style={estilos.perfilInfo}>
          <Text style={estilos.nombre}>{nombre}</Text>
          <Text style={estilos.ru}>Docente · {usuario?.username ?? ''}</Text>
        </View>
        <TouchableOpacity onPress={() => void cerrarSesion()}>
          <Text style={estilos.salir}>Salir</Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.seccion}>¿Qué deseas hacer?</Text>

      <View style={estilos.opciones}>
        <CardAccion
          icono="▶️"
          titulo="Iniciar sesión de laboratorio"
          descripcion="Abre la bitácora y genera el QR para que los estudiantes marquen."
          onPress={() => navigation.navigate('IniciarSesion')}
        />
        <CardAccion
          icono="📋"
          titulo="Mis sesiones"
          descripcion="Consulta la nómina y gestiona la asistencia registrada."
          onPress={() => navigation.navigate('Sesiones')}
        />
        <CardAccion
          icono="🗓️"
          titulo="Mi horario"
          descripcion="Consulta las materias y laboratorios de tu gestión."
          onPress={() => navigation.navigate('MiHorario')}
        />
        <CardAccion
          icono="⚠️"
          titulo="Mis incidencias"
          descripcion="Consulta el estado de tus reportes de fallas en laboratorios."
          onPress={() => navigation.navigate('MisIncidencias')}
        />
        <CardAccion
          icono="🧰"
          titulo="Reportar falla"
          descripcion="Detectaste un problema en un laboratorio. Repórtalo aquí."
          onPress={() => navigation.navigate('ReportarIncidencia')}
        />
      </View>

      <TouchableOpacity style={estilos.config} onPress={() => navigation.navigate('Configuracion')}>
        <Text style={estilos.configTexto}>⚙️ Configurar servidor</Text>
      </TouchableOpacity>
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
    paddingTop: 60,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colores.fondoCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: colores.fondo,
    fontSize: 22,
    fontWeight: '800',
  },
  perfilInfo: {
    flex: 1,
  },
  nombre: {
    color: colores.texto,
    fontSize: 18,
    fontWeight: '700',
  },
  ru: {
    color: colores.textoSuave,
    fontSize: 14,
    marginTop: 2,
  },
  salir: {
    color: colores.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  seccion: {
    color: colores.textoSuave,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 14,
  },
  opciones: {
    gap: 12,
  },
  config: {
    marginTop: 24,
    alignItems: 'center',
  },
  configTexto: {
    color: colores.primario,
    fontSize: 14,
    fontWeight: '600',
  },
});