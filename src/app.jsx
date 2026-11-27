import { useEffect, useRef, useState } from 'react'
import Header from './components/header'
import SolicitanteView from './views/SolicitanteView'
import ConductorView from './views/ConductorView'
import LoginView from './components/LoginView'
import {
  loadRequests,
  saveRequests,
  fetchRequests,
  createRequest,
  patchRequest,
  isRemoteEnabled,
  normalizeRequest,
  belongsToUser,
  mergeRemoteItem,
  storageKeyFor,
  requestSignature,
  isPendingRequest,
} from './api/api'
import { useTheme } from './hooks/useTheme'

const USER_KEY = 'ruta-user'

function getInitialUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    if (u && u.email && (u.role === 'solicitante' || u.role === 'wilson')) return u
  } catch {}
  return null
}

function mergeLocalWithRemote(current, user, remoteItems, pendingRef) {
  if (current.key !== storageKeyFor(user)) return current

  // Wilson recibe todas las solicitudes. Cada solicitante únicamente las suyas.
  const visible = remoteItems.filter((r) => belongsToUser(r, user))
  const byId = new Map(visible.map((r) => [String(r.id), r]))
  const bySignature = new Map(visible.map((r) => [requestSignature(r), r]))
  const localOwn = current.items.filter((r) => belongsToUser(r, user))

  const merged = visible.map((remote) => {
    const local = localOwn.find((c) => String(c.id) === String(remote.id))
    return local ? mergeRemoteItem(local, remote) : remote
  })

  for (const local of localOwn) {
    const id = String(local.id)
    if (byId.has(id)) {
      pendingRef.current.delete(id)
      continue
    }
    // Si el envío local se guardó en Sheets pero la respuesta se perdió,
    // el remoto ya es la versión definitiva: no duplicamos la solicitud.
    if (pendingRef.current.has(id) && bySignature.has(requestSignature(local))) {
      pendingRef.current.delete(id)
      continue
    }
    if (pendingRef.current.has(id) || isPendingRequest(local)) merged.push(local)
  }

  return { ...current, items: merged }
}

export default function App() {
  const [user, setUser] = useState(getInitialUser)
  const [store, setStore] = useState(() => {
    const u = getInitialUser()
    return { key: storageKeyFor(u), items: loadRequests(u) }
  })
  const items = store.items
  const [sync, setSync] = useState({ loading: isRemoteEnabled(), error: '' })
  const { isDark, preference, setPreference } = useTheme()
  const remote = isRemoteEnabled()
  const pollRef = useRef(null)
  const pendingRef = useRef(new Set(store.items.filter(isPendingRequest).map((r) => String(r.id))))

  useEffect(() => {
    try {
      user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY)
    } catch {}
  }, [user])

  useEffect(() => {
    const nextItems = loadRequests(user)
    setStore({ key: storageKeyFor(user), items: nextItems })
    pendingRef.current = new Set(nextItems.filter(isPendingRequest).map((r) => String(r.id)))
  }, [user])

  useEffect(() => {
    // Nunca guardamos los datos del usuario anterior en el almacén del nuevo.
    if (store.key !== storageKeyFor(user)) return
    saveRequests(items, user)
  }, [items, store.key, user])

  useEffect(() => {
    if (!remote || !user) return undefined
    let alive = true
    const load = async (silent = false) => {
      if (!silent) setSync((s) => ({ ...s, loading: true, error: '' }))
      try {
        const data = await fetchRequests()
        if (alive) {
          setStore((current) => mergeLocalWithRemote(current, user, data, pendingRef))
          setSync({ loading: false, error: '' })
        }
      } catch (err) {
        if (alive) setSync({ loading: false, error: err.message || 'No se pudo sincronizar' })
      }
    }
    load(false)
    pollRef.current = setInterval(() => load(true), 15000)
    return () => {
      alive = false
      clearInterval(pollRef.current)
    }
  }, [remote, user])

  const updateRequest = async (id, patch) => {
    const idStr = String(id)
    const key = storageKeyFor(user)
    setStore((current) => (current.key !== key ? current : {
      ...current,
      items: current.items.map((r) => (String(r.id) === idStr ? { ...r, ...patch } : r)),
    }))
    if (!remote) return
    try {
      const saved = await patchRequest(id, patch)
      const savedItem = normalizeRequest(saved)
      setStore((current) => {
        if (current.key !== key) return current
        let found = false
        const next = current.items.map((r) => {
          if (String(r.id) !== idStr) return r
          found = true
          return { ...mergeRemoteItem({ ...r, ...patch }, savedItem), id: savedItem.id ?? r.id }
        })
        return found ? { ...current, items: next } : current
      })
      setSync((s) => ({ ...s, error: '' }))
    } catch (err) {
      console.error('patchRequest failed', err)
      setSync({ loading: false, error: err.message || 'Error al actualizar. Se guardó localmente.' })
    }
  }

  const addRequest = async (request) => {
    const key = storageKeyFor(user)
    const tempId = String(request.id)
    const optimistic = normalizeRequest({
      ...request,
      solicitanteEmail: request.solicitanteEmail || user?.email || '',
      solicitante: request.solicitante || user?.name || '',
    })
    pendingRef.current.add(tempId)
    setStore((current) => (current.key !== key ? current : { ...current, items: [optimistic, ...current.items] }))
    if (!remote) return
    try {
      const saved = await createRequest(request)
      const savedItem = normalizeRequest(saved)
      pendingRef.current.delete(tempId)
      if (savedItem.id != null) pendingRef.current.delete(String(savedItem.id))
      setStore((current) => {
        if (current.key !== key) return current
        const withoutTemp = current.items.filter((r) => String(r.id) !== tempId)
        const savedId = String(savedItem.id ?? optimistic.id)
        const mergedItem = mergeRemoteItem(optimistic, savedItem)
        const exists = withoutTemp.some((r) => String(r.id) === savedId)
        const next = exists
          ? withoutTemp.map((r) => (String(r.id) === savedId ? { ...r, ...mergedItem } : r))
          : [mergedItem, ...withoutTemp]
        return { ...current, items: next }
      })
      setSync((s) => ({ ...s, error: '' }))
    } catch (err) {
      console.error('createRequest failed', err)
      setSync({ loading: false, error: err.message || 'Error al crear solicitud. Se guardó localmente.' })
      // Se conserva el item local; la siguiente sincronización lo reconcilia.
    }
  }

  const logout = () => setUser(null)

  if (!user) {
    return <LoginView onLogin={setUser} isDark={isDark} preference={preference} onSetPreference={setPreference} />
  }

  return (
    <div className="app-shell">
      <Header isDark={isDark} preference={preference} onSetPreference={setPreference} user={user} onLogout={logout} />

      {remote && (
        <div className={`sync-bar wrap ${sync.error ? 'error' : ''}`}>
          <span>{sync.loading ? 'Sincronizando con Google Sheets...' : sync.error ? `Sincronización: ${sync.error}` : 'Conectado a Google Sheets'}</span>
        </div>
      )}

      {user.role === 'solicitante' ? (
        <SolicitanteView items={items} onAdd={addRequest} onUpdate={updateRequest} user={user} />
      ) : (
        <ConductorView items={items} onUpdate={updateRequest} />
      )}
    </div>
  )
}
