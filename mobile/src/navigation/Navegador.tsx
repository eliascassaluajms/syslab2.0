import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import InicioScreen from '../screens/InicioScreen';
import MiHorarioScreen from '../screens/MiHorarioScreen';
import MarcarAsistenciaScreen from '../screens/MarcarAsistenciaScreen';
import DesbloquearScreen from '../screens/DesbloquearScreen';
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
            <Stack.Screen
              name="Inicio"
              component={InicioScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MiHorario"
              component={MiHorarioScreen}
              options={{ title: 'Mi horario', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="MarcarAsistencia"
              component={MarcarAsistenciaScreen}
              options={{ title: 'Marcar asistencia', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="Desbloquear"
              component={DesbloquearScreen}
              options={{ title: 'Desbloquear equipo', headerBackTitle: 'Inicio' }}
            />
            <Stack.Screen
              name="Configuracion"
              component={ConfiguracionScreen}
              options={{ title: 'Configuración', headerBackTitle: 'Inicio' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
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