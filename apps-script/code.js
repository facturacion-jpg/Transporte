const SPREADSHEET_ID = '1_NNgrin8EJTAqdyl68xYaYE1yna__wXuil8q10knLs8'
const SHEET_NAME = 'Solicitudes'
const USERS_SHEET_NAME = 'Usuarios'
const CONDUCTORES_SHEET_NAME = 'Conductores'
const CONDUCTORES_GID = '514657329'
const LEGACY_USERS_GID = '2109214734'

// Orden único y oficial de columnas. Este mismo orden se usa para leer y
// escribir, de modo que fecha, hora y correo nunca se desplacen.
const HEADERS = [
  'id', 'tipo', 'titulo', 'origen', 'destino', 'prioridad', 'solicitante',
  'solicitanteEmail', 'estado', 'fecha', 'hora', 'confW', 'confS', 'motivo',
  'observaciones', 'createdAt', 'updatedAt',
]

const ALIASES = {
  emailsolicitante: 'solicitanteEmail',
  email: 'solicitanteEmail',
  correo: 'solicitanteEmail',
  correoelectronico: 'solicitanteEmail',
  mail: 'solicitanteEmail',
  nombre: 'solicitante',
  nombres: 'solicitante',
  usuario: 'solicitante',
  area: 'solicitante',
}

function normalizeHeader_(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_\-]+/g, '')
}

const CANONICAL_KEYS = (function () {
  const map = {}
  HEADERS.forEach(function (h) { map[normalizeHeader_(h)] = h })
  return map
})()

function canonicalKey_(key) {
  const n = normalizeHeader_(key)
  return CANONICAL_KEYS[n] || ALIASES[n] || null
}

function pad2(n) {
  return ('0' + n).slice(-2)
}

function timeZone_() {
  return Session.getScriptTimeZone() || 'America/Bogota'
}

function toISODate_(value) {
  if (value == null || value === '') return ''
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, timeZone_(), 'yyyy-MM-dd')
  }
  if (typeof value === 'number') {
    const n = Math.floor(value)
    if (n > 20000 && n < 60000) {
      const d = new Date(Math.round((n - 25569) * 86400000))
      if (!isNaN(d.getTime())) {
        return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate())
      }
    }
  }
  const s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  let m = s.match(/^(\d{4}-\d{2}-\d{2})T/)
  if (m) return m[1]
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return m[3] + '-' + pad2(m[2]) + '-' + pad2(m[1])
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3])
  const d = new Date(s)
  if (!isNaN(d.getTime()) && s.indexOf('-') !== -1) return Utilities.formatDate(d, timeZone_(), 'yyyy-MM-dd')
  return s
}

function toTime_(value) {
  if (value == null || value === '') return ''
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, timeZone_(), 'HH:mm')
  }
  if (typeof value === 'number') {
    const frac = value % 1
    const total = Math.round((frac >= 0 ? frac : frac + 1) * 24 * 60) % (24 * 60)
    return pad2(Math.floor(total / 60)) + ':' + pad2(total % 60)
  }
  const s = String(value).trim()
  let m = s.match(/^(\d{1,2}):(\d{2})/)
  if (m) return pad2(m[1]) + ':' + m[2]
  m = s.match(/T(\d{2}):(\d{2})/)
  if (m) return m[1] + ':' + m[2]
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    const frac = n % 1
    const total = Math.round((frac >= 0 ? frac : frac + 1) * 24 * 60) % (24 * 60)
    return pad2(Math.floor(total / 60)) + ':' + pad2(total % 60)
  }
  return s
}

function toBool_(value) {
  return value === true || value === 1 ||
    ['true', '1', 'si', 'sí', 'yes'].indexOf(String(value == null ? '' : value).trim().toLowerCase()) !== -1
}

function findIndexes_(headers, keys) {
  const wanted = keys.map(normalizeHeader_)
  const out = []
  for (let i = 0; i < headers.length; i++) {
    if (wanted.indexOf(normalizeHeader_(headers[i])) !== -1) out.push(i)
  }
  return out
}

function pickValue_(row, indexes) {
  for (let i = 0; i < indexes.length; i++) {
    const v = row[indexes[i]]
    if (v !== '' && v !== null && typeof v !== 'undefined') return v
  }
  return ''
}

function cleanFields_(out, withDefaults) {
  if (withDefaults) {
    HEADERS.forEach(function (h) { if (!(h in out)) out[h] = '' })
  }
  if ('id' in out && out.id !== '') {
    const n = Number(out.id)
    if (!isNaN(n)) out.id = n
  }
  if ('solicitanteEmail' in out) {
    out.solicitanteEmail = String(out.solicitanteEmail || '').trim().toLowerCase()
  }
  if ('fecha' in out) out.fecha = toISODate_(out.fecha)
  if ('hora' in out) out.hora = toTime_(out.hora)
  ;['confW', 'confS'].forEach(function (k) { if (k in out) out[k] = toBool_(out[k]) })
  ;['motivo', 'observaciones'].forEach(function (k) { if (k in out) out[k] = out[k] || '' })
  if (withDefaults) {
    out.tipo = out.tipo || ''
    out.titulo = out.titulo || ''
    out.origen = out.origen || ''
    out.destino = out.destino || ''
    out.prioridad = out.prioridad || 'media'
    out.solicitante = out.solicitante || ''
    out.estado = out.estado || 'pendiente'
  }
  return out
}

// Convierte una fila de la hoja (con encabezados arbitrarios) a objeto canónico.
function makeReader_(headers) {
  const cache = {}
  function indexes(keys) {
    const k = keys.join('|')
    if (!cache[k]) cache[k] = findIndexes_(headers, keys)
    return cache[k]
  }
  return function (row) {
    const out = {}
    HEADERS.forEach(function (h) { out[h] = pickValue_(row, indexes([h])) })
    if (!out.solicitanteEmail) {
      out.solicitanteEmail = pickValue_(row, indexes(['emailSolicitante', 'email', 'correo', 'correoElectronico', 'mail']))
    }
    if (!out.titulo) out.titulo = pickValue_(row, indexes(['tituloSolicitud']))
    if (!out.fecha) out.fecha = pickValue_(row, indexes(['dia']))
    if (!out.hora) out.hora = pickValue_(row, indexes(['horaSolicitud']))
    return cleanFields_(out, true)
  }
}

// Convierte un payload/parche a objeto canónico sin inventar campos vacíos en un patch.
function toCanonicalObject_(obj, withDefaults) {
  const source = obj || {}
  const out = {}
  Object.keys(source).forEach(function (key) {
    const canonical = canonicalKey_(key)
    if (canonical && !(canonical in out)) out[canonical] = source[key]
  })
  return cleanFields_(out, withDefaults)
}

function objectToRow_(obj, touchUpdatedAt) {
  const now = new Date().toISOString()
  const o = obj || {}
  return HEADERS.map(function (h) {
    if (h === 'createdAt') return o.createdAt || now
    if (h === 'updatedAt') return touchUpdatedAt ? now : (o.updatedAt || '')
    if (h === 'confW' || h === 'confS') return toBool_(o[h])
    if (h === 'fecha') return toISODate_(o[h])
    if (h === 'hora') return toTime_(o[h])
    if (h === 'solicitanteEmail') return String(o[h] || '').trim().toLowerCase()
    return o[h] == null ? '' : o[h]
  })
}

function hasContent_(o) {
  return ['id', 'tipo', 'titulo', 'origen', 'destino', 'solicitante', 'solicitanteEmail', 'fecha', 'hora']
    .some(function (k) { return String(o[k] == null ? '' : o[k]).trim() !== '' })
}

// Caso conocido: la hoja vieja tenía "estado" en la columna del correo y la
// fecha escrita debajo del encabezado "hora". Se rescata ese dato antes de
// reordenar para no perder solicitudes antiguas.
function looksLikeBrokenRow_(headers, row) {
  return headers.length > 9 &&
    normalizeHeader_(headers[7]) === 'estado' &&
    normalizeHeader_(headers[9]) === 'hora' &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(row[9] == null ? '' : row[9]).trim())
}

function readLegacyBroken_(row) {
  return cleanFields_({
    id: row[0],
    tipo: row[1],
    titulo: row[2],
    origen: row[3],
    destino: row[4],
    prioridad: row[5],
    solicitante: row[6],
    solicitanteEmail: row[7],
    estado: row[8],
    fecha: row[9],
    hora: row[10],
    confW: row[11],
    confS: row[12],
    motivo: row[13],
    observaciones: row[14],
    createdAt: row[15],
    updatedAt: row[16],
  }, true)
}

// Repara la fila de encabezados in place y reordena las filas existentes.
// No elimina columnas adicionales: simplemente deja de usarlas.
function ensureCanonical_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1)
  const lastCol = Math.max(sheet.getLastColumn(), HEADERS.length)
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues()
  const headers = values[0]
  const needsFix = HEADERS.some(function (h, i) {
    return normalizeHeader_(headers[i]) !== normalizeHeader_(h)
  })

  if (!needsFix) {
    if (sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1)
    return false
  }

  const read = makeReader_(headers)
  const rows = values.slice(1).map(function (row) {
    return looksLikeBrokenRow_(headers, row) ? readLegacyBroken_(row) : read(row)
  }).filter(hasContent_)
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows.map(function (o) {
      return objectToRow_(o, false)
    }))
  }
  sheet.setFrozenRows(1)
  SpreadsheetApp.flush()
  return true
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheets().find(function (s) {
    return normalizeHeader_(s.getName()) === normalizeHeader_(SHEET_NAME)
  })
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
  }
  ensureCanonical_(sheet)
  return sheet
}

function getConductoresSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheets().find(function (s) {
    return normalizeHeader_(s.getName()) === normalizeHeader_(CONDUCTORES_SHEET_NAME) ||
      String(s.getSheetId()) === CONDUCTORES_GID
  })
  if (!sheet) {
    sheet = ss.insertSheet(CONDUCTORES_SHEET_NAME)
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
  }
  ensureCanonical_(sheet)
  return sheet
}

function syncConductores_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const src = getSheet_()
  const dst = getConductoresSheet_(ss)
  const lastRow = Math.max(src.getLastRow(), 1)
  const values = src.getRange(1, 1, lastRow, HEADERS.length).getValues()
  const read = makeReader_(values[0])
  const rows = values.slice(1).map(read).filter(hasContent_).filter(function (r) {
    return String(r.titulo || '').trim() !== ''
  })

  // CONDUCTORES es una copia derivada de SOLICITUDES; se regenera completa.
  dst.clearContents()
  const out = [HEADERS].concat(rows.map(function (o) { return objectToRow_(o, false) }))
  dst.getRange(1, 1, out.length, HEADERS.length).setValues(out)
  dst.setFrozenRows(1)
  return rows.length
}

function nextId_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1)
  const values = sheet.getRange(1, 1, lastRow, HEADERS.length).getValues()
  let max = 1000
  for (let i = 1; i < values.length; i++) {
    const n = Number(values[i][0])
    if (!isNaN(n) && n > max && n < 1000000) max = n
  }
  return max + 1
}

function list_() {
  const sheet = getSheet_()
  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) return []
  const values = sheet.getRange(1, 1, lastRow, HEADERS.length).getValues()
  const read = makeReader_(values[0])
  return values.slice(1).map(read)
    .filter(function (r) { return r.id !== '' && r.id !== null && typeof r.id !== 'undefined' })
    .filter(function (r) { return String(r.titulo || '').trim() !== '' })
}

function create_(payload) {
  const sheet = getSheet_()
  const source = payload && payload.item ? payload.item : payload
  const obj = toCanonicalObject_(source, true)
  const rawId = Number(obj.id)
  obj.id = (!isNaN(rawId) && rawId > 0 && rawId < 1000000) ? rawId : nextId_(sheet)
  const now = new Date().toISOString()
  obj.createdAt = obj.createdAt || now
  obj.updatedAt = now
  sheet.appendRow(objectToRow_(obj, false))
  try { syncConductores_() } catch (e) {}
  return obj
}

function update_(payload) {
  const id = payload && payload.id
  const rawPatch = payload && payload.patch ? payload.patch : payload
  const patch = toCanonicalObject_(rawPatch, false)
  const sheet = getSheet_()
  const lastRow = Math.max(sheet.getLastRow(), 1)
  const values = sheet.getRange(1, 1, lastRow, HEADERS.length).getValues()
  const read = makeReader_(values[0])

  for (let i = 1; i < values.length; i++) {
    const current = read(values[i])
    if (String(current.id) === String(id)) {
      const merged = toCanonicalObject_({
        ...current,
        ...patch,
        id: current.id,
        updatedAt: new Date().toISOString(),
      }, true)
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([objectToRow_(merged, true)])
      try { syncConductores_() } catch (e) {}
      return merged
    }
  }
  throw new Error('Solicitud no encontrada: ' + id)
}

function normalizeRole_(value) {
  const v = normalizeHeader_(value)
  if (['wilson', 'conductor', 'driver', 'admin', 'administrador'].indexOf(v) !== -1) return 'wilson'
  if (['solicitante', 'solicitantes', 'requester', 'usuario', 'user', 'cliente'].indexOf(v) !== -1) return 'solicitante'
  return String(value || '').trim().toLowerCase() || 'solicitante'
}

function getUsersSheet_(ss) {
  let sheet = ss.getSheetByName(USERS_SHEET_NAME)
  if (sheet) return sheet
  const sheets = ss.getSheets()
  sheet = sheets.find(function (s) { return normalizeHeader_(s.getName()) === normalizeHeader_(USERS_SHEET_NAME) })
  if (sheet) return sheet
  sheet = sheets.find(function (s) { return String(s.getSheetId()) === LEGACY_USERS_GID })
  if (sheet) return sheet
  sheet = sheets.find(function (s) {
    const lastRow = s.getLastRow()
    const lastCol = s.getLastColumn()
    if (lastRow < 1 || lastCol < 1) return false
    const headers = s.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_)
    return headers.some(function (h) {
      return ['email', 'correo', 'correoelectronico', 'mail'].indexOf(h) !== -1
    })
  })
  return sheet || null
}

function debugUsers_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const sheets = ss.getSheets().map(function (s) {
    const lastCol = s.getLastColumn()
    const headers = lastCol > 0 ? s.getRange(1, 1, 1, lastCol).getValues()[0] : []
    return { name: s.getName(), id: String(s.getSheetId()), rows: s.getLastRow(), headers: headers }
  })
  const sheet = getUsersSheet_(ss)
  return { sheets: sheets, selected: sheet ? sheet.getName() : null }
}

function listUsers_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const sheet = getUsersSheet_(ss)
  if (!sheet) return []
  const values = sheet.getDataRange().getValues()
  if (values.length <= 1) return []
  const headers = values[0].map(normalizeHeader_)
  const emailIdx = headers.findIndex(function (h) {
    return h.indexOf('correo') !== -1 || h.indexOf('email') !== -1 || h.indexOf('mail') !== -1
  })
  const roleIdx = headers.findIndex(function (h) {
    return h.indexOf('rol') !== -1 || h.indexOf('perfil') !== -1 || h.indexOf('tipo') !== -1
  })
  const nameIdx = headers.findIndex(function (h) {
    return h.indexOf('nombre') !== -1 || h === 'usuario' || h === 'name'
  })
  if (emailIdx === -1) return []
  return values.slice(1).map(function (row) {
    const email = String(row[emailIdx] || '').trim().toLowerCase()
    if (!email || email.indexOf('@') === -1) return null
    return {
      email: email,
      role: normalizeRole_(roleIdx !== -1 ? row[roleIdx] : 'solicitante'),
      name: String(nameIdx !== -1 ? row[nameIdx] : '').trim(),
    }
  }).filter(Boolean)
}

function debugSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const sheets = ss.getSheets().map(function (s) {
    const lastCol = s.getLastColumn()
    const headers = lastCol > 0
      ? s.getRange(1, 1, 1, Math.min(lastCol, HEADERS.length)).getValues()[0]
      : []
    return { name: s.getName(), id: String(s.getSheetId()), rows: s.getLastRow(), headers: headers }
  })
  const sheet = getSheet_()
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), HEADERS.length).getValues()
  return { sheets: sheets, headers: values[0], sample: values.slice(1, 6) }
}

// Acción de reparación segura: se puede llamar una vez después de actualizar el script.
function migrate_() {
  const fixedSolicitudes = ensureCanonical_(getSheet_())
  const fixedConductores = ensureCanonical_(getConductoresSheet_())
  const synced = syncConductores_()
  return { fixedSolicitudes: fixedSolicitudes, fixedConductores: fixedConductores, syncedRows: synced, debug: debugSheet_() }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {}
  try { return JSON.parse(e.postData.contents) } catch (err) { return {} }
}

function dispatchAction_(action, body) {
  if (action === 'list') return json_({ ok: true, items: list_() })
  if (action === 'users') return json_({ ok: true, users: listUsers_() })
  if (action === 'debug_users') return json_({ ok: true, debug: debugUsers_() })
  if (action === 'debug_sheet') return json_({ ok: true, debug: debugSheet_() })
  if (action === 'sync_conductores') return json_({ ok: true, synced: syncConductores_() })
  if (action === 'migrate') return json_({ ok: true, result: migrate_() })
  if (action === 'create') return json_({ ok: true, item: create_(body.item || body) })
  if (action === 'update') return json_({ ok: true, item: update_(body) })
  return json_({ ok: false, error: 'Acción no soportada: ' + action })
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list'
    return dispatchAction_(action, {})
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e)
    const action = body.action || (e && e.parameter && e.parameter.action) || 'list'
    return dispatchAction_(action, body)
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}
