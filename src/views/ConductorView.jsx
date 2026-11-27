import RequestCard from '../components/RequestCard'
import { PRIORIDADES } from '../utils/constants'
import { toISODate, toTime, todayISO } from '../utils/datetime'

function bySchedule(a, b) {
  return (PRIORIDADES[a.prioridad]?.order ?? 9) - (PRIORIDADES[b.prioridad]?.order ?? 9)
    || toISODate(a.fecha).localeCompare(toISODate(b.fecha))
    || toTime(a.hora).localeCompare(toTime(b.hora))
    || Number(a.id) - Number(b.id)
}

export default function ConductorView({ items, onUpdate }) {
  const today = todayISO()
  const active = items
    .filter((r) => r.estado !== 'incompleto')
    .map((r) => ({
      ...r,
      fecha: toISODate(r.fecha) || r.fecha || '',
      hora: toTime(r.hora) || r.hora || '',
    }))
  const hoy = active.filter((r) => r.fecha === today).sort(bySchedule)
  const proximas = active.filter((r) => r.fecha > today).sort(bySchedule)
  const pasadas = active.filter((r) => r.fecha < today || !r.fecha).sort(bySchedule)
  const count = (estado) => hoy.filter((r) => r.estado === estado).length
  const pendientes = hoy.filter((r) => r.estado === 'pendiente' || r.estado === 'en_proceso').length

  return (
    <main className="page wrap">
      <div className="section-head">
        <div>
          <p className="eyebrow">Panel de conductor</p>
          <h2>Despacho del día</h2>
          <p className="sub">Solicitudes asignadas a Wilson, ordenadas por prioridad y hora. Actualiza el estado para que el solicitante vea el avance.</p>
        </div>
        <div className="day-badge">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</div>
      </div>

      <div className="stats" aria-label="Resumen de hoy">
        <div className="stat"><b>{count('pendiente')}</b><span>Pendientes</span></div>
        <div className="stat"><b>{count('en_proceso')}</b><span>En proceso</span></div>
        <div className="stat"><b>{count('completo')}</b><span>Completos</span></div>
        <div className="stat"><b>{hoy.length}</b><span>Total hoy</span></div>
      </div>

      <section className="list-section">
        <div className="section-head">
          <h3 className="sec-title">Hoy</h3>
          <span className="count-pill">{hoy.length}</span>
        </div>
        {hoy.length === 0 ? (
          <div className="empty">No hay solicitudes asignadas para hoy.</div>
        ) : (
          <div className="cards-list">{hoy.map((r) => <RequestCard key={r.id} request={r} role="wilson" onUpdate={onUpdate} />)}</div>
        )}
      </section>

      {proximas.length > 0 && (
        <section className="list-section">
          <div className="section-head">
            <h3 className="sec-title">Próximas</h3>
            <span className="count-pill">{proximas.length}</span>
          </div>
          <div className="cards-list">{proximas.map((r) => <RequestCard key={r.id} request={r} role="wilson" onUpdate={onUpdate} />)}</div>
        </section>
      )}

      {pasadas.length > 0 && (
        <section className="list-section">
          <div className="section-head">
            <h3 className="sec-title">Anteriores</h3>
            <span className="count-pill">{pasadas.length}</span>
          </div>
          <div className="cards-list">{pasadas.map((r) => <RequestCard key={r.id} request={r} role="wilson" onUpdate={onUpdate} />)}</div>
        </section>
      )}
    </main>
  )
}
