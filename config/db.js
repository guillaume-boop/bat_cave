const Database = require('better-sqlite3')
const bcrypt = require('bcrypt')
const db = new Database('database.db')

// Création de la table users
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )
`).run()

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

// Créer un utilisateur par défaut si la table est vide (test du login)
async function initializeDefaultUser() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get()

  if (count.count === 0) {
    const username = 'batman'
    const password = 'password123'
    const hash = await bcrypt.hash(password, 10)

    try {
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash)
      console.log('✅ Utilisateur par défaut créé : batman / password123')
    } catch (err) {
      console.error('Erreur création utilisateur:', err)
    }
  }
}

initializeDefaultUser()

module.exports = db