import { useEffect, useState } from 'react'
import { Package, Plus, Trash2, X } from 'lucide-react'
import api from '../api'
import { ErrorState, LoadingState, PageIntro } from './AdminDashboard'

const initialForm = {
  package_name: '',
  price: '',
  description: '',
  data_limit_mb: '',
  validity_days: '0',
  status: 'active',
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
      const { data } = await api.post('/packages', {
        ...form,
        price: Number(form.price),
        data_limit_mb: Number(form.data_limit_mb) || 0,
        validity_days: Number(form.validity_days) || 0,
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
    if (!window.confirm('Delete this package?')) return
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
        eyebrow="Catalog"
        title="Packages & Data Bundles"
        description={`${packages.length} data bundles configured for customers.`}
        action={
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3d2e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#185b43]"
            onClick={() => setIsFormOpen((current) => !current)}
          >
            {isFormOpen ? <X size={17} /> : <Plus size={17} />}
            {isFormOpen ? 'Close' : 'New data bundle'}
          </button>
        }
      />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {isFormOpen && (
        <form
          className="mb-6 grid gap-4 rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,61,46,0.06)] sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={handleCreate}
        >
          <input
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
            name="package_name"
            placeholder="Bundle Name (e.g. 5 GB Mega Pack)"
            value={form.package_name}
            onChange={handleChange}
            required
          />
          <input
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
            name="price"
            type="number"
            step="0.5"
            min="0.5"
            placeholder="Price in GH₵ (e.g. 20)"
            value={form.price}
            onChange={handleChange}
            required
          />
          <input
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
            name="data_limit_mb"
            type="number"
            min="1"
            placeholder="Data limit in MB (e.g. 1024 = 1GB)"
            value={form.data_limit_mb}
            onChange={handleChange}
            required
          />
          <input
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e]"
            name="validity_days"
            type="number"
            min="0"
            placeholder="Validity days (0 for No Expiry)"
            value={form.validity_days}
            onChange={handleChange}
          />
          <input
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f3d2e] lg:col-span-3"
            name="description"
            placeholder="Short description (e.g. No expiry — active until used up)"
            value={form.description}
            onChange={handleChange}
          />
          <button
            className="rounded-xl bg-[#ef8354] px-4 py-3 text-sm font-semibold text-white hover:bg-[#db6d3e] disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Create bundle'}
          </button>
        </form>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => (
          <article
            className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,61,46,0.06)]"
            key={pkg.id}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[#d8f6a0] text-[#0f3d2e]">
                <Package size={19} />
              </span>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => handleDelete(pkg.id)}
                title="Delete package"
              >
                <Trash2 size={17} />
              </button>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{pkg.package_name}</h2>
            <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
              {pkg.description || 'No description provided.'}
            </p>
            <div className="mt-6 flex items-end justify-between">
              <p className="text-2xl font-semibold text-[#0f3d2e]">
                GH₵{Number(pkg.price).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </p>
              <div className="text-right">
                <p className="text-xs font-semibold text-emerald-700">
                  {pkg.validity_days && Number(pkg.validity_days) > 0
                    ? `${pkg.validity_days} days`
                    : 'No Expiry'}
                </p>
                {pkg.data_limit_mb && Number(pkg.data_limit_mb) > 0 ? (
                  <span className="text-xs font-medium text-slate-500">
                    {Number(pkg.data_limit_mb) >= 1024
                      ? `${(Number(pkg.data_limit_mb) / 1024).toFixed(Number(pkg.data_limit_mb) % 1024 === 0 ? 0 : 1)} GB`
                      : `${pkg.data_limit_mb} MB`}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default AdminPackages
