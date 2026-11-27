// Dueño de cada solicitud y aislamiento de almacenamiento por usuario.
// Wilson ve todo; cada solicitante solo ve/guarda lo suyo.

export const LEGACY_STORAGE_KEY = 'ruta-wilson'

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isWilson(user) {
  return String(user?.role || '').trim().toLowerCase() === 'wilson'
}

export function storageKeyFor(user) {
  if (!user) return LEGACY_STORAGE_KEY
  if (isWilson(user)) return `${LEGACY_STORAGE_KEY}:wilson`
  const email = normalizeEmail(user.email)
  return email ? `${LEGACY_STORAGE_KEY}:solicitante:${email}` : LEGACY_STORAGE_KEY
}

export function belongsToUser(request, user) {
  if (!request) return false
  if (!user) return true
  if (isWilson(user)) return true

  const myEmail = normalizeEmail(user.email)
  const requestEmail = normalizeEmail(request.solicitanteEmail || request.emailSolicitante)
  if (myEmail && requestEmail) return myEmail === requestEmail

  const myName = String(user.name || '').trim().toLowerCase()
  const requestName = String(request.solicitante || '').trim().toLowerCase()
  if (myName && requestName && myName === requestName) return true
  if (myEmail && requestName && requestName === myEmail) return true

  // Las filas sin dueño conocido no se muestran a un solicitante para no
  // mezclar solicitudes de otras personas. Wilson sí las ve todas.
  return false
}

export function isEmptyValue(value) {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

export function mergeRemoteItem(local, remote) {
  if (!local) return remote
  if (!remote) return local
  const merged = { ...local, ...remote }

  // Si Google Sheets devuelve un campo vacío, conservamos el valor local
  // válido en lugar de borrarlo.
  const textFields = [
    'solicitanteEmail', 'solicitante', 'titulo', 'tipo', 'origen', 'destino',
    'prioridad', 'estado', 'fecha', 'hora', 'motivo', 'observaciones',
  ]
  textFields.forEach((key) => {
    if (isEmptyValue(remote[key]) && !isEmptyValue(local[key])) merged[key] = local[key]
  })

  ;['confW', 'confS'].forEach((key) => {
    if (remote[key] == null) {
      if (local[key] != null) merged[key] = local[key]
    } else {
      merged[key] = remote[key] === true || remote[key] === 'TRUE' || remote[key] === 'true'
    }
  })

  return merged
}

export function requestSignature(request) {
  return [
    normalizeEmail(request?.solicitanteEmail),
    String(request?.titulo || '').trim().toLowerCase(),
    String(request?.fecha || '').trim(),
    String(request?.hora || '').trim(),
    String(request?.origen || '').trim().toLowerCase(),
    String(request?.destino || '').trim().toLowerCase(),
  ].join('|')
}

export function isPendingRequest(request) {
  return String(request?.id || '').length >= 13
}
