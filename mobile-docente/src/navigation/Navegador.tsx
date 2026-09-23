import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import InicioScreen from '../screens/InicioScreen';
import MiHorarioScreen from '../screens/MiHorarioScreen';
import IniciarSesionScreen from '../screens/IniciarSesionScreen';
import SesionesScreen from '../screens/SesionesScreen';
import DetalleSesionScreen from '../screens/DetalleSesionScreen';
import DefensasScreen from '../screens/DefensasScreen';
import DetalleDefensaScreen from '../screens/DetalleDefensaScreen';
import MisIncidenciasScreen from '../screens/MisIncidenciasScreen';
import ReportarIncidenciaScreen from '../screens/ReportarIncidenciaScreen';
import DetalleIncidenciaScreen from '../screens/DetalleIncidenciaScreen';
import { colores } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const tema = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colores.fondo,
    card: colores.fondoCard,
    text: colores.texto,
    primary: colores.primario,
    border: colores.borde,
  },
};

export default function Navegador() {
  const { token, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  return (
    <NavigationContainer theme={tema}>
      <Stack.Navigator>
        {token ? (
          <>
            <Stack.Screen name="Inicio" component={InicioScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="IniciarSesion"
              component={IniciarSesionScreen}
              options={{ title: 'Iniciar sesión', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="Sesiones"
              component={SesionesScreen}
              options={{ title: 'Mis sesiones', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="DetalleSesion"
              component={DetalleSesionScreen}
              options={{ title: 'Sesión', headerBackTitle: 'Sesiones' }}
            />
            <Stack.Screen
              name="Defensas"
              component={DefensasScreen}
              options={{ title: 'Trabajos de grado', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="DetalleDefensa"
              component={DetalleDefensaScreen}
              options={{ title: 'Detalle', headerBackTitle: 'Trabajos de grado' }}
            />
            <Stack.Screen
              name="MisIncidencias"
              component={MisIncidenciasScreen}
              options={{ title: 'Mis incidencias', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="ReportarIncidencia"
              component={ReportarIncidenciaScreen}
              options={{ title: 'Reportar falla', headerBackTitle: 'Mis incidencias' }}
            />
            <Stack.Screen
              name="DetalleIncidencia"
              component={DetalleIncidenciaScreen}
              options={{ title: 'Incidencia', headerBackTitle: 'Mis incidencias' }}
            />
            <Stack.Screen
              name="MiHorario"
              component={MiHorarioScreen}
              options={{ title: 'Mi horario', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="Configuracion"
              component={ConfiguracionScreen}
              options={{ title: 'Configuración', headerBackTitle: 'Inicio' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Configuracion"
              component={ConfiguracionScreen}
              options={{ title: 'Configuración' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
