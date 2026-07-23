# TP5 : OAuth 2.0 & OpenID Connect

Application JWT **stateless** durcie (helmet + CSP), avec **2FA TOTP obligatoire** en local **et**
connexion fédérée **Google** (« Se connecter avec Google ») via le flux **Authorization Code + PKCE**.

## Installation

```bash
npm install
```

## Lancer le serveur

```bash
npm run dev
```

## Configuration

Créer un fichier `.env` à la racine :
```
PORT=3000
JWT_SECRET=<clé générée avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# OAuth Google (voir TP5.md pour créer les identifiants)
GOOGLE_AUTH_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth
GOOGLE_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token
REDIRECT_URI=http://localhost:3000/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Identifiants de test (login local) :**
- Username : `batman`
- Password : `password123`

> La connexion Google nécessite de créer un Client ID/Secret dans la Google Cloud Console — voir [TP5.md](TP5.md).

## Routes

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Redirige vers `/auth/login` |
| GET | `/auth/login` | Affiche le formulaire de connexion |
| POST | `/auth/register` | Crée un compte + renvoie le QR d'enrôlement 2FA (pas de session) |
| POST | `/auth/login` | Vérifie le mot de passe → `requires2FA` (ok) ou `403 requires2FASetup` |
| POST | `/auth/confirm-2fa` | Finalise l'enrôlement : valide le 1er code, active la 2FA + pose les jetons |
| POST | `/auth/verify-2fa` | Second verrou : valide le code TOTP puis pose les jetons |
| POST | `/auth/refresh` | Régénère un accessToken depuis le refreshToken |
| POST | `/auth/logout` | Révoque le refreshToken en base + efface les cookies |
| GET | `/auth/login/google` | Lance le flux OAuth2/PKCE (redirige vers Google) |
| GET | `/auth/callback/google` | Retour Google : valide le state, échange le code, ouvre la session |

### Privées (JWT requis)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/bat-computer` | Page protégée Bat-Ordinateur |
| POST | `/report` | Enregistrer une mission en BDD |

## Sécurité

- **helmet** : Security Headers (CSP `script-src 'self'`, anti-clickjacking, nosniff, HSTS, masque Express).
- **XSS** : payload JWT en cookie `httpOnly` + échappement des entrées reflétées + CSP stricte.
- **CSRF** : cookies `sameSite: 'strict'`.
- **MITM** : `secure: true` en prod (HTTPS) + HSTS.
- **accessToken** : JWT `HS256`, durée `15s` (pédagogique — 15min à 1h en prod), cookie `httpOnly`.
- **refreshToken** : chaîne opaque (80 hex), stockée en base 7 jours, cookie `httpOnly`.
- **2FA (TOTP) obligatoire** (local) : `@otplib/preset-v11` + QR code (`qrcode`). Aucun jeton sans code validé.
- **OAuth2 / OIDC (Google)** : flux Authorization Code + **PKCE** (SHA-256), `state` anti-CSRF à usage unique,
  échange serveur-à-serveur (le `client_secret` ne quitte jamais le backend). 2FA déléguée à Google.
- Le payload JWT est **lisible mais infalsifiable** : y modifier son `role` casse la signature → 401.

## Structure du Projet

```
bat_cave/
├── /config
│   └── db.js                    # SQLite : users (+role, +2FA, +Google), reports, refresh_tokens, oauth_sessions
├── /middlewares
│   ├── authCheck.js             # Vérification du JWT (cookie token → req.user)
│   └── errorHandler.js          # 401 → JSON (fetch) ou redirection (navigation)
├── /services
│   └── googleOAuth.js           # PKCE, URL /authorize, échange /token, décodage ID Token
├── /routes
│   ├── auth.js                  # login local + 2FA + refresh/logout + OAuth Google
│   └── batcomputer.js           # /bat-computer (+ échappement XSS) + POST /report
├── /views
│   ├── login.html               # Connexion + champ 2FA
│   ├── register.html            # Inscription
│   └── bat-computer.html        # Page protégée + rapport + activation 2FA
├── /public
│   ├── style.css                # Styles
│   ├── script.js                # apiCall + fetchWithRetry (Retry Pattern)
│   ├── login.js                 # Logique connexion + 2FA
│   ├── register.js              # Logique inscription
│   └── bat-computer.js          # Arsenal, rapport, activation 2FA, logout
├── server.js                    # Point d'entrée stateless + helmet (CSP)
├── database.db                  # SQLite (auto-créée)
├── .env                         # Secrets (PORT, JWT_SECRET)
├── .gitignore
├── package.json
├── TP3.md                       # Doc pas-à-pas (JWT)
├── TP4.md                       # Doc pas-à-pas (Sécurité & 2FA)
├── TP5.md                       # Doc pas-à-pas (OAuth2 & OIDC Google)
└── README.md
```
