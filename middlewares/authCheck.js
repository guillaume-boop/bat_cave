// Middleware de check if aauth is real
const authCheck = (req, res, next) => {
  if (!req.session.userId) {
    const err = new Error('Authentification requise')
    err.statusCode = 401
    return next(err)
  }

  next()
}

module.exports = authCheck
