import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { obtenerApiUrl, guardarApiUrl } from '../services/storage';
import { peticion } from '../services/api';
import { colores } from '../theme/colors';
import { AvisoExito, Boton, CampoTexto, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracion'>;

export default function ConfiguracionScreen({ navigation }: Props) {
  const [url, setUrl] = useState('');
  const [probando, setProbando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    void obtenerApiUrl().then(setUrl);
  }, []);

  const probar = async () => {
    setError('');
    setExito('');
    setProbando(true);
    try {
      await peticion({ metodo: 'GET', ruta: '/api/health' });
      setExito('Conexión exitosa con el servidor.');
    } catch {
      setError('No se pudo conectar. Revise la URL e intente de nuevo.');
    } finally {
      setProbando(false);
    }
  };

  const guardar = async () => {
    if (!url.trim()) {
      setError('Ingrese la URL del servidor.');
      return;
    }
    await guardarApiUrl(url.trim());
    setExito('Configuración guardada.');
    setTimeout(() => navigation.goBack(), 600);
  };

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.contenedor}>
        <TituloPantalla titulo="Configurar servidor" subtitulo="Dirección donde corre la API de SysLab 2.0." />

        <View style={estilos.form}>
          <Text style={estilos.etiqueta}>URL del servidor</Text>
          <CampoTexto
            valor={url}
            onChange={setUrl}
            placeholder="https://api.syslab.edu.bo"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={estilos.ayuda}>Incluya el protocolo y el puerto si corresponde. Ej.: http://192.168.1.10:5000</Text>

          <View style={estilos.botones}>
            <Boton titulo={probando ? 'Probando…' : 'Probar conexión'} onPress={() => void probar()} tipo="secundario" cargando={probando} />
            <Boton titulo="Guardar" onPress={() => void guardar()} />
          </View>

          <View style={estilos.banda}>
            <MensajeError mensaje={error} />
            <AvisoExito mensaje={exito} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  form: {
    gap: 10,
  },
  etiqueta: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ayuda: {
    color: colores.textoTenue,
    fontSize: 13,
  },
  botones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  banda: {
    marginTop: 14,
    gap: 10,
  },
});