import { useState, useRef, useEffect } from 'react'
import { fetchUsers, isRemoteEnabled } from '../api/api'

export const AUTHORIZED_USERS = [
  { email: 'solicitante@empresa.com', role: 'solicitante', name: 'Solicitante' },
  { email: 'wilson@empresa.com', role: 'wilson', name: 'Wilson' },
]

export function findUserByEmail(email, users = AUTHORIZED_USERS) {
  const normalized = String(email || '').trim().toLowerCase()
  return users.find((u) => String(u.email || '').toLowerCase() === normalized) || null
}

function IconSun() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/></svg>
}
function IconMoon() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15a.6.6 0 0 0-.7-.8z"/></svg>
}
function IconSystem() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
}
function IconChevron() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg> }

export default function LoginView({ onLogin, isDark, preference = 'system', onSetPreference }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const appearanceRef = useRef(null)

  useEffect(() => {
    if (!appearanceOpen) return undefined
    const onDoc = (e) => { if (appearanceRef.current && !appearanceRef.current.contains(e.target)) setAppearanceOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [appearanceOpen])

  const options = [
    { value: 'light', label: 'Claro', icon: <IconSun /> },
    { value: 'dark', label: 'Oscuro', icon: <IconMoon /> },
    { value: 'system', label: 'Sistema', icon: <IconSystem /> },
  ]
  const current = options.find((o) => o.value === preference) || options[2]

  const startLoading = (user) => {
    setError('')
    setLoading(true)
    setProgress(0)
    const started = Date.now()
    const duration = 2400
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - started) / duration) * 100))
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(timer)
        setTimeout(() => onLogin(user), 180)
      }
    }, 80)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    const normalized = String(email || '').trim().toLowerCase()
    try {
      let users = AUTHORIZED_USERS
      if (isRemoteEnabled()) {
        try {
          const remoteUsers = await fetchUsers()
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            users = remoteUsers
          } else {
            // Keep fallback when remote has no configured users (e.g. missing Usuarios sheet or old deploy)
            users = AUTHORIZED_USERS
          }
        } catch {
          users = AUTHORIZED_USERS
        }
      }
      const user = findUserByEmail(normalized, users)
      if (!user) {
        setError(isRemoteEnabled()
          ? 'Correo no autorizado. Verifica que esté en la hoja "Usuarios" y que el Apps Script esté actualizado con la nueva versión.'
          : 'Correo no autorizado. Verifica el correo e intenta nuevamente.')
        return
      }
      startLoading(user)
    } catch (err) {
      setError('No se pudo validar el correo. Intenta de nuevo.')
    }
  }

  return (
    <main className="login-shell">
      <div className="login-bg" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="grid-lines" />
      </div>

      <div className="login-wrap">
        <div className="login-brand">
          <div className="login-logo">
            <svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="var(--brand)"/><rect x="14.5" y="6.5" width="5" height="3" rx="1" fill="var(--brand-ink)"/><path d="M10 17l2.8-5.5h8.4L24 17z" fill="var(--brand-ink)"/><rect x="5.5" y="16.5" width="23" height="8.5" rx="3" fill="var(--brand-ink)"/><path d="M13 16.5l1.6-3.2h4.8l1.6 3.2z" fill="var(--brand)"/><circle cx="11" cy="25" r="3" fill="var(--brand-ink)" stroke="var(--brand)" strokeWidth="1.8"/><circle cx="23" cy="25" r="3" fill="var(--brand-ink)" stroke="var(--brand)" strokeWidth="1.8"/></svg>
          </div>
          <p className="eyebrow">Sistema de transporte empresarial</p>
          <h1>Ruta</h1>
          <p className="login-lead">Accede con tu correo autorizado para gestionar solicitudes y despacho.</p>
        </div>

        <section className="login-card" aria-label="Inicio de sesión">
          <div className="login-card-head">
            <div>
              <p className="login-card-kicker">Acceso seguro</p>
              <h2>Ingresar al panel</h2>
            </div>
            <div className="appearance-menu-wrap" ref={appearanceRef}>
              <button type="button" className="appearance-trigger" onClick={() => setAppearanceOpen((v) => !v)} aria-expanded={appearanceOpen} aria-label="Cambiar apariencia">
                <span className="appearance-trigger-icon">{current.icon}</span>
                <span>{current.label}</span>
                <span className={`chevron ${appearanceOpen ? 'open' : ''}`}><IconChevron /></span>
              </button>
              {appearanceOpen && (
                <div className="appearance-popover">
                  {options.map((opt) => (
                    <button key={opt.value} type="button" className={`appearance-option ${preference === opt.value ? 'active' : ''}`} onClick={() => { onSetPreference?.(opt.value); setAppearanceOpen(false) }}>
                      <span className="opt-icon">{opt.icon}</span>
                      <span>{opt.label}</span>
                      {preference === opt.value && <span className="opt-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="login-form">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-shell">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>
              </span>
              <input id="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className={`btn login-submit ${loading ? 'is-loading' : ''}`} type="submit" disabled={loading} aria-live="polite">
              {loading ? (
                <span className="btn-dots" aria-label="Cargando acceso">
                  <span className="bdot" />
                  <span className="bdot" />
                  <span className="bdot" />
                </span>
              ) : 'Acceder'}
            </button>
            <p className="login-hint">El acceso se valida con los correos registrados en la hoja Usuarios.</p>
          </form>
        </section>
      </div>
    </main>
  )
}
