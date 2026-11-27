import { useEffect, useRef, useState } from 'react'
import TaxiLogo from './taxilogo'

function IconUser() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> }
function IconMail() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg> }
function IconSun() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/></svg> }
function IconMoon() { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15a.6.6 0 0 0-.7-.8z"/></svg> }
function IconSystem() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H3"/></svg> }
function IconChevron() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg> }

export default function Header({ isDark, preference = 'system', onSetPreference, user, onLogout }) {
  const [open, setOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const menuRef = useRef(null)
  const roleLabel = user?.role === 'wilson' ? 'Wilson · Conductor' : 'Solicitante'
  const initials = (user?.name || user?.email || 'U').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  const ThemeIcon = preference === 'system' ? IconSystem : preference === 'dark' ? IconMoon : IconSun

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) { setOpen(false); setAppearanceOpen(false) } }
    const onEsc = (e) => { if (e.key === 'Escape') { setOpen(false); setAppearanceOpen(false) } }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const options = [
    { value: 'light', label: 'Claro', icon: <IconSun /> },
    { value: 'dark', label: 'Oscuro', icon: <IconMoon /> },
    { value: 'system', label: 'Sistema', icon: <IconSystem /> },
  ]

  return (
    <header className="app-header wrap-header">
      <div className="brand">
        <TaxiLogo />
        <div className="brand-text">
          <span className="brand-name">Ruta</span>
          <span className="brand-sub">Transporte empresarial</span>
        </div>
      </div>
      <div className="header-right">
        {user && (
          <div className="profile-menu" ref={menuRef}>
            <button type="button" className="profile-trigger avatar-only" onClick={() => { setOpen((v) => !v); setAppearanceOpen(false) }} aria-haspopup="menu" aria-expanded={open} aria-label="Abrir menú de usuario">
              <span className="avatar">{initials || 'U'}</span>
            </button>

            {open && (
              <div className="profile-dropdown" role="menu">
                <div className="menu-section">
                  <div className="menu-row"><span className="menu-icon"><IconUser /></span><div><span className="menu-label">Nombre</span><span className="menu-value">{user.name || roleLabel}</span></div></div>
                  <div className="menu-row" style={{ marginTop: 10 }}><span className="menu-icon"><IconMail /></span><div><span className="menu-label">Correo</span><span className="menu-value">{user.email}</span></div></div>
                </div>

                <div className="menu-section">
                  <button type="button" className="menu-item appearance-toggle" onClick={() => setAppearanceOpen((v) => !v)} aria-expanded={appearanceOpen}>
                    <span className="menu-icon"><ThemeIcon /></span>
                    <span className="menu-action-body"><span className="menu-value">Apariencia</span></span>
                    <span className={`chevron ${appearanceOpen ? 'open' : ''}`} aria-hidden="true"><IconChevron /></span>
                  </button>
                  {appearanceOpen && (
                    <div className="appearance-submenu">
                      {options.map((opt) => (
                        <button key={opt.value} type="button" className={`appearance-option ${preference === opt.value ? 'active' : ''}`} onClick={() => { onSetPreference?.(opt.value); }}>
                          <span className="opt-icon">{opt.icon}</span>
                          <span>{opt.label}</span>
                          {preference === opt.value && <span className="opt-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="menu-section">
                  <button type="button" className="menu-item danger" role="menuitem" onClick={() => { setOpen(false); setAppearanceOpen(false); onLogout() }}>
                    <span className="menu-icon"><IconLogout /></span>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
