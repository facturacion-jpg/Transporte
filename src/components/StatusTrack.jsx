const STEPS = ['Recibida', 'En ruta', 'Entregada', 'Confirmada']

function getStep(request) {
  if (request.confW && request.confS) return 3
  if (request.estado === 'completo') return 2
  if (request.estado === 'en_proceso') return 1
  return 0
}

export default function StatusTrack({ request }) {
  const current = getStep(request)
  const isBlocked = request.estado === 'incompleto' || request.estado === 'pospuesto'
  const statusLabel = request.estado === 'incompleto'
    ? 'Servicio con novedad'
    : request.estado === 'pospuesto'
      ? 'Servicio reprogramado'
      : `Etapa actual: ${STEPS[current]}`

  return (
    <div className={`track-wrap ${isBlocked ? 'is-blocked' : ''}`}>
      <div className="track-head">
        <span className="track-title">Seguimiento del pedido</span>
        <span className={`track-state ${request.estado}`}>{statusLabel}</span>
      </div>
      <div className="track" aria-label={`Etapa: ${STEPS[current]}`}>
        {STEPS.map((step, i) => (
          <div key={step} className={i <= current && !isBlocked ? 'on' : ''}>{step}</div>
        ))}
      </div>
    </div>
  )
}
