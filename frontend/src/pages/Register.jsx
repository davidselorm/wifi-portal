import { useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Phone, Radio, User, Wifi } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { captureMikroTikParams } from '../utils/mikrotik'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    captureMikroTikParams()
  }, [])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Register user
      await api.post('/auth/register', {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        password: form.password,
      })

      // 2. Auto login right after registration
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      })

      localStorage.setItem('wifi_portal_token', data.token)
      localStorage.setItem('wifi_portal_user', JSON.stringify(data.user))

      // Navigate straight to dashboard
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Registration failed. Please check your information and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-5 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,61,46,0.12)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#0f3d2e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border-[3rem] border-[#bce76a]/20" />
          <div className="absolute -bottom-28 -left-28 size-80 rounded-full border-[3rem] border-[#ef8354]/20" />
          <div className="relative flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-[#d8f6a0] uppercase">
            <span className="grid size-10 place-items-center rounded-xl bg-[#bce76a] text-[#0f3d2e]">
              <Wifi size={20} />
            </span>
            WaveNet
          </div>
          <div className="relative max-w-md">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-[#d8f6a0]">
              <Radio size={16} /> Instant high-speed WiFi access
            </p>
            <h1 className="text-5xl leading-[1.04] font-semibold tracking-[-0.04em]">Get connected in minutes.</h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Create your account, pick the plan that suits your needs, and enjoy uninterrupted internet access on your device.
            </p>
          </div>
          <p className="relative text-sm text-white/45">WiFi Registration Portal</p>
        </section>

        <section className="flex items-center p-7 sm:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-[#0f3d2e] uppercase">
                <span className="grid size-10 place-items-center rounded-xl bg-[#d8f6a0]">
                  <Wifi size={20} />
                </span>
                WaveNet
              </div>
            </div>
            <p className="mb-3 text-sm font-semibold tracking-[0.12em] text-[#ef8354] uppercase">Create account</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">Join WaveNet WiFi</h2>
            <p className="mt-3 text-slate-500">Register to purchase a package and unlock internet access.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <span className="relative mt-1.5 block">
                  <User className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 outline-none transition focus:border-[#0f3d2e] focus:bg-white focus:ring-4 focus:ring-[#0f3d2e]/10"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone number
                <span className="relative mt-1.5 block">
                  <Phone className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 outline-none transition focus:border-[#0f3d2e] focus:bg-white focus:ring-4 focus:ring-[#0f3d2e]/10"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+233 24 123 4567"
                    required
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email address
                <span className="relative mt-1.5 block">
                  <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 outline-none transition focus:border-[#0f3d2e] focus:bg-white focus:ring-4 focus:ring-[#0f3d2e]/10"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <span className="relative mt-1.5 block">
                  <LockKeyhole className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-12 pl-11 outline-none transition focus:border-[#0f3d2e] focus:bg-white focus:ring-4 focus:ring-[#0f3d2e]/10"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                  />
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <span className="relative mt-1.5 block">
                  <LockKeyhole className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 outline-none transition focus:border-[#0f3d2e] focus:bg-white focus:ring-4 focus:ring-[#0f3d2e]/10"
                    name="confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </span>
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                className="w-full rounded-xl bg-[#0f3d2e] px-5 py-3.5 font-semibold text-white transition hover:bg-[#185b43] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account & continue'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-[#0f3d2e] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Register
