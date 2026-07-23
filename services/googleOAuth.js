const crypto = require('crypto')

// PKCE : secret dynamique généré à chaque connexion (jamais stocké en dur)
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url')
}

// Version hachée (irréversible) envoyée publiquement à Google pour lancer le défi
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest().toString('base64url')
}

// Jeton aléatoire anti-CSRF pour sécuriser l'origine au retour du flux
function generateState() {
  return crypto.randomBytes(32).toString('base64url')
}

// Assemble l'URL du serveur d'autorisation Google (endpoint /authorize)
function getGoogleAuthUrl(state, codeChallenge) {
  const url = new URL(process.env.GOOGLE_AUTH_ENDPOINT)
  url.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID)
  url.searchParams.append('redirect_uri', process.env.REDIRECT_URI)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'openid profile email')
  url.searchParams.append('state', state)
  url.searchParams.append('code_challenge', codeChallenge)
  url.searchParams.append('code_challenge_method', 'S256')
  return url.toString()
}

// Échange serveur-à-serveur : code temporaire + code_verifier => jetons (endpoint /token)
async function exchangeCodeForTokens(code, codeVerifier) {
  const response = await fetch(process.env.GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
      code_verifier: codeVerifier
    })
  })

  if (!response.ok) { throw new Error(JSON.stringify(await response.json())) }

  return response.json()
}

// Décode le payload de l'ID Token (JWT signé par Google) pour lire le profil
function decodeIdToken(idToken) {
  const payload = idToken.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
}

module.exports = {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  decodeIdToken
}
