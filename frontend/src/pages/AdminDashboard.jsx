import { useEffect, useState } from 'react'
import { ArrowUpRight, Package, RefreshCw, Users, Wifi } from 'lucide-react'
import api from '../api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    api.get('/admin/dashboard')
      .then(({ data }) => { if (isCurrent) setStats(data.data) })
      .catch((requestError) => { if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load dashboard metrics.') })
    return () => { isCurrent = false }
  }, [])

  if (error) return <ErrorState message={error} />
  if (!stats) return <LoadingState />

  return <>
    <PageIntro eyebrow="Overview" title="Good morning, admin." description="A quick read on the people and plans powering your portal." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Users size={20} />} label="Total users" value={stats.total_users} tone="lime" />
      <Metric icon={<Package size={20} />} label="Total packages" value={stats.total_packages} tone="peach" />
      <Metric icon={<Wifi size={20} />} label="Active packages" value={stats.active_packages} tone="blue" />
      <Metric icon={<ArrowUpRight size={20} />} label="Inactive packages" value={stats.inactive_packages} tone="yellow" />
    </section>
    <section className="mt-8 rounded-2xl bg-[#0f3d2e] p-7 text-white sm:p-9"><div className="max-w-xl"><p className="text-sm font-semibold tracking-[0.12em] text-[#d8f6a0] uppercase">Portal health</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Everything important, in one place.</h2><p className="mt-3 leading-7 text-white/65">Use the navigation to review customers, keep packages current, and reconcile incoming payments.</p></div></section>
  </>
}

function Metric({ icon, label, value, tone }) {
  const tones = { lime: 'bg-[#d8f6a0]', peach: 'bg-[#ffd9c8]', blue: 'bg-[#cfe3ff]', yellow: 'bg-[#ffe9a8]' }
  return <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(15,61,46,0.06)]"><span className={`mb-6 grid size-10 place-items-center rounded-xl ${tones[tone]} text-[#0f3d2e]`}>{icon}</span><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p></div>
}

export function PageIntro({ eyebrow, title, description, action }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold tracking-[0.12em] text-[#ef8354] uppercase">{eyebrow}</p><h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h1><p className="mt-2 text-slate-500">{description}</p></div>{action}</div>
}

export function LoadingState() { return <div className="grid min-h-64 place-items-center text-[#0f3d2e]"><RefreshCw className="animate-spin" size={26} /></div> }
export function ErrorState({ message }) { return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{message}</div> }

export default AdminDashboard
