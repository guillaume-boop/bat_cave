const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const qrcode = require('qrcode')
const { authenticator } = require('@otplib/preset-v11')
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

// Génère (si absent) le secret 2FA de l'utilisateur et renvoie le QR code à scanner
async function ensureSecretQr(user) {
  let secret = user.two_factor_secret

  if (!secret) {
    secret = authenticator.generateSecret()
    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret, user.id)
  }

  const otpauth = authenticator.keyuri(user.username, 'Bat-Cave', secret)
  return qrcode.toDataURL(otpauth)
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

// POST /auth/register - Crée un compte puis lance l'enrôlement 2FA obligatoire (pas de session)
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) { return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' }) }
  if (password.length < 6) { return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' }) }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)

    if (existing) { return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' }) }

    const hash = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, 'JUSTICIER')

    // 2FA obligatoire : aucun jeton tant que le code TOTP n'a pas été confirmé
    const qrCode = await ensureSecretQr({ id: result.lastInsertRowid, username, two_factor_secret: null })
    res.status(201).json({ username, qrCode })
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

    // 2FA obligatoire mais pas encore configurée : accès refusé, on renvoie le QR d'enrôlement
    if (user.two_factor_enabled !== 1) { return res.status(403).json({ requires2FASetup: true, username: user.username, qrCode: await ensureSecretQr(user) }) }

    // Premier verrou franchi. La 2FA étant active, on bloque la distribution du jeton
    res.json({ requires2FA: true, username: user.username })
  } catch (err) {
    next(err)
  }
})

// POST /auth/verify-2fa - Second verrou : valide le code TOTP puis délivre le jeton
router.post('/verify-2fa', (req, res, next) => {
  const { username, code } = req.body

  if (!username || !code) { return res.status(400).json({ error: 'Nom d\'utilisateur et code requis' }) }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user || user.two_factor_enabled !== 1) { return res.status(401).json({ error: 'Accès refusé' }) }
    if (!authenticator.check(code, user.two_factor_secret)) { return res.status(401).json({ error: 'Code 2FA invalide ou expiré' }) }

    issueSession(res, user)
    res.json({ message: 'Double authentification réussie' })
  } catch (err) {
    next(err)
  }
})

// POST /auth/confirm-2fa - Finalise l'enrôlement : valide le 1er code, active la 2FA et connecte
router.post('/confirm-2fa', (req, res, next) => {
  const { username, code } = req.body

  if (!username || !code) { return res.status(400).json({ error: 'Nom d\'utilisateur et code requis' }) }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user || !user.two_factor_secret) { return res.status(400).json({ error: 'Aucune 2FA en attente pour ce compte' }) }
    if (!authenticator.check(code, user.two_factor_secret)) { return res.status(401).json({ error: 'Code incorrect. Activation avortée' }) }

    db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(user.id)
    issueSession(res, user)
    res.json({ message: 'La 2FA est activée, connexion réussie' })
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
