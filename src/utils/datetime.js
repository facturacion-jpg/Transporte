// Utilidades únicas de fecha/hora para todo el aplicativo.
// Evita que cada vista convierta los valores de Google Sheets de forma distinta.

export function pad(n) {
  return String(n).padStart(2, '0')
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toISODate(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  // Serial de Google Sheets / Excel (número de días desde 1899-12-30)
  if (typeof value === 'number' && value > 20000 && value < 60000) {
    const dc = new Date(Math.round((Math.floor(value) - 25569) * 86400000))
    if (!isNaN(dc.getTime())) {
      return `${dc.getUTCFullYear()}-${pad(dc.getUTCMonth() + 1)}-${pad(dc.getUTCDate())}`
    }
  }
  const s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T/)
  if (m) return m[1]
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  // Google Sheets suele entregar día/mes/año; si el primer bloque ya es 4 dígitos, va primero.
  if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`
  const d = new Date(s)
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return s
}

export function toTime(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`
  }
  if (typeof value === 'number') {
    const frac = value % 1
    const total = Math.round((frac >= 0 ? frac : frac + 1) * 24 * 60) % (24 * 60)
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
  }
  const s = String(value).trim()
  const hm = s.match(/^(\d{1,2}):(\d{2})/)
  if (hm) return `${pad(hm[1])}:${hm[2]}`
  const iso = s.match(/T(\d{2}):(\d{2})/)
  if (iso) return `${iso[1]}:${iso[2]}`
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    const frac = n % 1
    const total = Math.round((frac >= 0 ? frac : frac + 1) * 24 * 60) % (24 * 60)
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
  }
  return s
}

export function isValidISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

export function formatSchedule(fecha, hora) {
  const f = toISODate(fecha)
  const h = toTime(hora)
  if (!isValidISODate(f)) return h || f || ''
  const [y, m, d] = f.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  if (isNaN(dt.getTime())) return h || f || ''
  const date = dt.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
  return h ? `${date} · ${h}` : date
}
