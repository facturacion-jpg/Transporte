import { useState } from 'react'
import RequestForm from '../components/requestForm'
import RequestCard from '../components/RequestCard'
import { belongsToUser } from '../utils/owner'

export default function SolicitanteView({ items, onAdd, onUpdate, user }) {
  const [editing, setEditing] = useState(null)
  const mine = [...items]
    .filter((r) => belongsToUser(r, user))
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')) || String(b.hora || '').localeCompare(String(a.hora || '')) || Number(b.id || 0) - Number(a.id || 0))
  const active = mine.filter((r) => !['completo', 'incompleto'].includes(r.estado) || (r.estado === 'completo' && !r.confS))
  const closed = mine.filter((r) => !active.includes(r))

  return (
    <main className="page wrap">
      <RequestForm
        onAdd={onAdd}
        items={items}
        user={user}
        editingItem={editing}
        onSaveEdit={(id, patch) => { onUpdate(id, patch); setEditing(null) }}
        onCancelEdit={() => setEditing(null)}
      />

      <section className="list-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Seguimiento</p>
            <h2>Mis solicitudes</h2>
          </div>
          <span className="count-pill">{mine.length}</span>
        </div>

        {mine.length === 0 ? (
          <div className="empty">Aún no hay solicitudes. Selecciona un tipo de servicio para crear la primera.</div>
        ) : (
          <>
            {active.length > 0 && <div className="cards-list">{active.map((r) => <RequestCard key={r.id} request={r} role="solicitante" onUpdate={onUpdate} onEdit={setEditing} />)}</div>}
            {closed.length > 0 && (
              <>
                <h3 className="sec">Historial</h3>
                <div className="cards-list">{closed.map((r) => <RequestCard key={r.id} request={r} role="solicitante" onUpdate={onUpdate} onEdit={setEditing} />)}</div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
