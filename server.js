const express = require('express')
const bcrypt = require('bcrypt')
const path = require('path')
const db = require('./db')

const app = express()
// Write and read json
app.use(express.json())
// Open static files
app.use(express.static('public'))
// Launch the serve
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})

// Default redirection
app.get('/', (req, res) => {
  res.redirect('/register.html')
})

// On POST /register
app.post('/register', async (req, res) => {
  const { username, password } = req.body
  // Guard
  if (password.length < 8) return res.status(400).send('Le mot de passe doit contenir au moins 8 caractères.')
  if (username !== username.trim()) return res.status(400).send('Le nom d utilisateur ne doit pas contenir d espaces')
  
  const hash = await bcrypt.hash(password, 10)

  // try the insert
  try {
    const insert = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    )
    insert.run(username, hash)
    res.status(201).send('Utilisateur créé avec succès !')
  } catch (err) {
    res.status(409).send("Erreur : l'utilisateur existe déjà.")
  }
})


const checkAuth = async (req, res, next) => {
  // Récupère l'en-tête pour la vérifier avant d'atteindre les routes protégées
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Ajoute l'en-tête pour demander au navigateur d'ouvrir la fenêtre de connexion
    res.setHeader('WWW-Authenticate', 'Basic realm="Administration"')
    return res.status(401).send('Authentification requise')
  }
  // Décodage du Base64
  const base64 = authHeader.split(' ')[1]
  const [username, password] = Buffer.from(base64, 'base64')
    .toString()
    .split(':')

  // Vérification en BDD
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username)
  // Comparaison des mots de passe avec bcrypt
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    req.user = user // On conserve l'utilisateur dans la requête, si besoin
    next()
  } else {
    return res.status(401).send('Identifiants invalides')
  }
}

// Routes protégées avec le middleware checkAuth
app.get('/bat-computer', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'bat-computer.html'))
})

app.get('/api/me', checkAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username
  })
})

app.get('/api/secrets', checkAuth, (req, res) => {
  res.json([
    { name: 'Batarang', desc: 'Arme de jet', icon: 'fa-shuriken' },
    { name: 'Grappin', desc: 'Équipement d\'escalade', icon: 'fa-hook' },
    { name: 'Capsule fumigène', desc: 'Échappatoire tactique', icon: 'fa-cloud' },
    { name: 'Bombe électronique', desc: 'Brouilleur de signaux', icon: 'fa-zap' },
    { name: 'Bat-Parachute', desc: 'Équipement de saut', icon: 'fa-parachute-box' },
    { name: 'Gants renforcés', desc: 'Combat rapproché', icon: 'fa-hand-fist' }
  ])
})

app.post('/api/reports', checkAuth, (req, res) => {
  const { content } = req.body
  if (!content) {
    return res.status(400).send('Le rapport ne peut pas être vide.')
  }
  try {
    const insert = db.prepare(
      'INSERT INTO reports (user_id, content) VALUES (?, ?)'
    )
    insert.run(req.user.id, content)
    res.status(201).json({ message: 'Rapport enregistré avec succès !' })
  } catch (err) {
    res.status(500).send('Erreur lors de l\'enregistrement.')
  }
})