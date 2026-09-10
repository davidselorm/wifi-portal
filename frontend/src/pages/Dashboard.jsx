import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  LogOut,
  Package,
  RefreshCw,
  UserRound,
  Wifi,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { captureMikroTikParams, submitMikroTikLogin } from '../utils/mikrotik'

const formatCurrency = (value) =>
  `GH₵${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Dashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Router session state initialized once from URL/session storage
  const [routerSession] = useState(() => captureMikroTikParams())

  // Checkout modal state
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Post-payment success modal state
  const [completedPayment, setCompletedPayment] = useState(null)

  const loadDashboard = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data } = await api.get('/customer/dashboard')
      setDashboard(data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true
    api
      .get('/customer/dashboard')
      .then(({ data }) => {
        if (isCurrent) setDashboard(data.data)
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.response?.data?.message || 'Unable to load your dashboard.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('wifi_portal_token')
    localStorage.removeItem('wifi_portal_user')
    navigate('/login', { replace: true })
  }

  const handleOpenCheckout = (pkg) => {
    setSelectedPackage(pkg)
    setPaymentError('')
  }

  const handleCloseCheckout = () => {
    setSelectedPackage(null)
    setPaymentError('')
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    if (!selectedPackage) return

    setIsProcessingPayment(true)
    setPaymentError('')

    try {
      const reference = `WAVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const { data } = await api.post('/payments', {
        package_id: selectedPackage.id,
        amount: Number(selectedPackage.price),
        payment_method: paymentMethod,
        status: 'paid',
        reference,
      })

      // Refresh stats and history in background
      loadDashboard()

      // Show success modal
      setCompletedPayment({
        package: selectedPackage,
        payment: data.data,
      })

      setSelectedPackage(null)
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Payment processing failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleActivateInternet = () => {
    const user = dashboard?.user
    const username = user?.phone || user?.email || routerSession.mac || 'guest'
    const password = 'wifi-access'

    if (routerSession.linkLogin) {
      submitMikroTikLogin(username, password, routerSession.linkLogin)
    } else {
      alert('Router login URL not detected. If you are connected to the MikroTik hotspot, you are ready to browse!')
      setCompletedPayment(null)
    }
  }

  const handleSimulateUsage = async () => {
    try {
      await api.post('/customer/record-usage', { consumed_mb: 50 })
      loadDashboard()
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7f5] text-[#0f3d2e]">
        <RefreshCw className="animate-spin" size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f7f5] px-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-red-700">{error}</p>
          <button className="mt-5 rounded-xl bg-[#0f3d2e] px-5 py-3 font-semibold text-white" onClick={loadDashboard}>
            Try again
          </button>
        </div>
      </main>
    )
  }

  const {
    user,
    available_packages: packages = [],
    recent_payments: payments = [],
    payment_summary: summary = {},
    data_balance: dataBalance = {
      total_mb: 0,
      used_mb: 0,
      remaining_mb: 0,
      percentage_remaining: 0,
      is_active: false,
      formatted: { total: '0 MB', used: '0 MB', remaining: '0 MB' }
    }
  } = dashboard

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.14em] text-[#0f3d2e] uppercase">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d8f6a0]">
              <Wifi size={20} />
            </span>
            WaveNet WiFi
          </div>

          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={handleLogout}
            >
              <LogOut size={17} /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        {/* Router connection indicator */}
        {routerSession.mac && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-900">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
              </span>
              <span>
                <strong>Connected Router Hotspot:</strong> Device MAC <code>{routerSession.mac}</code>
                {routerSession.ip && ` • IP ${routerSession.ip}`}
              </span>
            </div>
            <span className="rounded-lg bg-emerald-200/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Hotspot Session
            </span>
          </div>
        )}

        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.12em] text-[#ef8354] uppercase">Customer dashboard</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Good to see you, {user.full_name.split(' ')[0]}.
            </h1>
            <p className="mt-3 text-slate-500">Monitor your data bundle balance and select packages below.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" /> Account {user.status || 'active'}
          </div>
        </div>

        {/* Active Data Balance Section */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-white p-6 shadow-[0_16px_50px_rgba(15,61,46,0.08)] sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-[#ef8354] uppercase">
                  Data Balance
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    dataBalance.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      dataBalance.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {dataBalance.is_active ? 'Active • No Expiry' : 'No Active Data'}
                </span>
              </div>
              <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                {dataBalance.formatted.remaining}{' '}
                <span className="text-base font-normal text-slate-500">remaining</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {dataBalance.total_mb > 0 && (
                <button
                  type="button"
                  onClick={handleSimulateUsage}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  title="Simulate data consumption to test live countdown"
                >
                  Test 50MB Usage
                </button>
              )}
              <a
                href="#packages-section"
                className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#185b43]"
              >
                Top Up Data
              </a>
            </div>
          </div>

          {/* Progress Bar & Breakdown */}
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
              <span>Used: <strong>{dataBalance.formatted.used}</strong></span>
              <span className="font-semibold text-slate-700">{dataBalance.percentage_remaining}% Available</span>
              <span>Total Credited: <strong>{dataBalance.formatted.total}</strong></span>
            </div>
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dataBalance.percentage_remaining > 30
                    ? 'bg-[#0f3d2e]'
                    : dataBalance.percentage_remaining > 10
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${dataBalance.percentage_remaining}%` }}
              />
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<CreditCard size={20} />} label="Total spent" value={formatCurrency(summary.total_spent)} accent="bg-[#d8f6a0]" />
          <StatCard icon={<Package size={20} />} label="Payments made" value={summary.total_payments || 0} accent="bg-[#ffd9c8]" />
          <StatCard icon={<UserRound size={20} />} label="Available plans" value={packages.length} accent="bg-[#cfe3ff]" />
        </section>

        {/* Content Columns */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Packages Catalog with Purchase Action */}
          <section id="packages-section" className="rounded-2xl bg-[#0f3d2e] p-6 text-white shadow-[0_12px_40px_rgba(15,61,46,0.12)] sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Available WiFi Packages</h2>
                <p className="mt-1 text-sm text-white/60">Choose a package to get connected instantly</p>
              </div>
              <ArrowUpRight className="text-[#d8f6a0]" size={23} />
            </div>

            <div className="mt-7 space-y-4">
              {packages.length === 0 ? (
                <p className="text-sm text-white/60">No active packages right now.</p>
              ) : (
                packages.map((plan) => (
                  <div
                    className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-[#d8f6a0]/50 sm:flex-row sm:items-center"
                    key={plan.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-white">{plan.package_name}</p>
                        <span className="rounded-md bg-[#d8f6a0]/20 px-2 py-0.5 text-xs font-semibold text-[#d8f6a0]">
                          {plan.validity_days > 0 ? `${plan.validity_days} Days` : 'No Expiry'}
                        </span>
                        {plan.data_limit_mb > 0 && (
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90">
                            {plan.data_limit_mb >= 1024
                              ? `${(plan.data_limit_mb / 1024).toFixed(plan.data_limit_mb % 1024 === 0 ? 0 : 1)} GB`
                              : `${plan.data_limit_mb} MB`}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/65">{plan.description || 'High-speed data bundle'}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-xl font-bold text-[#d8f6a0]">{formatCurrency(plan.price)}</p>
                      <button
                        className="rounded-xl bg-[#d8f6a0] px-4 py-2.5 text-sm font-semibold text-[#0f3d2e] transition hover:bg-white"
                        onClick={() => handleOpenCheckout(plan)}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Payments Section */}
          <section className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,61,46,0.06)] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Recent payments</h2>
                <p className="mt-1 text-sm text-slate-500">Your latest transactions and access records</p>
              </div>
              <CreditCard className="text-slate-300" size={24} />
            </div>

            {payments.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No payments recorded yet. Pick a plan to connect.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={payment.id}>
                    <div>
                      <p className="font-medium text-slate-800">{payment.reference || `Payment #${payment.id}`}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {payment.payment_method} • {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                      <p
                        className={`mt-1 text-xs font-medium capitalize ${
                          payment.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-[#ef8354] uppercase">Checkout</span>
                <h3 className="text-2xl font-bold text-slate-950">Activate {selectedPackage.package_name}</h3>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={handleCloseCheckout}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Bundle type:</span>
                <span className="font-semibold text-emerald-700">No Expiry Data Bundle</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>Data volume:</span>
                <span className="font-medium text-slate-900">
                  {selectedPackage.data_limit_mb > 0
                    ? selectedPackage.data_limit_mb >= 1024
                      ? `${(selectedPackage.data_limit_mb / 1024).toFixed(selectedPackage.data_limit_mb % 1024 === 0 ? 0 : 1)} GB`
                      : `${selectedPackage.data_limit_mb} MB`
                    : selectedPackage.package_name}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>Total amount:</span>
                <span className="text-lg font-bold text-[#0f3d2e]">{formatCurrency(selectedPackage.price)}</span>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleProcessPayment}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Choose Payment Method</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {['MTN MoMo', 'Telecel Cash', 'Card'].map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-xl border py-3 text-xs font-semibold transition ${
                        paymentMethod === method
                          ? 'border-[#0f3d2e] bg-[#0f3d2e] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentError && (
                <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{paymentError}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseCheckout}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#0f3d2e] py-3 text-sm font-semibold text-white transition hover:bg-[#185b43] disabled:opacity-60"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(selectedPackage.price)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Success & Access Granted Modal */}
      {completedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl sm:p-9">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-2xl font-bold text-slate-950">Payment Successful!</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your bundle for <strong>{completedPayment.package.package_name}</strong> is activated.
            </p>

            <div className="my-6 rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600">
              <p className="flex justify-between py-1">
                <span>Reference:</span>
                <span className="font-mono font-medium text-slate-900">{completedPayment.payment.reference}</span>
              </p>
              <p className="flex justify-between py-1">
                <span>Plan:</span>
                <span className="font-medium text-slate-900">{completedPayment.package.package_name}</span>
              </p>
              <p className="flex justify-between py-1">
                <span>Validity:</span>
                <span className="font-semibold text-emerald-600">No Expiry (Active until finished)</span>
              </p>
              <p className="flex justify-between py-1">
                <span>Device MAC:</span>
                <span className="font-mono font-medium text-slate-900">{routerSession.mac || 'Auto-detected'}</span>
              </p>
            </div>

            <button
              onClick={handleActivateInternet}
              className="w-full rounded-xl bg-[#0f3d2e] py-3.5 font-semibold text-white transition hover:bg-[#185b43]"
            >
              Activate Internet Access
            </button>

            <button
              onClick={() => setCompletedPayment(null)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Close & return to dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(15,61,46,0.06)]">
      <span className={`mb-5 grid size-10 place-items-center rounded-xl ${accent} text-[#0f3d2e]`}>{icon}</span>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
    </div>
  )
}

export default Dashboard
