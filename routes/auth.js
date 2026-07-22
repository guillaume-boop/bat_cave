const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/db')

const router = express.Router()

// Durées de vie (15s pour l'accessToken = purement pédagogique, 7j pour le refreshToken)
const ACCESS_MAX_AGE = 15000
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000

// Options communes des cookies de jetons
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: false }

// Signe un jeton d'accès autonome contenant le profil de l'utilisateur
function signAccessToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15s' })
}

// Extrait un cookie précis depuis l'en-tête HTTP brut
function getCookie(req, name) {
  const cookie = req.headers.cookie?.split(';').find((c) => c.trim().startsWith(`${name}=`))
  return cookie?.split('=')[1]
}

// Pose les 2 cookies de connexion : accessToken (JWT) + refreshToken (opaque + base)
function issueSession(res, user) {
  const token = signAccessToken(user)
  const refreshToken = crypto.randomBytes(40).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE).toISOString()

  db.prepare('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(refreshToken, user.id, expiresAt)

  res.cookie('token', token, { ...cookieOptions, maxAge: ACCESS_MAX_AGE })
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_MAX_AGE })
}

// GET /auth/login
router.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, '../views/login.html')
  const html = fs.readFileSync(loginPath, 'utf-8')
  res.send(html)
})

// GET /auth/register
router.get('/register', (req, res) => {
  const registerPath = path.join(__dirname, '../views/register.html')
  const html = fs.readFileSync(registerPath, 'utf-8')
  res.send(html)
})

// POST /auth/register - Crée un compte puis connecte directement l'utilisateur
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) { return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' }) }
  if (password.length < 6) { return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' }) }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)

    if (existing) { return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' }) }

    const hash = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, 'JUSTICIER')

    issueSession(res, { id: result.lastInsertRowid, username, role: 'JUSTICIER' })
    res.status(201).json({ message: 'Compte créé' })
  } catch (err) {
    next(err)
  }
})

// POST /auth/login - Génère l'accessToken (cookie) + le refreshToken (cookie + base)
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) { return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' }) }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user || !(await bcrypt.compare(password, user.password_hash))) { return res.status(401).json({ error: 'Identifiants invalides' }) }

    issueSession(res, user)
    res.json({ message: 'Connexion réussie' })
  } catch (err) {
    next(err)
  }
})

// POST /auth/refresh - Régénère un accessToken si le refreshToken est toujours valide
router.post('/refresh', (req, res, next) => {
  const refreshToken = getCookie(req, 'refreshToken')

  if (!refreshToken) { return res.status(401).json({ error: 'Accès refusé' }) }

  try {
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken)

    if (!stored || new Date() > new Date(stored.expires_at)) { return res.status(401).json({ error: 'Session expirée, reconnectez-vous' }) }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(stored.user_id)
    const token = signAccessToken(user)

    res.cookie('token', token, { ...cookieOptions, maxAge: ACCESS_MAX_AGE })
    res.json({ message: 'Jeton d\'accès rafraîchi' })
  } catch (err) {
    next(err)
  }
})

// POST /auth/logout - Révoque le refreshToken en base et efface les cookies
router.post('/logout', (req, res) => {
  const refreshToken = getCookie(req, 'refreshToken')

  if (refreshToken) { db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken) }

  res.clearCookie('token')
  res.clearCookie('refreshToken')
  res.json({ message: 'Déconnexion et révocation réussies' })
})

module.exports = router
