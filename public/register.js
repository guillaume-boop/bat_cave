document.getElementById('register-form').onsubmit = async e => {
  e.preventDefault()
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const messageElement = document.getElementById('message')
  if (response.ok) {
    messageElement.style.color = 'green'
    messageElement.innerText = 'Inscription réussie ! Redirection...'
    const credentials = btoa(username + ':' + password)
    localStorage.setItem('credentials', credentials)
    setTimeout(() => {
      window.location.href = '/bat-computer'
    }, 1500)
  } else {
    messageElement.style.color = 'red'
    const errorText = await response.text()
    messageElement.innerText = 'Erreur : ' + errorText
  }
}