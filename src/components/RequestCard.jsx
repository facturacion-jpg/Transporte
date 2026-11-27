import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { ESTADOS, MOTIVOS_INCOMPLETO } from '../utils/constants'
import { toISODate, toTime, formatSchedule } from '../utils/datetime'
import StatusTrack from './StatusTrack'

function Route({ request }) {
  return (
    <div className="route">
      <i aria-hidden="true" />
      <span>{request.origen}</span>
      <span aria-hidden="true" />
      <div className="line" aria-hidden="true" />
      <i className="d" aria-hidden="true" />
      <span>{request.destino}</span>
    </div>
  )
}

function IconEdit() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

function IconEye() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.8"/></svg>
}

function IconMapPin() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
}

function IconExternal() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
}

function launchConfetti() {
  const end = Date.now() + 1400
  const colors = ['#ffd000', '#151922', '#4cc38a', '#ffffff']
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 90, spread: 90, origin: { y: 0.7 }, colors })
}

export default function RequestCard({ request, role, onUpdate, onEdit }) {
  const [showMotivos, setShowMotivos] = useState(false)
  const [otroMotivo, setOtroMotivo] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [showObserve, setShowObserve] = useState(false)
  const [alert, setAlert] = useState(null)
  const prevEstadoRef = useRef(request.estado)
  const prevConfSRef = useRef(request.confS)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      prevEstadoRef.current = request.estado
      prevConfSRef.current = request.confS
      return
    }
    const prevEstado = prevEstadoRef.current
    const prevConfS = prevConfSRef.current
    if (role === 'solicitante') {
      if (!prevConfS && request.confS && request.confW) {
        launchConfetti()
        setAlert({ type: 'success', text: '¡Servicio confirmado! Todo quedó cerrado correctamente.' })
      }
      if (prevEstado !== 'incompleto' && request.estado === 'incompleto') {
        setAlert({ type: 'error', text: `El servicio no se pudo completar: ${request.motivo || 'motivo no indicado'}.` })
      }
      if (prevEstado !== 'pospuesto' && request.estado === 'pospuesto') {
        setAlert({ type: 'warn', text: 'La solicitud fue reprogramada. Revisa la nueva fecha y hora.' })
      }
    }
    prevEstadoRef.current = request.estado
    prevConfSRef.current = request.confS
  }, [request.estado, request.confS, request.confW, request.motivo, role])

  useEffect(() => {
    if (!alert) return undefined
    const t = setTimeout(() => setAlert(null), 4500)
    return () => clearTimeout(t)
  }, [alert])

  useEffect(() => {
    if (!showObserve) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setShowObserve(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [showObserve])

  const isFinished = request.estado === 'completo' || request.estado === 'incompleto'
  const prioLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' }[request.prioridad] || request.prioridad
  const fecha = toISODate(request.fecha)
  const hora = toTime(request.hora)
  const schedule = formatSchedule(fecha, hora)
  const canEdit = role === 'solicitante' && typeof onEdit === 'function' && !(request.confW && request.confS)
  const mapQuery = encodeURIComponent([request.origen, request.destino].filter(Boolean).join(' a '))
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  const handleConfirmReception = () => {
    onUpdate(request.id, { confS: true })
    launchConfetti()
    setAlert({ type: 'success', text: '¡Recepción confirmada! Gracias por cerrar el servicio.' })
  }

  return (
    <article className={`card ticket ${request.prioridad}`}>
      <div className="bar" aria-hidden="true" />
      <div className="body">
        {alert && (
          <div className={`inline-alert ${alert.type}`} role="status" aria-live="polite">
            <span className="inline-alert-dot" aria-hidden="true" />
            <span>{alert.text}</span>
          </div>
        )}
        <div className="top">
          <div className="top-main">
            <div className="title-row">
              <h3>{request.titulo}</h3>
              {canEdit && (
                <button type="button" className="icon-btn edit-btn" onClick={() => onEdit(request)} aria-label="Editar solicitud" title="Editar solicitud">
                  <IconEdit />
                </button>
              )}
            </div>
            <p className="meta">
              <span className="meta-chip">{request.tipo}</span>
              <span className="meta-chip">Prioridad {prioLabel}</span>
              {role === 'wilson' && <span className="meta-chip">{request.solicitante}</span>}
              {role === 'wilson' ? (
                <>
                  <span className="meta-chip schedule">Fecha: {fecha || 'Sin fecha'}</span>
                  <span className="meta-chip schedule">Hora: {hora || 'Sin hora'}</span>
                </>
              ) : schedule ? (
                <span className="meta-chip schedule">{schedule}</span>
              ) : null}
            </p>
          </div>
          <div className="top-actions">
            {role === 'wilson' && (
              <button type="button" className={`observe-icon-btn ${showObserve ? 'active' : ''}`} onClick={() => setShowObserve(true)} aria-label="Observar pedido" title="Observar pedido">
                <IconEye />
              </button>
            )}
            <span className={`badge b-${request.estado}`}>{ESTADOS[request.estado]}</span>
          </div>
        </div>

        <Route request={request} />
        {role === 'solicitante' && <StatusTrack request={request} />}

        {request.estado === 'pospuesto' && <div className="note w">Wilson reprogramó esta solicitud. Verifica la nueva fecha/hora asignada.</div>}
        {request.estado === 'incompleto' && (
          <div className="note b">
            No se pudo completar: {request.motivo}.
            {request.observaciones ? <div className="note-detail"><strong>Observaciones:</strong> {request.observaciones}</div> : null}
          </div>
        )}

        {role === 'solicitante' && request.estado === 'completo' && !request.confS && (
          <div className="note g">Wilson marcó el servicio como completo. Confirma la recepción para cerrar la solicitud.</div>
        )}
        {request.confW && request.confS && <div className="note g">Solicitud cerrada: confirmada por Wilson y por el solicitante.</div>}

        {role === 'wilson' && request.estado === 'completo' && (
          <div className={`note ${request.confS ? 'g' : 'w'}`}>
            {request.confS ? 'Solicitud cerrada: ambas partes confirmaron.' : `Pendiente de confirmación por ${request.solicitante}.`}
          </div>
        )}

        {role === 'solicitante' && (
          <div className="actions">
            {request.estado === 'completo' && !request.confS && (
              <button className="btn ok" type="button" onClick={handleConfirmReception}>
                Confirmar recepción
              </button>
            )}
            {request.estado === 'incompleto' && (
              <button className="btn ghost" type="button" onClick={() => onUpdate(request.id, { estado: 'pendiente', motivo: '', observaciones: '' })}>
                Volver a solicitar
              </button>
            )}
          </div>
        )}

        {role === 'wilson' && !isFinished && (
          <>
            <div className="actions">
              {request.estado !== 'en_proceso' && (
                <button className="btn" type="button" onClick={() => onUpdate(request.id, { estado: 'en_proceso' })}>
                  Iniciar servicio
                </button>
              )}
              {request.estado === 'en_proceso' && (
                <button className="btn ok" type="button" onClick={() => onUpdate(request.id, { estado: 'completo', confW: true })}>
                  Marcar como completo
                </button>
              )}
              <button className="btn ghost" type="button" onClick={() => onUpdate(request.id, { estado: 'pospuesto' })}>
                Reprogramar
              </button>
              <button className="btn ghost" type="button" onClick={() => { setShowMotivos((v) => !v); setOtroMotivo(false); setObservacion('') }}>
                No se pudo completar
              </button>
            </div>
            {showMotivos && (
              <div className="motivo-panel">
                <div className="actions">
                  {MOTIVOS_INCOMPLETO.map((motivo) => (
                    <button key={motivo} className={`chip ${motivo === 'Otro motivo' && otroMotivo ? 'active' : ''}`} type="button" onClick={() => {
                      if (motivo === 'Otro motivo') { setOtroMotivo(true); return }
                      onUpdate(request.id, { estado: 'incompleto', motivo, observaciones: '' }); setShowMotivos(false); setOtroMotivo(false); setObservacion('')
                    }}>
                      {motivo}
                    </button>
                  ))}
                </div>
                {otroMotivo && (
                  <div className="otro-motivo-box">
                    <label className="otro-motivo-label" htmlFor={`obs-${request.id}`}>Observaciones</label>
                    <textarea id={`obs-${request.id}`} className="otro-motivo-input" rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Describe qué pasó..." />
                    <div className="actions">
                      <button type="button" className="btn ghost sm" onClick={() => { setOtroMotivo(false); setObservacion('') }}>Cancelar</button>
                      <button type="button" className="btn sm" disabled={!observacion.trim()} onClick={() => { onUpdate(request.id, { estado: 'incompleto', motivo: 'Otro motivo', observaciones: observacion.trim() }); setShowMotivos(false); setOtroMotivo(false); setObservacion('') }}>Guardar</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {showObserve && createPortal(
          <div className="observe-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowObserve(false)} role="presentation">
            <div className="observe-panel" role="dialog" aria-modal="true" aria-label="Observar pedido">
              <div className="observe-head">
                <div className="observe-head-main">
                  <div className="observe-head-icon"><IconEye /></div>
                  <div className="observe-head-text">
                    <p className="eyebrow">Detalle del pedido</p>
                    <h3>{request.titulo}</h3>
                    <div className="observe-chips">
                      <span className="meta-chip">{request.tipo}</span>
                      {schedule && <span className="meta-chip schedule">{schedule}</span>}
                      <span className={`badge b-${request.estado}`}>{ESTADOS[request.estado]}</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="modal-close observe-close" onClick={() => setShowObserve(false)} aria-label="Cerrar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
                </button>
              </div>

              <div className="observe-body">
                <div className="observe-layout">
                  <div className="observe-side">
                    <div className="observe-section">
                      <p className="observe-section-title"><IconMapPin /> Ruta</p>
                      <div className="observe-route">
                        <div className="observe-route-point">
                          <span className="observe-route-dot origin" />
                          <div><span className="observe-label">Origen</span><p className="observe-value">{request.origen || '—'}</p></div>
                        </div>
                        <div className="observe-route-line" aria-hidden="true" />
                        <div className="observe-route-point">
                          <span className="observe-route-dot dest" />
                          <div><span className="observe-label">Destino</span><p className="observe-value">{request.destino || '—'}</p></div>
                        </div>
                      </div>
                    </div>
                    <div className="observe-section">
                      <p className="observe-section-title">Detalles</p>
                      <div className="observe-details">
                        <div className="observe-detail"><span className="observe-label">Solicitante</span><span className="observe-value">{request.solicitante || '—'}</span></div>
                        <div className="observe-detail"><span className="observe-label">Correo</span><span className="observe-value">{request.solicitanteEmail || '—'}</span></div>
                        <div className="observe-detail"><span className="observe-label">Fecha</span><span className="observe-value">{fecha || request.fecha || '—'}</span></div>
                        <div className="observe-detail"><span className="observe-label">Hora</span><span className="observe-value">{hora || request.hora || '—'}</span></div>
                        <div className="observe-detail"><span className="observe-label">Prioridad</span><span className="observe-value">{prioLabel}</span></div>
                        <div className="observe-detail"><span className="observe-label">Estado</span><span className="observe-value">{ESTADOS[request.estado] || request.estado}</span></div>
                      </div>
                    </div>
                    {(request.motivo || request.observaciones) && (
                      <div className="observe-section observe-note-section">
                        <p className="observe-section-title">Novedades</p>
                        {request.motivo && <p className="observe-value"><strong>Motivo:</strong> {request.motivo}</p>}
                        {request.observaciones && <p className="observe-value"><strong>Observaciones:</strong> {request.observaciones}</p>}
                      </div>
                    )}
                  </div>

                  <div className="observe-map-wrap">
                    <div className="observe-map-head">
                      <p className="observe-section-title"><IconMapPin /> Mapa</p>
                      <a className="observe-map-link" href={mapLink} target="_blank" rel="noreferrer"><IconExternal /> Abrir</a>
                    </div>
                    <div className="observe-map-frame">
                      <iframe title="Mapa del pedido" src={mapSrc} className="observe-map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </article>
  )
}
