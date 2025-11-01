const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

const User = mongoose.model('User', userSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// Create user
app.post('/api/users', (req, res) => {
  const username = req.body.username
  const user = new User({ username })
  user.save((err, data) => {
    if (err) return console.error(err)
    res.json({ username: data.username, _id: data._id })
  })
})

// Get all users
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, users) => {
    if (err) return console.error(err)
    res.json(users)
  })
})

// Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body
  const exercise = {
    description,
    duration: Number(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  }

  User.findById(req.params._id, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' })
    user.log.push(exercise)
    user.save((err, updatedUser) => {
      if (err) return console.error(err)
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        ...exercise
      })
    })
  })
})

// Get logs
app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query

  User.findById(req.params._id, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' })

    let logs = [...user.log]

    if (from) logs = logs.filter(e => new Date(e.date) >= new Date(from))
    if (to) logs = logs.filter(e => new Date(e.date) <= new Date(to))
    if (limit) logs = logs.slice(0, Number(limit))

    logs = logs.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs
    })
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
