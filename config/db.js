const Database = require('better-sqlite3')
const bcrypt = require('bcrypt')
const db = new Database('database.db')

// Création de la table users
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'JUSTICIER',
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0
  )
`).run()

// Migrations : ajoute les colonnes manquantes si la base date d'un TP précédent
const columns = db.prepare('PRAGMA table_info(users)').all()
const hasColumn = (name) => columns.some((col) => col.name === name)
if (!hasColumn('role')) { db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'JUSTICIER'").run() }
if (!hasColumn('two_factor_secret')) { db.prepare('ALTER TABLE users ADD COLUMN two_factor_secret TEXT').run() }
if (!hasColumn('two_factor_enabled')) { db.prepare('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0').run() }

// Création de la table reports
db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`).run()

// Création de la table refresh_tokens (état minimal pour révoquer une connexion)
db.prepare(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// Créer un utilisateur par défaut si la table est vide (test du login)
async function initializeDefaultUser() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get()

  if (count.count === 0) {
    const username = 'batman'
    const password = 'password123'
    const hash = await bcrypt.hash(password, 10)

    try {
      db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, 'ADMIN')
      console.log('✅ Utilisateur par défaut créé : batman / password123')
    } catch (err) {
      console.error('Erreur création utilisateur:', err)
    }
  }
}

initializeDefaultUser()

module.exports = db
