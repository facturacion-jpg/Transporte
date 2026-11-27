export const TIPOS_CONFIG = {
  Recoger: {
    key: 'Recoger',
    label: 'Recoger',
    desc: 'Retirar material, paquete o insumo en un punto.',
    tituloLabel: '¿Qué se debe recoger?',
    tituloPlaceholder: 'Ej. Rollos de tela referencia 204',
    origenLabel: 'Punto de recogida',
    origenPlaceholder: 'Proveedor, bodega, dirección...',
    destinoLabel: 'Lugar de entrega',
    destinoPlaceholder: '¿A dónde se lleva?',
  },
  Llevar: {
    key: 'Llevar',
    label: 'Llevar',
    desc: 'Trasladar documentos, materiales o equipos.',
    tituloLabel: '¿Qué se debe llevar?',
    tituloPlaceholder: 'Ej. Documentos firmados para gerencia',
    origenLabel: 'Origen',
    origenPlaceholder: '¿Desde dónde sale?',
    destinoLabel: 'Destino',
    destinoPlaceholder: '¿A dónde se lleva?',
  },
  Entregar: {
    key: 'Entregar',
    label: 'Entregar',
    desc: 'Realizar una entrega a cliente, área o proveedor.',
    tituloLabel: '¿Qué se debe entregar?',
    tituloPlaceholder: 'Ej. Pedido terminado para cliente',
    origenLabel: 'Punto de salida',
    origenPlaceholder: '¿Desde dónde se despacha?',
    destinoLabel: 'Destinatario / lugar de entrega',
    destinoPlaceholder: 'Cliente, área o dirección de entrega',
  },
  'Cita de producción': {
    key: 'Cita de producción',
    label: 'Cita de producción',
    desc: 'Traslado para reunión, cita o gestión operativa.',
    tituloLabel: 'Motivo de la cita',
    tituloPlaceholder: 'Ej. Revisión de muestras con estampador',
    origenLabel: 'Lugar de salida',
    origenPlaceholder: '¿Desde dónde sale?',
    destinoLabel: 'Lugar de la cita',
    destinoPlaceholder: '¿Dónde es la cita?',
  },
}

export const TIPOS = Object.keys(TIPOS_CONFIG)

export const PRIORIDADES = {
  alta: { label: 'Alta', order: 0 },
  media: { label: 'Media', order: 1 },
  baja: { label: 'Baja', order: 2 },
}

export const ESTADOS = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completo: 'Completo',
  pospuesto: 'Pospuesto',
  incompleto: 'Incompleto',
}

export const MOTIVOS_INCOMPLETO = [
  'El proveedor no lo tenía listo',
  'Nadie recibió',
  'Dirección incorrecta',
  'Otro motivo',
]

export const HORAS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00',
]

export const STORAGE_KEY = 'ruta-wilson'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysISO(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const SEED_REQUESTS = [
  {
    id: 101,
    tipo: 'Recoger',
    titulo: 'Cajas de insumos "Operación Fantasma"',
    origen: 'Bodega El Pirata, Calle 99',
    destino: 'Planta principal',
    prioridad: 'alta',
    solicitante: 'Compras',
    estado: 'pendiente',
    fecha: todayISO(),
    hora: '07:30',
    confW: false,
    confS: false,
    motivo: '',
  },
  {
    id: 102,
    tipo: 'Llevar',
    titulo: 'Planos secretos de producción',
    origen: 'Oficina de diseño',
    destino: 'Taller Norte',
    prioridad: 'media',
    solicitante: 'Diseño',
    estado: 'en_proceso',
    fecha: todayISO(),
    hora: '09:00',
    confW: false,
    confS: false,
    motivo: '',
  },
  {
    id: 103,
    tipo: 'Entregar',
    titulo: 'Pedido camuflado para cliente VIP',
    origen: 'Centro de despacho',
    destino: 'Cliente Barba Negra S.A.S.',
    prioridad: 'alta',
    solicitante: 'Comercial',
    estado: 'completo',
    fecha: todayISO(),
    hora: '11:30',
    confW: true,
    confS: false,
    motivo: '',
  },
  {
    id: 104,
    tipo: 'Cita de producción',
    titulo: 'Reunión clandestina con proveedor',
    origen: 'Planta principal',
    destino: 'Café del Puerto',
    prioridad: 'media',
    solicitante: 'Gerencia',
    estado: 'pendiente',
    fecha: todayISO(),
    hora: '14:00',
    confW: false,
    confS: false,
    motivo: '',
  },
  {
    id: 105,
    tipo: 'Recoger',
    titulo: 'Paquete misterioso #007',
    origen: 'Mensajería La Gaviota',
    destino: 'Recepción administrativa',
    prioridad: 'baja',
    solicitante: 'Administración',
    estado: 'pospuesto',
    fecha: addDaysISO(1),
    hora: '08:30',
    confW: false,
    confS: false,
    motivo: '',
  },
  {
    id: 106,
    tipo: 'Entregar',
    titulo: 'Muestras disfrazadas de colección',
    origen: 'Sala de muestras',
    destino: 'Cliente Isla del Tesoro',
    prioridad: 'alta',
    solicitante: 'Producción',
    estado: 'pendiente',
    fecha: addDaysISO(1),
    hora: '10:00',
    confW: false,
    confS: false,
    motivo: '',
  },
  {
    id: 107,
    tipo: 'Llevar',
    titulo: 'Maletín con documentos de abordaje',
    origen: 'Gerencia',
    destino: 'Notaría Central',
    prioridad: 'media',
    solicitante: 'Legal',
    estado: 'completo',
    fecha: addDaysISO(-1),
    hora: '15:30',
    confW: true,
    confS: true,
    motivo: '',
  },
  {
    id: 108,
    tipo: 'Recoger',
    titulo: 'Barriles de tinta especial',
    origen: 'Proveedor Tintas del Caribe',
    destino: 'Bodega de insumos',
    prioridad: 'baja',
    solicitante: 'Logística',
    estado: 'incompleto',
    fecha: addDaysISO(-1),
    hora: '16:00',
    confW: false,
    confS: false,
    motivo: 'El proveedor no lo tenía listo',
  },
]
