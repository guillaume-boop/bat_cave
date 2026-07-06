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

// Faire une requête fetch avec gestion d'erreur
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options)
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
