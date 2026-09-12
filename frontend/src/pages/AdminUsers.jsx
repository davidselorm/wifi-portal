import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2, UserRound } from 'lucide-react'
import api from '../api'
import { ErrorState, LoadingState, PageIntro } from './AdminDashboard'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let isCurrent = true
    api.get('/users').then(({ data }) => { if (isCurrent) setUsers(data.data) }).catch((requestError) => { if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load users.') }).finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  const filteredUsers = useMemo(() => users.filter((user) => `${user.full_name} ${user.email} ${user.phone}`.toLowerCase().includes(query.toLowerCase())), [users, query])

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user and their payment history?')) return
    setDeletingId(userId)
    try { await api.delete(`/users/${userId}`); setUsers((current) => current.filter((user) => user.id !== userId)) } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete user.') } finally { setDeletingId(null) }
  }

  if (isLoading) return <LoadingState />
  if (error && users.length === 0) return <ErrorState message={error} />

  return (
    <>
      <PageIntro
        eyebrow="Customers & Staff"
        title="Users"
        description={`${users.length} registered accounts in the portal.`}
        action={
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={17} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-[#0f3d2e] sm:w-64"
              placeholder="Search users"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(15,61,46,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">WiFi Access</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const hasActiveAccess =
                  user.access_expires_at && new Date(user.access_expires_at) > new Date()
                return (
                  <tr className="hover:bg-slate-50/70" key={user.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-9 place-items-center rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-[#d8f6a0] text-[#0f3d2e]'
                          }`}
                        >
                          <UserRound size={17} />
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{user.full_name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.role || 'customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          hasActiveAccess
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {hasActiveAccess ? 'Active Pass' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          title="Delete user"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">No users match your search.</p>
        )}
      </div>
    </>
  )
}

export default AdminUsers
