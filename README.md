# TP2 : Session-Based Authentication

## Installation

Installer les dépendances :
```bash
npm install
```

## Lancer le serveur

Avec hot-reload (redémarre auto à chaque modification) :
```bash
npm run dev
```

## Configuration

Créer un fichier `.env` à la racine :
```
PORT=
SESSION_SECRET=
```

**Identifiants de test :**
- Username : `batman`
- Password : `password123`

## Routes

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Redirige vers `/auth/login` |
| GET | `/auth/login` | Affiche formulaire de connexion |
| POST | `/auth/login` | Traite connexion + régénère session |
| GET | `/auth/logout` | Déconnexion + destruction session |

### Privées (nécessitent authentification)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/bat-computer` | Page protégée Bat-Ordinateur |
| POST | `/report` | Enregistrer une mission en BDD |

## Structure du Projet

```
batcave-security/
├── /config
│   └── db.js                    # Configuration SQLite + création tables
├── /middlewares
│   ├── authCheck.js             # Vérification authentification
│   └── errorHandler.js          # Gestion erreurs globales (401 → login)
├── /routes
│   ├── auth.js                  # Routes /auth/login, /auth/logout
│   └── batcomputer.js           # Route /bat-computer + POST /report
├── /views
│   ├── login.html               # Formulaire de connexion
│   └── bat-computer.html        # Page protégée + formulaire rapport
├── /public
│   ├── style.css                # Styles réutilisables
│   └── script.js                # Fonctions JS partagées
├── server.js                    # Point d'entrée (imports + app.listen)
├── database.db                  # SQLite (auto-créée)
├── .env                         # Secrets (PORT, SESSION_SECRET)
├── .gitignore                   # Protection fuites
├── package.json
└── README.md
```