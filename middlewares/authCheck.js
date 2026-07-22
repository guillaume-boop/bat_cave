const jwt = require('jsonwebtoken')

// Middleware qui valide le jeton d'accès (JWT) présent dans le cookie token
const authCheck = (req, res, next) => {
  // Extraction manuelle du cookie token depuis l'en-tête HTTP
  const cookieHeader = req.headers.cookie
  const tokenCookie = cookieHeader?.split(';').find((c) => c.trim().startsWith('token='))
  const token = tokenCookie?.split('=')[1]

  if (!token) {
    const err = new Error('Authentification requise')
    err.statusCode = 401
    return next(err)
  }

  try {
    // Décode ET vérifie la signature : un payload falsifié lève une erreur
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    const err = new Error('Jeton invalide ou expiré')
    err.statusCode = 401
    next(err)
  }
}

module.exports = authCheck
