const express = require('express')
const fs = require('fs')
const path = require('path')
const db = require('../config/db')
const authCheck = require('../middlewares/authCheck')

const router = express.Router()

// Route protégée /bat-computer
router.get('/bat-computer', authCheck, (req, res) => {
  const batcomputerPath = path.join(__dirname, '../views/bat-computer.html')
  let html = fs.readFileSync(batcomputerPath, 'utf-8')

  html = html.replaceAll('{{username}}', req.user.username)

  res.send(html)
})

// POST /report - Soumettre un rapport
router.post('/report', authCheck, (req, res, next) => {
  const { content } = req.body

  if (!content || content.trim() === '') { return res.status(400).json({ error: 'Le rapport ne peut pas être vide' }) }

  try {
    db.prepare('INSERT INTO reports (user_id, content) VALUES (?, ?)').run(
      req.user.id,
      content
    )

    res.status(201).json({ message: 'Rapport enregistré avec succès !' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
