import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colores } from '../theme/colors';

interface Props {
  onEscaneo: (data: string) => void;
  activo: boolean;
}

export default function ScanQr({ onEscaneo, activo }: Props) {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState<string | null>(null);

  useEffect(() => {
    if (!activo) {
      setEscaneado(null);
    }
  }, [activo]);

  if (!permiso) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colores.primario} />
        <Text style={styles.texto}>Comprobando permisos de cámara…</Text>
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.texto}>Se necesita acceso a la cámara para escanear el código QR.</Text>
        <TouchableOpacity style={styles.boton} onPress={solicitarPermiso}>
          <Text style={styles.textoBoton}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.camara}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={activo}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (escaneado || !activo) return;
          setEscaneado(data);
          onEscaneo(data);
        }}
      />
      <View style={styles.marco}>
        <View style={styles.esquinas} />
      </View>
      <Text style={styles.pista}>Alinee el código QR dentro del marco</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colores.fondo,
  },
  texto: {
    color: colores.textoSuave,
    fontSize: 15,
    textAlign: 'center',
  },
  boton: {
    backgroundColor: colores.primario,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  textoBoton: {
    color: colores.fondo,
    fontWeight: '700',
  },
  camara: {
    flex: 1,
    overflow: 'hidden',
  },
  marco: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  esquinas: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: colores.primario,
    borderRadius: 20,
  },
  pista: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colores.blanco,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    paddingVertical: 8,
    fontSize: 13,
  },
});