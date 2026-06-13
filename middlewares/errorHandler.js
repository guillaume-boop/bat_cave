// Middleware de gestion des erreurs globales (gere la redirection vers login if 401)
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500

  // Si c'est un 401 → redirige vers login
  if (statusCode === 401) {
    return res.redirect('/auth/login')
  }

  // Autres erreurs
  res.status(statusCode).send(`Erreur ${statusCode}: ${err.message}`)
}

module.exports = errorHandler
