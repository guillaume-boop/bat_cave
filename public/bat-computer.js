// Arsenal (données statiques côté app)
const gadgets = [
  { name: 'Grapnel Hook', desc: 'Crochet de rappel pour escalader les bâtiments', icon: 'fa-hook' },
  { name: 'Batarang', desc: 'Arme de jet en forme de chauve-souris', icon: 'fa-star' },
  { name: 'Smoke Pellet', desc: 'Grenade fumigène pour s\'échapper', icon: 'fa-cloud' },
  { name: 'Sonar Tracker', desc: 'Détecteur de mouvement avancé', icon: 'fa-wifi' },
  { name: 'Night Vision Goggles', desc: 'Lunettes de vision nocturne', icon: 'fa-eye' },
  { name: 'Grappling Gun', desc: 'Pistolet à grappin haute puissance', icon: 'fa-gun' }
]

function loadGadgets() {
  const container = document.getElementById('gadgets-container')
  container.innerHTML = gadgets.map((g) => `
    <div class="gadget-card">
      <i class="fas ${g.icon}"></i>
      <h5>${g.name}</h5>
      <p>${g.desc}</p>
    </div>
  `).join('')
}

// Soumission d'un rapport (apiCall = fetchWithRetry : refresh transparent sur 401)
document.getElementById('report-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const content = document.getElementById('report-content').value

  const result = await apiCall('/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })

  if (result.ok) {
    showMessage('report-message', result.data.message, 'success')
    clearForm('report-form')
  } else {
    showMessage('report-message', result.data?.error || result.error || 'Erreur lors de l\'enregistrement.', 'error')
  }
})

// Déconnexion : révocation côté serveur puis retour login
document.getElementById('logout-btn').addEventListener('click', async (e) => {
  e.preventDefault()
  await fetch('/auth/logout', { method: 'POST' })
  window.location.href = '/auth/login'
})

loadGadgets()
