const express = require('express')
const { client } = require('./discordClient')
const configSecret = require('../config.secret.json')
const { VoiceChannel } = require('discord.js')
const bodyParser = require('body-parser')
var multer = require('multer') // v1.0.5
var upload = multer() // for parsing multipart/form-data

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

function voiceChannel(guildId, channelId) {
  return new VoiceChannel(client.guilds.get(guildId), { id: channelId })
}

app.post('/play', (req, res) => {
  console.log(req.body)
  voiceChannel(req.body.guild.id, req.body.voiceChannel.id).join()
  console.log('ouch')
  res.json({ success: true, echo: req.body })
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
    status: 'online' // invisible
  })
})
