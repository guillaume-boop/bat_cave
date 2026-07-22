# TP3 : JWT Authentication

Authentification **stateless** par JSON Web Token, avec accessToken court + refreshToken révocable.

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
```

**Identifiants de test :**
- Username : `batman`
- Password : `password123`

## Routes

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Redirige vers `/auth/login` |
| GET | `/auth/login` | Affiche le formulaire de connexion |
| POST | `/auth/login` | Vérifie les identifiants, pose accessToken + refreshToken |
| POST | `/auth/refresh` | Régénère un accessToken depuis le refreshToken |
| POST | `/auth/logout` | Révoque le refreshToken en base + efface les cookies |

### Privées (JWT requis)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/bat-computer` | Page protégée Bat-Ordinateur |
| POST | `/report` | Enregistrer une mission en BDD |

## Sécurité

- **accessToken** : JWT signé (`HS256`), durée `15s` (pédagogique — 15min à 1h en prod), en cookie `httpOnly`.
- **refreshToken** : chaîne opaque (80 hex), stockée en base 7 jours, en cookie `httpOnly`.
- Cookies : `httpOnly` (anti-XSS) + `sameSite: strict` (anti-CSRF). Passer `secure: true` en prod (HTTPS).
- Le payload JWT est **lisible mais infalsifiable** : y modifier son `role` casse la signature → 401.

## Structure du Projet

```
bat_cave/
├── /config
│   └── db.js                    # SQLite : users (+role), reports, refresh_tokens
├── /middlewares
│   ├── authCheck.js             # Vérification du JWT (cookie token → req.user)
│   └── errorHandler.js          # 401 → JSON (fetch) ou redirection (navigation)
├── /routes
│   ├── auth.js                  # /auth/login, /auth/refresh, /auth/logout
│   └── batcomputer.js           # /bat-computer + POST /report
├── /views
│   ├── login.html               # Connexion (fetch → JSON)
│   └── bat-computer.html        # Page protégée + rapport + logout
├── /public
│   ├── style.css                # Styles
│   └── script.js                # apiCall + fetchWithRetry (Retry Pattern)
├── server.js                    # Point d'entrée stateless
├── database.db                  # SQLite (auto-créée)
├── .env                         # Secrets (PORT, JWT_SECRET)
├── .gitignore
├── package.json
├── TP3.md                       # Documentation pas-à-pas
└── README.md
```
