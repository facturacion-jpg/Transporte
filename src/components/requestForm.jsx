import { useEffect, useMemo, useRef, useState } from 'react'
import { TIPOS_CONFIG, HORAS } from '../utils/constants'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const emptyForm = (user) => ({
  titulo: '',
  origen: '',
  destino: '',
  prioridad: 'media',
  solicitante: String(user?.name || '').trim(),
  fecha: todayISO(),
  hora: '',
})

const ICONS = {
  Recoger: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 8V21H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>,
  Llevar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h13v10H3z"/><path d="M16 10h4l1 3v4h-5z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  Entregar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7l-8 8-4-4"/><circle cx="12" cy="12" r="10"/></svg>,
  'Cita de producción': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
}

function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6l-12 12" /></svg> }
function ChevronIcon({ open }) { return <svg className={`type-chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg> }
function ClockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> }

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '30']

function AlarmTimePicker({ value, onChange, takenHours }) {
  const [h, m] = (value || '08:00').split(':')
  const hour = HOURS.includes(h) ? h : '08'
  const minute = MINUTES.includes(m) ? m : '00'
  const hourRef = useRef(null)
  const minRef = useRef(null)
  const itemH = 44

  useEffect(() => {
    const hi = HOURS.indexOf(hour)
    const mi = MINUTES.indexOf(minute)
    if (hourRef.current && hi >= 0) hourRef.current.scrollTo({ top: hi * itemH, behavior: 'auto' })
    if (minRef.current && mi >= 0) minRef.current.scrollTo({ top: mi * itemH, behavior: 'auto' })
  }, [])

  const scrollTo = (ref, idx) => ref.current?.scrollTo({ top: idx * itemH, behavior: 'smooth' })
  const pickHour = (nextH) => { onChange(`${nextH}:${minute}`); scrollTo(hourRef, HOURS.indexOf(nextH)) }
  const pickMinute = (nextM) => { onChange(`${hour}:${nextM}`); scrollTo(minRef, MINUTES.indexOf(nextM)) }
  const onWheelScroll = (ref, values, current, setter) => {
    clearTimeout(ref.current._t)
    ref.current._t = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / itemH)
      const clamped = Math.max(0, Math.min(values.length - 1, idx))
      const next = values[clamped]
      if (next !== current) setter(next)
      ref.current.scrollTo({ top: clamped * itemH, behavior: 'smooth' })
    }, 80)
  }

  const currentVal = `${hour}:${minute}`
  const isTaken = takenHours.has(currentVal)

  return (
    <div className={`alarm-picker ${isTaken ? 'is-taken' : ''}`}>
      <div className="alarm-display">
        <span className={`alarm-digit ${isTaken ? 'taken' : ''}`}>{hour}</span>
        <span className="alarm-sep">:</span>
        <span className={`alarm-digit ${isTaken ? 'taken' : ''}`}>{minute}</span>
      </div>
      <div className="alarm-wheels">
        <div className="alarm-col">
          <span className="alarm-col-label">Hora</span>
          <div className="wheel-window">
            <div className="wheel-highlight" aria-hidden="true" />
            <div className="wheel" ref={hourRef} onScroll={() => onWheelScroll(hourRef, HOURS, hour, pickHour)}>
              <div className="wheel-pad" />
              {HOURS.map((hh) => {
                const val = `${hh}:${minute}`
                const taken = takenHours.has(val)
                return (
                  <button key={hh} type="button" className={`wheel-item ${hh === hour ? 'active' : ''} ${taken ? 'taken' : ''}`} onClick={() => pickHour(hh)}>
                    {hh}{taken && <small>•</small>}
                  </button>
                )
              })}
              <div className="wheel-pad" />
            </div>
          </div>
        </div>
        <div className="alarm-col">
          <span className="alarm-col-label">Min</span>
          <div className="wheel-window">
            <div className="wheel-highlight" aria-hidden="true" />
            <div className="wheel" ref={minRef} onScroll={() => onWheelScroll(minRef, MINUTES, minute, pickMinute)}>
              <div className="wheel-pad" />
              {MINUTES.map((mm) => {
                const val = `${hour}:${mm}`
                const taken = takenHours.has(val)
                return (
                  <button key={mm} type="button" className={`wheel-item ${mm === minute ? 'active' : ''} ${taken ? 'taken' : ''}`} onClick={() => pickMinute(mm)}>
                    {mm}{taken && <small>•</small>}
                  </button>
                )
              })}
              <div className="wheel-pad" />
            </div>
          </div>
        </div>
      </div>
      <p className={`field-hint ${isTaken ? 'error' : value ? 'ok' : ''}`}>
        {isTaken ? 'Esta hora ya está ocupada para la fecha seleccionada.' : value ? `Hora seleccionada: ${value}` : 'Desliza o toca para elegir la hora.'}
      </p>
    </div>
  )
}

export default function RequestForm({ onAdd, items = [], editingItem = null, onSaveEdit, onCancelEdit, user }) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState(null)
  const [form, setForm] = useState(() => emptyForm(user))
  const [sent, setSent] = useState(false)
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [pendingTipo, setPendingTipo] = useState(null)
  const [timeOpen, setTimeOpen] = useState(false)
  const [timePos, setTimePos] = useState({ top: 0, left: 0, width: 300 })
  const timeRef = useRef(null)
  const timeTriggerRef = useRef(null)
  const timePopoverRef = useRef(null)

  const isEdit = Boolean(editingItem)
  const cfg = tipo ? TIPOS_CONFIG[tipo] : null
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (editingItem) {
      setTipo(editingItem.tipo)
      setForm({ titulo: editingItem.titulo || '', origen: editingItem.origen || '', destino: editingItem.destino || '', prioridad: editingItem.prioridad || 'media', solicitante: editingItem.solicitante || '', fecha: editingItem.fecha || todayISO(), hora: editingItem.hora || '' })
      setOpen(true); setTypeMenuOpen(false); setPendingTipo(null); setTimeOpen(false)
    }
  }, [editingItem])

  const takenHours = useMemo(() => {
    if (!form.fecha) return new Set()
    return new Set(items.filter((r) => r.fecha === form.fecha && r.hora && r.estado !== 'incompleto' && r.id !== editingItem?.id).map((r) => r.hora))
  }, [items, form.fecha, editingItem?.id])

  const hasData = Boolean(form.titulo.trim() || form.origen.trim() || form.destino.trim() || form.solicitante.trim() || form.hora)
  const horaTaken = form.hora ? takenHours.has(form.hora) : false
  const valid = form.titulo.trim() && form.origen.trim() && form.destino.trim() && form.solicitante.trim() && form.fecha && form.hora && !horaTaken

  const closeModal = () => { setOpen(false); setTipo(null); setForm(emptyForm(user)); setTypeMenuOpen(false); setPendingTipo(null); setTimeOpen(false); if (isEdit) onCancelEdit?.() }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (pendingTipo) setPendingTipo(null)
        else if (timeOpen) setTimeOpen(false)
        else if (typeMenuOpen) setTypeMenuOpen(false)
        else closeModal()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, pendingTipo, typeMenuOpen, timeOpen])

  useEffect(() => {
    if (!timeOpen) return undefined
    const onDoc = (e) => {
      if (timeRef.current?.contains(e.target) || timePopoverRef.current?.contains(e.target)) return
      setTimeOpen(false)
    }
    const onScroll = () => {
      const r = timeTriggerRef.current?.getBoundingClientRect()
      if (!r) return
      const w = Math.min(300, window.innerWidth - 16)
      const spaceRight = window.innerWidth - r.right - 12
      const spaceLeft = r.left - 12
      const side = spaceRight >= w ? 'right' : spaceLeft >= w ? 'left' : 'over'
      let left = side === 'right' ? r.right + 10 : side === 'left' ? r.left - w - 10 : Math.max(8, r.left)
      let top = r.top - 20
      const estH = 360
      if (top + estH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - estH - 8)
      if (top < 8) top = 8
      setTimePos({ top, left, width: w })
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll) }
  }, [timeOpen])

  const openTime = () => {
    const r = timeTriggerRef.current?.getBoundingClientRect()
    if (r) {
      const w = Math.min(300, window.innerWidth - 16)
      const spaceRight = window.innerWidth - r.right - 12
      const spaceLeft = r.left - 12
      const side = spaceRight >= w ? 'right' : spaceLeft >= w ? 'left' : 'over'
      let left = side === 'right' ? r.right + 10 : side === 'left' ? r.left - w - 10 : Math.max(8, r.left)
      let top = r.top - 20
      const estH = 360
      if (top + estH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - estH - 8)
      if (top < 8) top = 8
      setTimePos({ top, left, width: w })
    }
    setTimeOpen((v) => !v)
  }

  const selectTipo = (nextTipo) => {
    if (nextTipo === tipo) { setTypeMenuOpen(false); return }
    if (tipo && hasData) { setPendingTipo(nextTipo); setTypeMenuOpen(false); return }
    setTipo(nextTipo); setTypeMenuOpen(false)
  }

  const confirmTypeChange = (keep) => {
    if (!pendingTipo) return
    setTipo(pendingTipo)
    if (!keep) setForm((f) => ({ ...emptyForm(user), fecha: f.fecha }))
    setPendingTipo(null)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!valid || !tipo) return
    const payload = { ...form, tipo, titulo: form.titulo.trim(), origen: form.origen.trim(), destino: form.destino.trim(), solicitante: form.solicitante.trim(), solicitanteEmail: String(user?.email || '').trim().toLowerCase() }
    if (isEdit) { onSaveEdit?.(editingItem.id, payload); closeModal(); return }
    onAdd({ ...payload, id: Date.now(), estado: 'pendiente', confW: false, confS: false, motivo: '', observaciones: '' })
    setForm(emptyForm(user)); setTipo(null); setOpen(false); setSent(true); setTimeout(() => setSent(false), 3500)
  }

  return (
    <div className="request-form-wrap">
      <div className="section-head">
        <div>
          <p className="eyebrow">Nueva solicitud</p>
          <h2>¿Qué servicio necesitas?</h2>
          <p className="sub">Crea una solicitud de transporte y envíala directamente al panel de Wilson.</p>
        </div>
        <button type="button" className="btn create-request-btn" onClick={() => { setOpen(true); setSent(false) }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Crear nueva solicitud
        </button>
      </div>

      {sent && <div className="toast-ok" role="status">Solicitud enviada correctamente. Wilson la recibirá en su panel.</div>}

      {open && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !pendingTipo && closeModal()} role="presentation">
          <div className="modal-panel request-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-head">
              <div className="modal-head-left">
                <span className="modal-icon">{tipo ? ICONS[tipo] : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>}</span>
                <div className="modal-title-wrap">
                  <p className="eyebrow">{isEdit ? 'Editar solicitud' : 'Nueva solicitud'}</p>
                  {tipo ? (
                    <div className="type-title-select">
                      <button type="button" className="type-title-btn" onClick={() => setTypeMenuOpen((v) => !v)} aria-expanded={typeMenuOpen} aria-haspopup="listbox">
                        <span id="modal-title">{cfg.label}</span>
                        <ChevronIcon open={typeMenuOpen} />
                      </button>
                      {typeMenuOpen && (
                        <div className="type-menu" role="listbox" aria-label="Tipo de solicitud">
                          {Object.values(TIPOS_CONFIG).map((t) => (
                            <button key={t.key} type="button" role="option" aria-selected={tipo === t.key} className={`type-menu-item ${tipo === t.key ? 'active' : ''}`} onClick={() => selectTipo(t.key)}>
                              <span className="type-menu-icon">{ICONS[t.key]}</span>
                              <span className="type-menu-text"><span className="type-menu-label">{t.label}</span><span className="type-menu-desc">{t.desc}</span></span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : <h3 id="modal-title">Selecciona el tipo de servicio</h3>}
                  <p className="modal-desc">{cfg ? cfg.desc : 'Elige una opción para continuar con la solicitud.'}</p>
                </div>
              </div>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Cerrar"><CloseIcon /></button>
            </div>

            {!tipo ? (
              <div className="modal-form">
                <div className="type-picker-grid">
                  {Object.values(TIPOS_CONFIG).map((t) => (
                    <button key={t.key} type="button" className="type-picker-card" onClick={() => selectTipo(t.key)}>
                      <span className="type-icon">{ICONS[t.key]}</span>
                      <span className="type-label">{t.label}</span>
                      <span className="type-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form className="modal-form" onSubmit={submit}>
                <label htmlFor="titulo">{cfg.tituloLabel}</label>
                <input id="titulo" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder={cfg.tituloPlaceholder} autoFocus />

                <div className="row2">
                  <div><label htmlFor="origen">{cfg.origenLabel}</label><input id="origen" value={form.origen} onChange={(e) => set('origen', e.target.value)} placeholder={cfg.origenPlaceholder} /></div>
                  <div><label htmlFor="destino">{cfg.destinoLabel}</label><input id="destino" value={form.destino} onChange={(e) => set('destino', e.target.value)} placeholder={cfg.destinoPlaceholder} /></div>
                </div>

                <div className="row2">
                  <div><label htmlFor="solicitante">Solicitante / Área</label><input id="solicitante" value={form.solicitante} onChange={(e) => set('solicitante', e.target.value)} placeholder="Tu nombre o área" /></div>
                  <div><label htmlFor="prioridad">Prioridad</label>
                    <select id="prioridad" value={form.prioridad} onChange={(e) => set('prioridad', e.target.value)}>
                      <option value="alta">Alta · Urgente</option><option value="media">Media</option><option value="baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="row2">
                  <div><label htmlFor="fecha">Fecha</label><input id="fecha" type="date" min={todayISO()} value={form.fecha} onChange={(e) => { set('fecha', e.target.value); set('hora', ''); }} /></div>
                  <div className="time-dropdown" ref={timeRef}>
                    <label>Hora</label>
                    <button type="button" ref={timeTriggerRef} className={`time-trigger ${timeOpen ? 'open' : ''} ${horaTaken ? 'error' : ''}`} onClick={openTime} aria-expanded={timeOpen}>
                      <span className="time-trigger-icon"><ClockIcon /></span>
                      <span className={`time-trigger-value ${!form.hora ? 'placeholder' : ''}`}>{form.hora || 'Seleccionar hora'}</span>
                      <span className={`chevron ${timeOpen ? 'open' : ''}`}><ChevronIcon open={timeOpen} /></span>
                    </button>
                    {horaTaken && <p className="field-hint error">Esta hora ya está ocupada para la fecha seleccionada.</p>}
                    {!horaTaken && form.hora && <p className="field-hint ok">Hora seleccionada: {form.hora}</p>}
                    {timeOpen && (
                      <div className="time-popover" ref={timePopoverRef} style={{ top: timePos.top, left: timePos.left, width: timePos.width }}>
                        <AlarmTimePicker value={form.hora} onChange={(v) => set('hora', v)} takenHours={takenHours} />
                        <div className="time-popover-actions">
                          <button type="button" className="btn ghost sm" onClick={() => setTimeOpen(false)}>Listo</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn ghost" type="button" onClick={closeModal}>Cancelar</button>
                  <button className="btn" type="submit" disabled={!valid}>{isEdit ? 'Guardar cambios' : 'Enviar solicitud'}</button>
                </div>
              </form>
            )}

            {pendingTipo && (
              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Cambiar tipo de solicitud">
                <div className="confirm-card">
                  <h4>Cambiar tipo de solicitud</h4>
                  <p>Ya tienes datos ingresados. ¿Deseas mantener los datos actuales o limpiar los campos?</p>
                  <div className="confirm-actions">
                    <button type="button" className="btn ghost" onClick={() => setPendingTipo(null)}>Cancelar</button>
                    <button type="button" className="btn ghost" onClick={() => confirmTypeChange(false)}>Limpiar campos</button>
                    <button type="button" className="btn" onClick={() => confirmTypeChange(true)}>Mantener datos</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
