import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colores } from '../theme/colors';

export function Tarjeta({ children }: { children: ReactNode }) {
  return <View style={estilos.tarjeta}>{children}</View>;
}

export function TituloPantalla({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <View style={estilos.cabecera}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

export function Boton({
  titulo,
  onPress,
  tipo = 'primario',
  cargando,
}: {
  titulo: string;
  onPress: () => void;
  tipo?: 'primario' | 'secundario' | 'danger';
  cargando?: boolean;
}) {
  const fondo =
    tipo === 'primario' ? colores.primario : tipo === 'danger' ? colores.danger : 'transparent';
  const colorTexto = tipo === 'secundario' ? colores.texto : colores.fondo;
  const borde = tipo === 'secundario' ? colores.bordeFuerte : undefined;

  return (
    <TouchableOpacity
      style={[estilos.boton, { backgroundColor: fondo, borderWidth: borde ? 1 : 0, borderColor: borde }]}
      onPress={onPress}
      disabled={cargando}
    >
      {cargando ? <ActivityIndicator color={tipo === 'secundario' ? colores.texto : colores.fondo} /> : <Text style={[estilos.textoBoton, { color: colorTexto }]}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

export function CampoTexto({
  valor,
  onChange,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  valor: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <TextInput
      style={estilos.campo}
      placeholder={placeholder}
      value={valor}
      onChangeText={onChange}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      placeholderTextColor={colores.textoTenue}
    />
  );
}

export function CardAccion({
  icono,
  titulo,
  descripcion,
  onPress,
}: {
  icono: string;
  titulo: string;
  descripcion: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={estilos.card} onPress={onPress}>
      <View style={estilos.icono}>
        <Text style={estilos.iconoTexto}>{icono}</Text>
      </View>
      <View style={estilos.cardTexto}>
        <Text style={estilos.cardTitulo}>{titulo}</Text>
        <Text style={estilos.cardDescripcion}>{descripcion}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function MensajeError({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <View style={estilos.alertaError}>
      <Text style={estilos.alertaErrorTexto}>{mensaje}</Text>
    </View>
  );
}

export function AvisoExito({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <View style={estilos.alertaExito}>
      <Text style={estilos.alertaExitoTexto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.fondoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
  },
  cabecera: {
    marginBottom: 20,
  },
  titulo: {
    color: colores.texto,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitulo: {
    color: colores.textoSuave,
    fontSize: 14,
    marginTop: 4,
  },
  boton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: '700',
  },
  campo: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colores.texto,
  },
  card: {
    backgroundColor: colores.fondoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colores.fondoCard2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: {
    fontSize: 22,
  },
  cardTexto: {
    flex: 1,
  },
  cardTitulo: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescripcion: {
    color: colores.textoSuave,
    fontSize: 13,
    marginTop: 2,
  },
  alertaError: {
    backgroundColor: colores.dangerSuave,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.danger,
    padding: 12,
  },
  alertaErrorTexto: {
    color: colores.danger,
    fontSize: 14,
  },
  alertaExito: {
    backgroundColor: colores.exitoSuave,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.exito,
    padding: 12,
  },
  alertaExitoTexto: {
    color: colores.exito,
    fontSize: 14,
  },
});