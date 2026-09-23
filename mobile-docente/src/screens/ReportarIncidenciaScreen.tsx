import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import {
  crearIncidencia,
  listarEquipos,
  listarLaboratorios,
  obtenerLaboratoriosActivos,
  subirEvidenciaIncidencia,
} from '../services/incidencias.service';
import type {
  CategoriaEquipoIncidenciaMovil,
  EquipoOpcionMovil,
  LaboratorioOpcionMovil,
  PrioridadIncidenciaMovil,
  TipoIncidenciaMovil,
} from '../types/incidencia';
import { ApiError } from '../services/api';
import { colores } from '../theme/colors';
import { Boton, MensajeError, TituloPantalla } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportarIncidencia'>;

const TIPOS: { valor: TipoIncidenciaMovil; etiqueta: string }[] = [
  { valor: 'HARDWARE', etiqueta: 'Hardware' },
  { valor: 'SOFTWARE', etiqueta: 'Software' },
  { valor: 'RED', etiqueta: 'Red / Internet' },
  { valor: 'INFRAESTRUCTURA', etiqueta: 'Infraestructura' },
];

const CATEGORIAS: { valor: CategoriaEquipoIncidenciaMovil; etiqueta: string }[] = [
  { valor: 'PC', etiqueta: 'PC / Equipo de escritorio' },
  { valor: 'PROYECTOR', etiqueta: 'Proyector' },
  { valor: 'AIRE_ACONDICIONADO', etiqueta: 'Aire acondicionado' },
  { valor: 'RED_INTERNET', etiqueta: 'Red / Internet' },
  { valor: 'PERIFERICO', etiqueta: 'Periférico' },
  { valor: 'SOFTWARE', etiqueta: 'Software' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

const PRIORIDADES: { valor: PrioridadIncidenciaMovil; etiqueta: string }[] = [
  { valor: 'BAJA', etiqueta: 'Leve' },
  { valor: 'MEDIA', etiqueta: 'Moderada' },
  { valor: 'ALTA', etiqueta: 'Alta' },
  { valor: 'CRITICA', etiqueta: 'Crítica' },
];

interface ArchivoSeleccionado {
  uri: string;
  nombre: string;
  tipo: string;
}

const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_TAMANIO_EVIDENCIA = 10 * 1024 * 1024;

function generarClienteUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function ReportarIncidenciaScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [clienteUuid, setClienteUuid] = useState(generarClienteUuid);

  const [laboratorios, setLaboratorios] = useState<LaboratorioOpcionMovil[]>([]);
  const [equipos, setEquipos] = useState<EquipoOpcionMovil[]>([]);
  const [labId, setLabId] = useState<string>('');
  const [equipoId, setEquipoId] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaEquipoIncidenciaMovil>('PC');
  const [tipo, setTipo] = useState<TipoIncidenciaMovil>('HARDWARE');
  const [prioridad, setPrioridad] = useState<PrioridadIncidenciaMovil>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<ArchivoSeleccionado | null>(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [enviado, setEnviado] = useState<{ folio: string } | null>(null);
  const [error, setError] = useState('');

  const cargarCatalogos = async () => {
    if (!token) return;
    setCargandoCatalogos(true);
    try {
      const [autodetectar, labs] = await Promise.all([
        obtenerLaboratoriosActivos(token),
        listarLaboratorios(token),
      ]);
      setLaboratorios(labs.length > 0 ? labs : autodetectar);
      if (autodetectar.length > 0) {
        setLabId(String(autodetectar[0].id));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los laboratorios.');
    } finally {
      setCargandoCatalogos(false);
    }
  };

  useEffect(() => {
    void cargarCatalogos();
  }, [token]);

  const esPC = categoria === 'PC';

  const cargarEquipos = async (lab: string) => {
    if (!token || !lab || !esPC) return;
    try {
      const lista = await listarEquipos(token, Number(lab));
      setEquipos(lista);
    } catch {
      setEquipos([]);
    }
  };

  const elegirArchivo = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const a = resultado.assets[0];
    const tipo = a.mimeType ?? 'image/jpeg';
    if (!MIME_PERMITIDOS.has(tipo)) {
      Alert.alert('Formato no permitido', 'La evidencia debe ser JPG, PNG, WEBP o GIF.');
      return;
    }
    if (typeof a.size === 'number' && a.size > MAX_TAMANIO_EVIDENCIA) {
      Alert.alert('Evidencia muy pesada', 'La imagen supera el tamaño máximo de 10 MB.');
      return;
    }
    setArchivo({ uri: a.uri, nombre: a.name, tipo });
  };

  const enviar = async () => {
    if (!token) return;
    if (procesando) return;
    if (!labId) {
      setError('Selecciona el laboratorio afectado.');
      return;
    }
    if (esPC && !equipoId) {
      setError('Selecciona el equipo afectado o elige una categoría general.');
      return;
    }
    if (!titulo.trim() || !descripcion.trim()) {
      setError('Completa el título y la descripción del problema.');
      return;
    }

    setProcesando(true);
    setError('');
    try {
      const creada = await crearIncidencia(token, {
        clienteUuid,
        laboratorioId: Number(labId),
        equipoId: esPC ? Number(equipoId) : null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        categoriaEquipo: categoria,
        prioridad,
      });

      if (archivo) {
        try {
          await subirEvidenciaIncidencia(token, creada.id, archivo);
        } catch {
          // La evidencia es opcional; el ticket ya quedó registrado.
        }
      }

      setEnviado({ folio: creada.folio });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo reportar la incidencia.');
    } finally {
      setProcesando(false);
    }
  };

  const selector = (
    opciones: { valor: string; etiqueta: string }[],
    valor: string,
    onChange: (v: string) => void,
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chips}>
      {opciones.map((op) => {
        const activo = valor === op.valor;
        return (
          <TouchableOpacity
            key={op.valor}
            onPress={() => onChange(op.valor)}
            style={[estilos.chip, activo && estilos.chipActivo]}
          >
            <Text style={[estilos.chipTexto, activo && { color: colores.fondo }]}>{op.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (enviado) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.exitoIcono}>✅</Text>
        <Text style={estilos.exitoTitulo}>Incidencia registrada</Text>
        <Text style={estilos.exitoSub}>Tu folio de seguimiento es</Text>
        <Text style={estilos.folio}>{enviado.folio}</Text>
        <View style={estilos.acciones}>
          <Boton titulo="Volver al inicio" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <TituloPantalla
          titulo="Reportar falla"
          subtitulo="Canaliza el ticket a Jefatura de Laboratorios."
        />

        {error ? <MensajeError mensaje={error} /> : null}

        {cargandoCatalogos ? (
          <ActivityIndicator style={estilos.cargando} color={colores.primario} />
        ) : (
          <>
            <Text style={estilos.etiqueta}>Laboratorio afectado *</Text>
            {laboratorios.length === 0 ? (
              <Text style={estilos.vacio}>No hay laboratorios disponibles.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chips}>
                {laboratorios.map((lab) => {
                  const activo = labId === String(lab.id);
                  return (
                    <TouchableOpacity
                      key={lab.id}
                      onPress={() => {
                        setLabId(String(lab.id));
                        setEquipoId('');
                        void cargarEquipos(String(lab.id));
                      }}
                      style={[estilos.chip, activo && estilos.chipActivo]}
                    >
                      <Text style={[estilos.chipTexto, activo && { color: colores.fondo }]}>{lab.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={estilos.etiqueta}>Activo afectado</Text>
            {selector(CATEGORIAS, categoria, (v) => {
              setCategoria(v as CategoriaEquipoIncidenciaMovil);
              setEquipoId('');
            })}

            {categoria === 'PC' ? (
              <>
                <Text style={estilos.etiqueta}>Equipo (PC) *</Text>
                {equipos.length === 0 ? (
                  <Text style={estilos.vacio}>
                    {labId ? 'No hay equipos de cómputo en este laboratorio.' : 'Selecciona primero el laboratorio.'}
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chips}>
                    {equipos.map((eq) => {
                      const activo = equipoId === String(eq.id);
                      return (
                        <TouchableOpacity
                          key={eq.id}
                          onPress={() => setEquipoId(String(eq.id))}
                          style={[estilos.chip, activo && estilos.chipActivo]}
                        >
                          <Text style={[estilos.chipTexto, activo && { color: colores.fondo }]}>
                            {eq.codigoPatrimonial || eq.id} · {eq.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            ) : (
              <Text style={estilos.vacio}>Categoría general: sin equipo específico.</Text>
            )}

            <Text style={estilos.etiqueta}>Tipo de falla</Text>
            {selector(TIPOS, tipo, (v) => setTipo(v as TipoIncidenciaMovil))}

            <Text style={estilos.etiqueta}>Prioridad / Impacto</Text>
            {selector(PRIORIDADES, prioridad, (v) => setPrioridad(v as PrioridadIncidenciaMovil))}

            <Text style={estilos.etiqueta}>Título del problema *</Text>
            <TextInput
              style={estilos.campo}
              placeholder="Ej.: PC N°12 no enciende"
              placeholderTextColor={colores.textoTenue}
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={estilos.etiqueta}>Descripción detallada *</Text>
            <TextInput
              style={[estilos.campo, estilos.area]}
              placeholder="Describa el fallo: qué observó y si interrumpe la clase."
              placeholderTextColor={colores.textoTenue}
              multiline
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={estilos.etiqueta}>Evidencia (captura sino, opcional)</Text>
            <TouchableOpacity style={estilos.archivo} onPress={() => void elegirArchivo()}>
              <Text style={[estilos.archivoTexto, archivo && { color: colores.exito }]}>
                {archivo ? `📎 ${archivo.nombre}` : 'Adjuntar captura o foto del error'}
              </Text>
            </TouchableOpacity>
            <Text style={estilos.nota}>JPG, PNG, WEBP o GIF · máx. 10 MB.</Text>

            <View style={estilos.acciones}>
              <Boton titulo="Enviar reporte" onPress={() => void enviar()} cargando={procesando} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    paddingBottom: 60,
  },
  cargando: {
    marginTop: 24,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.fondo,
    padding: 24,
  },
  exitoIcono: {
    fontSize: 44,
  },
  exitoTitulo: {
    color: colores.texto,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  exitoSub: {
    color: colores.textoSuave,
    fontSize: 14,
    marginTop: 8,
  },
  folio: {
    color: colores.exito,
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 10,
    letterSpacing: 1,
  },
  etiqueta: {
    color: colores.textoTenue,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  chips: {
    flexGrow: 0,
  },
  chip: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  chipActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  chipTexto: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: '600',
  },
  campo: {
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colores.texto,
  },
  area: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  archivo: {
    backgroundColor: colores.fondoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderStyle: 'dashed',
    padding: 14,
  },
  archivoTexto: {
    color: colores.textoSuave,
    fontSize: 15,
  },
  nota: {
    color: colores.textoTenue,
    fontSize: 12,
    marginTop: 6,
  },
  vacio: {
    color: colores.textoSuave,
    fontSize: 14,
  },
  acciones: {
    marginTop: 24,
  },
});