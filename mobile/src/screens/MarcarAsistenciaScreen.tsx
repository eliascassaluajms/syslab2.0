import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { marcarAsistencia } from '../services/asistencia.service';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import ScanQr from '../components/ScanQr';
import { AvisoExito, Boton, CampoTexto, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MarcarAsistencia'>;

export default function MarcarAsistenciaScreen(_props: Props) {
  const { token } = useAuth();
  const [modo, setModo] = useState<'qr' | 'manual'>('qr');
  const [tokenQr, setTokenQr] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState('');

  const registrar = async (qrLeido: string) => {
    if (!token || procesando) return;
    setError('');
    setResultado('');
    setProcesando(true);
    try {
      const res = await marcarAsistencia(token, qrLeido.trim());
      setResultado(`Asistencia registrada (${res.estado}). ${res.materia ? `Materia: ${res.materia}.` : ''}`);
      setModo('qr');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la asistencia.');
      setModo('qr');
    } finally {
      setProcesando(false);
    }
  };

  const registrarManual = async () => {
    if (!tokenQr.trim()) {
      setError('Ingrese el token que aparece en el QR de la sesión.');
      return;
    }
    await registrar(tokenQr);
  };

  const alternarModo = () => {
    setError('');
    setResultado('');
    setModo((m) => (m === 'qr' ? 'manual' : 'qr'));
  };

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.cabecera}>
        <TituloPantalla titulo="Marcar asistencia" subtitulo="Escanee el QR de la sesión en el laboratorio" />

        {resultado ? (
          <View style={estilos.resultado}>
            <AvisoExito mensaje={resultado} />
            <Boton titulo="Registrar otra" onPress={() => { setResultado(''); setModo('qr'); }} />
          </View>
        ) : error ? (
          <View style={estilos.textoCentrado}>
            <MensajeError mensaje={error} />
            <Boton titulo="Reintentar" onPress={() => { setError(''); setModo('qr'); }} />
          </View>
        ) : (
          <View style={estilos.contenido}>
            {modo === 'qr' ? (
              <View style={estilos.scaner}>
                <ScanQr activo={modo === 'qr'} onEscaneo={(d) => void registrar(d)} />
              </View>
            ) : (
              <View style={estilos.manual}>
                <Text style={estilos.etiqueta}>Token de la sesión</Text>
                <CampoTexto
                  valor={tokenQr}
                  onChange={setTokenQr}
                  placeholder="Pegue el token del código QR"
                  autoCapitalize="none"
                />
                {procesando ? (
                  <Boton titulo="Registrando…" onPress={() => void 0} cargando />
                ) : (
                  <Boton titulo="Registrar asistencia" onPress={() => void registrarManual()} />
                )}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={estilos.alternar} onPress={alternarModo}>
          <Text style={estilos.alternarTexto}>
            {modo === 'qr' ? '¿No puedes escanear? Ingresar manualmente' : 'Escane con la cámara'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  cabecera: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  contenido: {
    flex: 1,
    marginTop: 12,
  },
  scaner: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  manual: {
    gap: 12,
    paddingVertical: 16,
  },
  etiqueta: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultado: {
    gap: 14,
    marginTop: 12,
  },
  textoCentrado: {
    gap: 14,
    marginTop: 12,
  },
  alternar: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  alternarTexto: {
    color: colores.primario,
    fontSize: 14,
    fontWeight: '600',
  },
});