import { useEffect, useState } from 'react'
import { Clock, Plus, Timer, Trash2, Wifi, X, Zap } from 'lucide-react'
import api from '../api'
import { ErrorState, LoadingState, PageIntro } from './AdminDashboard'

const initialForm = {
  package_name: '',
  duration_value: '1',
  duration_unit: 'hours',
  price: '',
  speed_limit: 'Unlimited',
  description: '',
  status: 'active',
}

const formatDurationBadge = (pkg) => {
  const val = Number(pkg.duration_value) || 1
  const unit = (pkg.duration_unit || 'hours').toLowerCase()

  if (unit === 'days' || unit === 'day') {
    return val === 1 ? '1 Day (24 Hours)' : `${val} Days`
  }
  if (unit === 'minutes' || unit === 'min' || unit === 'mins') {
    return `${val} Minutes`
  }
  return val === 1 ? '1 Hour' : `${val} Hours`
}

function AdminPackages() {
  const [packages, setPackages] = useState([])
  const [form, setForm] = useState(initialForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    api
      .get('/packages')
      .then(({ data }) => {
        if (isCurrent) setPackages(data.data)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load packages.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleCreate = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const val = Number(form.duration_value) || 1
      const unit = form.duration_unit || 'hours'
      const minutes = unit === 'days' ? val * 1440 : unit === 'minutes' ? val : val * 60

      const { data } = await api.post('/packages', {
        ...form,
        price: Number(form.price),
        duration_value: val,
        duration_unit: unit,
        duration_minutes: minutes,
      })
      setPackages((current) => [data.data, ...current])
      setForm(initialForm)
      setIsFormOpen(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create package.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (packageId) => {
    if (!window.confirm('Delete this time package?')) return
    try {
      await api.delete(`/packages/${packageId}`)
      setPackages((current) => current.filter((pkg) => pkg.id !== packageId))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete package.')
    }
  }

  if (isLoading) return <LoadingState />
  if (error && packages.length === 0) return <ErrorState message={error} />

  return (
    <>
      <PageIntro
        eyebrow="Time Passes"
        title="WiFi Time Packages"
        description={`${packages.length} time-based access passes configured for customers.`}
        action={
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3d2e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#185b43]"
            onClick={() => setIsFormOpen((current) => !current)}
          >
            {isFormOpen ? <X size={17} /> : <Plus size={17} />}
            {isFormOpen ? 'Close' : 'New Time Package'}
          </button>
        }
      />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {isFormOpen && (
        <form
          className="mb-6 grid gap-4 rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,61,46,0.06)] sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={handleCreate}
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Package Name</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
              name="package_name"
              placeholder="e.g. 1 Hour Pass or 24 Hours Day Pass"
              value={form.package_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Duration</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
                name="duration_value"
                type="number"
                min="1"
                placeholder="e.g. 1"
                value={form.duration_value}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Unit</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#0f3d2e]"
                name="duration_unit"
                value={form.duration_unit}
                onChange={handleChange}
              >
                <option value="hours">Hours</option>
                <option value="minutes">Minutes</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Price in GH₵</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
              name="price"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="e.g. 2.50 or 18.00"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Speed Limit</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
              name="speed_limit"
              placeholder="e.g. Unlimited or 10 Mbps"
              value={form.speed_limit}
              onChange={handleChange}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Description</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
              name="description"
              placeholder="e.g. Unlimited internet for 1 continuous hour from time of purchase"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-end lg:col-span-3">
            <button
              className="w-full rounded-xl bg-[#ef8354] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#db6d3e] disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Save & Publish Time Package'}
            </button>
          </div>
        </form>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => (
          <article
            className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,61,46,0.06)]"
            key={pkg.id}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-[#d8f6a0] text-[#0f3d2e]">
                  <Clock size={19} />
                </span>
                <button
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(pkg.id)}
                  title="Delete package"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <Timer size={13} /> {formatDurationBadge(pkg)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  <Zap size={12} className="text-amber-500" /> {pkg.speed_limit || 'Unlimited Speed'}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-semibold text-slate-950">{pkg.package_name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {pkg.description || 'Continuous high-speed WiFi access for the full duration.'}
              </p>
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Customer Price</p>
                <p className="text-2xl font-bold text-[#0f3d2e]">
                  GH₵{Number(pkg.price).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-right text-xs font-medium text-slate-600">
                Continuous Access
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default AdminPackages
