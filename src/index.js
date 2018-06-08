const express = require('express')
const { client } = require('./discordClient')
const configSecret = require('../config.secret.json')

const app = express()

app.get('/play', (req, res) => {
  res.send('hello world')
})

app.listen(3000, () => console.log('Viav listening on port 3000'))

client.on('message', message => {
  if (message.content === 'ping') {
    message.channel.send('pong')
  }
})

client.on('error', console.error)

client.login(configSecret.token).then(() => {
  client.user.setPresence({
    game: {
      name: 'viav.app',
      type: 'LISTENING'
    },
    status: 'invisible'
  })
})
