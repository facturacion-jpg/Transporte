import { pad, toISODate, toTime, todayISO, tomorrowISO } from '../utils/datetime'
import {
  LEGACY_STORAGE_KEY,
  belongsToUser,
  isPendingRequest,
  mergeRemoteItem,
  normalizeEmail,
  requestSignature,
  storageKeyFor,
} from '../utils/owner'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
const USE_REMOTE = Boolean(API_URL)

function normalizeRequest(r) {
  const raw = r || {}
  const fecha = toISODate(raw.fecha || (raw.dia === 'manana' ? tomorrowISO() : todayISO()))
  const email = normalizeEmail(raw.solicitanteEmail || raw.emailSolicitante || raw.email || raw.correo)
  return {
    ...raw,
    id: raw.id ?? raw.ID ?? raw.Id,
    tipo: raw.tipo || '',
    titulo: raw.titulo || '',
    origen: raw.origen || '',
    destino: raw.destino || '',
    prioridad: raw.prioridad || 'media',
    solicitante: raw.solicitante || '',
    estado: raw.estado || 'pendiente',
    fecha,
    hora: toTime(raw.hora || ''),
    motivo: raw.motivo || '',
    observaciones: raw.observaciones || '',
    solicitanteEmail: email,
    confW: raw.confW === true || raw.confW === 'TRUE' || raw.confW === 'true',
    confS: raw.confS === true || raw.confS === 'TRUE' || raw.confS === 'true',
  }
}

export {
  normalizeRequest,
  belongsToUser,
  isPendingRequest,
  mergeRemoteItem,
  requestSignature,
  storageKeyFor,
  pad,
}

export function isRemoteEnabled() {
  return USE_REMOTE
}

// Cada usuario tiene su propio almacén local. Wilson tiene uno con todas las
// solicitudes; los solicitantes uno privado con las suyas.
export function loadRequests(user) {
  const key = storageKeyFor(user)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw).map(normalizeRequest)
      return parsed.filter((r) => belongsToUser(r, user))
    }

    // Migración segura del almacén antiguo (una sola vez por usuario):
    // se copian solo las solicitudes que realmente le pertenecen.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const migrated = JSON.parse(legacy)
        .map(normalizeRequest)
        .filter((r) => belongsToUser(r, user))
      if (migrated.length) {
        localStorage.setItem(key, JSON.stringify(migrated))
        return migrated
      }
    }
  } catch {}
  return []
}

export function saveRequests(items, user) {
  try {
    localStorage.setItem(storageKeyFor(user), JSON.stringify(items))
  } catch {}
}

async function post(action, payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Error API')
  return data
}

export async function fetchRequests() {
  if (!USE_REMOTE) return loadRequests()
  const data = await post('list', {})
  return (data.items || []).map(normalizeRequest)
}

export async function createRequest(item) {
  if (!USE_REMOTE) return item
  const data = await post('create', { item })
  return normalizeRequest(data.item || item)
}

export async function patchRequest(id, patch) {
  if (!USE_REMOTE) return { id, ...patch }
  const data = await post('update', { id, patch })
  return normalizeRequest(data.item || { id, ...patch })
}

export async function fetchUsers() {
  if (!USE_REMOTE) return []
  const data = await post('users', {})
  return (data.users || []).map((u) => ({
    email: String(u.email || '').trim().toLowerCase(),
    role: u.role === 'wilson' ? 'wilson' : 'solicitante',
    name: String(u.name || '').trim(),
  })).filter((u) => u.email)
}
