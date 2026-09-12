import { useEffect, useMemo, useState } from 'react'
import { Activity, Laptop, RefreshCw, Search, Wifi, WifiOff } from 'lucide-react'
import api from '../api'
import { ErrorState, LoadingState, PageIntro } from './AdminDashboard'

function AdminSessions() {
  const [sessions, setSessions] = useState([])
  const [statusFilter, setStatusFilter] = useState('active')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [kickingId, setKickingId] = useState(null)

  const loadSessions = async (silent = false) => {
    if (!silent) setIsLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/admin/sessions?status=${statusFilter}`)
      setSessions(data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load active sessions.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [statusFilter])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadSessions(true)
  }

  const handleKick = async (sessionId, mac) => {
    if (!window.confirm(`Disconnect device session (${mac || 'selected'})? This will disconnect the device from WiFi.`)) {
      return
    }

    setKickingId(sessionId)
    try {
      await api.post(`/admin/sessions/${sessionId}/kick`)
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId ? { ...session, status: 'disconnected', ended_at: new Date().toISOString() } : session
        )
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to disconnect device session.')
    } finally {
      setKickingId(null)
    }
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const target = `${session.full_name || ''} ${session.phone || ''} ${session.ip_address || ''} ${session.mac_address || ''}`.toLowerCase()
      return target.includes(query.toLowerCase())
    })
  }, [sessions, query])

  const activeCount = useMemo(() => sessions.filter((s) => s.status === 'active').length, [sessions])

  if (isLoading && sessions.length === 0) return <LoadingState />
  if (error && sessions.length === 0) return <ErrorState message={error} />

  return (
    <>
      <PageIntro
        eyebrow="MikroTik Live Sessions"
        title="Connected Devices"
        description={`${activeCount} active WiFi connections currently registered.`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              title="Refresh device sessions"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-[#0f3d2e] sm:w-64"
                placeholder="Search phone, IP, or MAC"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: 'active', label: 'Active Online', icon: Wifi },
          { key: 'disconnected', label: 'Disconnected History', icon: WifiOff },
          { key: 'all', label: 'All Records', icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              statusFilter === key
                ? 'bg-[#0f3d2e] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(15,61,46,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 font-semibold">MAC Address</th>
                <th className="px-6 py-4 font-semibold">Connected Since</th>
                <th className="px-6 py-4 font-semibold">Pass Expiry</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSessions.map((session) => {
                const isActive = session.status === 'active'
                return (
                  <tr key={session.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                          <Laptop size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{session.full_name || 'Guest User'}</p>
                          <p className="text-xs text-slate-400">{session.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-800">
                      {session.ip_address || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-800">
                      {session.mac_address || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {session.started_at
                        ? new Date(session.started_at).toLocaleTimeString('en-GH', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {session.expires_at
                        ? new Date(session.expires_at).toLocaleTimeString('en-GH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'Online' : 'Disconnected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isActive ? (
                        <button
                          onClick={() => handleKick(session.id, session.mac_address)}
                          disabled={kickingId === session.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          {kickingId === session.id ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Ended</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    No device sessions match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default AdminSessions
