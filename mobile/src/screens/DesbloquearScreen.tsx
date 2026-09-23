import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { liberarEquipo } from '../services/unlock.service';
import { ApiError } from '../services/api';
import type { DesafioQR } from '../types/api';
import { colores } from '../theme/colors';
import ScanQr from '../components/ScanQr';
import { AvisoExito, Boton, CampoTexto, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Desbloquear'>;

function parsearQr(data: string): DesafioQR | null {
  if (!data.startsWith('{')) return null;
  try {
    const obj = JSON.parse(data) as Partial<DesafioQR>;
    if (typeof obj.d === 'number' && typeof obj.c === 'string' && typeof obj.l === 'number') {
      return { d: obj.d, c: obj.c, l: obj.l };
    }
    return null;
  } catch {
    return null;
  }
}

export default function DesbloquearScreen(_props: Props) {
  const { token } = useAuth();
  const [modo, setModo] = useState<'qr' | 'manual'>('qr');
  const [codigo, setCodigo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState('');

  const liberar = async (codigoIngresado: string, laboratorioId?: number) => {
    if (!token || procesando) return;
    setError('');
    setResultado('');
    setProcesando(true);
    try {
      const res = await liberarEquipo(token, codigoIngresado, laboratorioId);
      const equipo = res.equipo?.codigoPatrimonial ?? '';
      const lab = res.laboratorio?.nombre ?? '';
      setResultado(`Equipo ${equipo} desbloqueado en ${lab}.`);
      setModo('qr');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo desbloquear el equipo.');
      setModo('qr');
    } finally {
      setProcesando(false);
    }
  };

  const alEscaneo = async (data: string) => {
    const qr = parsearQr(data);
    if (!qr) {
      setError('El código escaneado no es un QR de desbloqueo de equipo.');
      setModo('qr');
      return;
    }
    await liberar(qr.c, qr.l);
  };

  const liberarManual = async () => {
    if (!/^\d{2}$/.test(codigo.trim())) {
      setError('Ingrese el código de 2 dígitos que muestra el equipo.');
      return;
    }
    await liberar(codigo.trim());
  };

  const alternarModo = () => {
    setError('');
    setResultado('');
    setCodigo('');
    setModo((m) => (m === 'qr' ? 'manual' : 'qr'));
  };

  const encabezado =
    resultado || error ? (
      <View style={estilos.respuesta}>
        {resultado ? (
          <>
            <AvisoExito mensaje={resultado} />
            <Boton titulo="Desbloquear otro equipo" onPress={() => { setResultado(''); setModo('qr'); }} />
          </>
        ) : (
          <>
            <MensajeError mensaje={error} />
            <Boton titulo="Reintentar" onPress={() => { setError(''); setModo('qr'); }} />
          </>
        )}
      </View>
    ) : modo === 'qr' ? (
      <View style={estilos.contenido}>
        <View style={estilos.scaner}>
          <ScanQr activo={modo === 'qr'} onEscaneo={(d) => void alEscaneo(d)} />
        </View>
      </View>
    ) : (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={estilos.manual}>
        <Text style={estilos.ayuda}>{`Ingrese el código de 2 dígitos que aparece en la pantalla del equipo.\n\nIndica también el laboratorio si se le solicita.`}</Text>
        <Text style={estilos.etiqueta}>Código del equipo</Text>
        <CampoTexto
          valor={codigo}
          onChange={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 2))}
          placeholder="Ej.: 34"
          keyboardType="number-pad"
        />
        {procesando ? (
          <Boton titulo="Desbloqueando…" onPress={() => void 0} cargando />
        ) : (
          <Boton titulo="Desbloquear" onPress={() => void liberarManual()} />
        )}
      </ScrollView>
    );

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.cabecera}>
        <TituloPantalla titulo="Desbloquear equipo" subtitulo="Escanea el QR o ingresa el código de la PC" />
      </View>

      <View style={estilos.contenido}>{encabezado}</View>

      <TouchableOpacity style={estilos.alternar} onPress={alternarModo}>
        <Text style={estilos.alternarTexto}>
          {modo === 'qr' ? '¿No puedes escanear? Ingresar código manualmente' : 'Escane con la cámara'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  cabecera: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  contenido: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 20,
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
  ayuda: {
    color: colores.textoSuave,
    fontSize: 14,
    lineHeight: 21,
  },
  etiqueta: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  respuesta: {
    gap: 14,
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