// Fonctions utilitaires partagées

// Afficher un message avec couleur
function showMessage(elementId, message, type = 'info') {
  const messageEl = document.getElementById(elementId)
  if (!messageEl) return

  messageEl.className = `message-${type}`
  messageEl.innerText = message
  messageEl.style.marginTop = '1rem'
  messageEl.style.textAlign = 'center'
}

// Fetch résilient : sur un 401, tente /auth/refresh puis rejoue la requête
async function fetchWithRetry(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  const response = await fetch(url, { ...options, headers })

  if (response.status !== 401) { return response }

  const refresh = await fetch('/auth/refresh', { method: 'POST', headers: { Accept: 'application/json' } })
  if (!refresh.ok) { window.location.href = '/auth/login'; return response }

  return fetch(url, { ...options, headers })
}

// Faire une requête fetch avec gestion d'erreur
async function apiCall(url, options = {}) {
  try {
    const response = await fetchWithRetry(url, options)
    const data = await response.json()

    return {
      ok: response.ok,
      status: response.status,
      data
    }
  } catch (err) {
    console.error('Erreur API:', err)
    return {
      ok: false,
      error: 'Erreur réseau'
    }
  }
}

// Nettoyer un formulaire
function clearForm(formId) {
  const form = document.getElementById(formId)
  if (form) form.reset()
}
