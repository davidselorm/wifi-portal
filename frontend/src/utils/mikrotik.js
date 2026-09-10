export function captureMikroTikParams() {
  if (typeof window === 'undefined') return { mac: '', ip: '', linkLogin: '', linkOrig: '', error: '' }

  const params = new URLSearchParams(window.location.search)
  const mac = params.get('mac')
  const ip = params.get('ip')
  const linkLogin = params.get('link-login') || params.get('link_login')
  const linkOrig = params.get('link-orig') || params.get('link_orig')
  const error = params.get('error')

  const existing = getMikroTikParams()

  const updated = {
    mac: mac || existing.mac || '',
    ip: ip || existing.ip || '',
    linkLogin: linkLogin || existing.linkLogin || '',
    linkOrig: linkOrig || existing.linkOrig || '',
    error: error || existing.error || '',
  }

  if (mac || ip || linkLogin) {
    try {
      sessionStorage.setItem('mikrotik_session', JSON.stringify(updated))
    } catch {
      // Ignore storage errors
    }
  }

  return updated
}

export function getMikroTikParams() {
  if (typeof window === 'undefined') return { mac: '', ip: '', linkLogin: '', linkOrig: '', error: '' }
  try {
    const raw = sessionStorage.getItem('mikrotik_session')
    return raw ? JSON.parse(raw) : { mac: '', ip: '', linkLogin: '', linkOrig: '', error: '' }
  } catch {
    return { mac: '', ip: '', linkLogin: '', linkOrig: '', error: '' }
  }
}

export function submitMikroTikLogin(username, password, customLinkLogin) {
  if (typeof document === 'undefined') return

  const { linkLogin, linkOrig } = getMikroTikParams()
  const targetUrl = customLinkLogin || linkLogin || 'http://192.168.88.1/login'

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = targetUrl

  const userField = document.createElement('input')
  userField.type = 'hidden'
  userField.name = 'username'
  userField.value = username
  form.appendChild(userField)

  const passField = document.createElement('input')
  passField.type = 'hidden'
  passField.name = 'password'
  passField.value = password
  form.appendChild(passField)

  if (linkOrig) {
    const dstField = document.createElement('input')
    dstField.type = 'hidden'
    dstField.name = 'dst'
    dstField.value = linkOrig
    form.appendChild(dstField)
  }

  document.body.appendChild(form)
  form.submit()
}
