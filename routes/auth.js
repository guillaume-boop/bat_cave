const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')
const db = require('../config/db')
const isAuthenticated = require('../middlewares/authCheck')

const router = express.Router()

// GET /auth/login
router.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, '../views/login.html')
  const html = fs.readFileSync(loginPath, 'utf-8')
  res.send(html)
})

// POST /auth/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) { return res.status(400).send('Nom d\'utilisateur et mot de passe requis') }

  try {
    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username)

    if (!user || !(await bcrypt.compare(password, user.password_hash))) { return res.status(401).send('Identifiants invalides') }

    req.session.regenerate((err) => {
      if (err) return next(err)

      req.session.userId = user.id
      req.session.username = user.username

      res.redirect('/bat-computer')
    })
  } catch (err) {
    next(err)
  }
})

// GET /auth/logout - Déconnexion
router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err)
    
    res.clearCookie('bat_identity')
    res.redirect('/auth/login')
  })
})

module.exports = router
