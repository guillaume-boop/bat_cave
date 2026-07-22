// Import des librairies et de la BDD
require('dotenv').config()
const express = require('express')
const db = require('./config/db')
const errorHandler = require('./middlewares/errorHandler')

// Créé du serveur Express
const app = express()
// Rend possible la lecture et l'écriture du JSON
app.use(express.json())
// Permet de lire les données des formulaires HTML
app.use(express.urlencoded({ extended: true }))
// Ouvre les fichiers frontend non protégés
app.use(express.static('public'))

// Lance le serveur en local, sur le port 3000
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})

// Route racine redirige vers login
app.get('/', (req, res) => {
  res.redirect('/auth/login')
})

app.use('/auth', require('./routes/auth'))
app.use(require('./routes/batcomputer'))

// Middleware de gestion des erreurs
app.use(errorHandler)
