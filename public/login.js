// Connexion avec 2FA obligatoire (deux cas : configurer la 2FA, ou saisir le code)
const loginForm = document.getElementById('login-form')
const twofa = document.getElementById('twofa')
const qrBlock = document.getElementById('twofa-qr-block')
const codeForm = document.getElementById('code-form')

let pendingUsername = ''
let mode = 'verify' // 'verify' = 2FA déjà active | 'setup' = enrôlement à finaliser

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  pendingUsername = loginForm.username.value

  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: pendingUsername, password: loginForm.password.value })
  })
  const data = await response.json()

  // 2FA active : on demande juste le code
  if (data.requires2FA) {
    mode = 'verify'
    loginForm.classList.add('hidden')
    twofa.classList.remove('hidden')
    showMessage('login-message', 'Entrez le code de votre application d\'authentification', 'info')
    return
  }

  // 2FA obligatoire mais pas encore configurée : on affiche le QR puis le code
  if (data.requires2FASetup) {
    mode = 'setup'
    loginForm.classList.add('hidden')
    document.getElementById('twofa-qr').src = data.qrCode
    qrBlock.classList.remove('hidden')
    twofa.classList.remove('hidden')
    showMessage('login-message', 'Scannez le QR code puis saisissez le code affiché', 'info')
    return
  }

  showMessage('login-message', data.error || 'Erreur de connexion', 'error')
})

codeForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const url = mode === 'setup' ? '/auth/confirm-2fa' : '/auth/verify-2fa'

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: pendingUsername, code: codeForm.code.value })
  })

  if (response.ok) { window.location.href = '/bat-computer'; return }

  const data = await response.json()
  showMessage('login-message', data.error || 'Code invalide', 'error')
})
