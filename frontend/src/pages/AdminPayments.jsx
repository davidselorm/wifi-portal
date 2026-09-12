import { useEffect, useState } from 'react'
import { Check, CreditCard, RefreshCw } from 'lucide-react'
import api from '../api'
import { ErrorState, LoadingState, PageIntro } from './AdminDashboard'

function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    let isCurrent = true
    api.get('/payments').then(({ data }) => { if (isCurrent) setPayments(data.data) }).catch((requestError) => { if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load payments.') }).finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  const updateStatus = async (paymentId, status) => {
    setUpdatingId(paymentId); setError('')
    try { const { data } = await api.put(`/payments/${paymentId}/status`, { status }); setPayments((current) => current.map((payment) => payment.id === paymentId ? { ...payment, status: data.data.status } : payment)) } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update payment.') } finally { setUpdatingId(null) }
  }

  if (isLoading) return <LoadingState />
  if (error && payments.length === 0) return <ErrorState message={error} />

  return (
    <>
      <PageIntro
        eyebrow="Finance & Billing"
        title="Payments"
        description={`${payments.length} transactions across your portal.`}
        action={
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" /> Live records
          </span>
        }
      />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(15,61,46,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr className="hover:bg-slate-50/70" key={payment.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-[#cfe3ff] text-[#0f3d2e]">
                        <CreditCard size={17} />
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">
                          {payment.reference || `Payment #${payment.id}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">
                      {payment.full_name || `User #${payment.user_id}`}
                    </p>
                    <p className="text-xs text-slate-400">{payment.phone || payment.email || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {payment.package_name || 'WiFi Pass'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{payment.payment_method}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    GH₵{Number(payment.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-medium capitalize outline-none ${
                        payment.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : payment.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                      value={payment.status}
                      disabled={updatingId === payment.id}
                      onChange={(event) => updateStatus(payment.id, event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {updatingId === payment.id ? (
                      <RefreshCw className="animate-spin text-slate-400" size={17} />
                    ) : payment.status === 'paid' ? (
                      <Check className="text-emerald-600" size={17} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No payments found.</p>}
      </div>
    </>
  )
}

export default AdminPayments
