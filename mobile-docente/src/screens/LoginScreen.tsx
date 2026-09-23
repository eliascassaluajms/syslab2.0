import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/auth.service';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import { Boton, CampoTexto, MensajeError } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { iniciarSesion } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    if (cargando) return;
    setError('');
    if (!identificador.trim() || !password) {
      setError('Ingrese su Registro Universitario o correo y la contraseña.');
      return;
    }

    setCargando(true);
    try {
      const sesion = await login(identificador.trim(), password);
      await iniciarSesion(sesion.token, sesion.usuario, sesion.refreshToken);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled">
        <View style={estilos.marca}>
          <View style={estilos.logo}>
            <Text style={estilos.logoTexto}>S</Text>
          </View>
          <Text style={estilos.nombreApp}>SysLab Docente</Text>
          <Text style={estilos.eslogan}>Gestión de prácticas: bitácora, asistencia y equipos de laboratorio</Text>
        </View>

        <View style={estilos.form}>
          <Text style={estilos.etiqueta}>Registro Universitario o correo</Text>
          <CampoTexto valor={identificador} onChange={setIdentificador} placeholder="Ej.: 2023123456 o juan@uajms.edu.bo" autoCapitalize="none" />

          <Text style={[estilos.etiqueta, estilos.marginTop]}>Contraseña</Text>
          <CampoTexto valor={password} onChange={setPassword} placeholder="••••••••" secureTextEntry autoCapitalize="none" />

          <View style={estilos.errorWrapper}>
            <MensajeError mensaje={error} />
          </View>

          {cargando ? (
            <View style={estilos.cargando}>
              <ActivityIndicator color={colores.primario} />
            </View>
          ) : (
            <Boton titulo="Ingresar" onPress={() => void enviar()} />
          )}

          <TouchableOpacity
            style={estilos.configuracion}
            onPress={() => navigation.navigate('Configuracion')}
          >
            <Text style={estilos.configuracionTexto}>Configurar servidor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  cuerpo: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  marca: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoTexto: {
    color: colores.fondo,
    fontSize: 36,
    fontWeight: '900',
  },
  nombreApp: {
    color: colores.texto,
    fontSize: 26,
    fontWeight: '800',
  },
  eslogan: {
    color: colores.textoSuave,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  form: {
    gap: 4,
  },
  etiqueta: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  marginTop: {
    marginTop: 14,
  },
  errorWrapper: {
    marginTop: 14,
  },
  cargando: {
    marginTop: 14,
    alignItems: 'center',
  },
  configuracion: {
    marginTop: 20,
    alignItems: 'center',
  },
  configuracionTexto: {
    color: colores.primario,
    fontSize: 14,
    fontWeight: '600',
  },
});