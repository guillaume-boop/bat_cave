# TP1 Basic Auth

## Installation

**Installer les dépendances** :
```bash
npm install
```

3. **Lancer le serveur** :
avec hot-reload (redémarre auto à chaque modification)
```bash
node --watch server.js
```

Le serveur démarre sur : **http://localhost:3000**

---

## Utilisation

### **S'inscrire**
- `http://localhost:3000/`
- formulaire avec :
  - **Nom d'utilisateur**
  - **Mot de passe** : minimum 8 caractères


### **Accéder au Bat-Ordinateur**
```
http://localhost:3000/bat-computer
```
- **Se connnecter grace au basic auth au compte précédemment crée**

---

## Routes

### **Publiques**
- `GET /` → Redirige vers `/register.html`
- `POST /register` → Créer un compte

### **Privées**
- `GET /bat-computer` → Page du Bat-Ordinateur
- `GET /api/me` → Infos utilisateur `{ id, username }`
- `GET /api/secrets` → Gadgets
- `POST /api/reports` → Enregistrer une mission

---

## Structure du Projet

```
bat_cave/
├── server.js              # Serveur Express + routes
├── db.js                  # Configuration SQLite
├── database.db            # Base de données (auto-créée)
├── package.json           # Dépendances
├── public/
│   ├── register.html      # Page d'inscription
│   └── register.js        # Logique d'inscription
└── private/
    └── bat-computer.html  # Page protégée (Bat-Ordinateur)
```

---
