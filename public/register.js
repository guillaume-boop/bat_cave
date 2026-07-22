// Inscription : créer le compte puis enrôler la 2FA obligatoire avant toute session
const registerForm = document.getElementById('register-form')
const twofaSetup = document.getElementById('twofa-setup')
const confirmForm = document.getElementById('confirm-form')

let pendingUsername = ''

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  pendingUsername = registerForm.username.value

  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: pendingUsername, password: registerForm.password.value })
  })
  const data = await response.json()

  if (!response.ok) { showMessage('register-message', data.error || 'Erreur lors de l\'inscription', 'error'); return }

  // Compte créé : on affiche le QR, la session viendra après validation du code
  registerForm.classList.add('hidden')
  document.getElementById('twofa-qr').src = data.qrCode
  twofaSetup.classList.remove('hidden')
})

confirmForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const response = await fetch('/auth/confirm-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: pendingUsername, code: confirmForm.code.value })
  })

  if (response.ok) { window.location.href = '/bat-computer'; return }

  const data = await response.json()
  showMessage('register-message', data.error || 'Code invalide', 'error')
})
