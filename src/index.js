const express = require('express')
const { client } = require('./discordClient')
const configSecret = require('../config.secret.json')
const request = require('request')
const getYoutubeID = require('get-youtube-id')
const fetchVideoInfo = require('youtube-info')
const { TextChannel, VoiceChannel } = require('discord.js')
const bodyParser = require('body-parser')
const { playSong } = require('./playSong')
const { musicChannels } = require('./musicChannels')
const { channelsIn } = require('./channel')
const process = require('process')

var multer = require('multer') // v1.0.5
var upload = multer() // for parsing multipart/form-data

for (var i = 2; i < process.argv.length; i++) {
  const argv = process.argv[i]
  let params = argv.split('=')
  switch (params[0]) {
    case 'token':
      configSecret.token = params[1]
      break
    case 'port':
      configSecret.port = parseInt(params[1])
      break
  }
}

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

function makeVoiceChannel(guildId, channelId) {
  return new VoiceChannel(client.guilds.get(guildId), { id: channelId })
}

function getMusicChannel(voiceChannelId) {
  if (!musicChannels.has(voiceChannelId)) {
    musicChannels.set(voiceChannelId, { id: voiceChannelId, queue: [] })
  }
  return musicChannels.get(voiceChannelId)
}

app.post('/available', (req, res) => {
  const voiceChannelId = req.body.voiceChannel.id
  const guildId = req.body.guild.id
  let isAvailable = false
  console.log(guildId)
  console.log(voiceChannelId)
  console.log(channelsIn.has(guildId))
  if (channelsIn.has(guildId)) {
    console.log(channelsIn.get(guildId))
    if (channelsIn.get(guildId) === voiceChannelId) {
      isAvailable = true
    } else {
      isAvailable = false
    }
  } else {
    isAvailable = true
  }
  res.json({ success: true, available: isAvailable })
})

app.post('/play', (req, res) => {
  const voiceChannel = makeVoiceChannel(
    req.body.guild.id,
    req.body.voiceChannel.id
  )
  voiceChannel.join().then(connection => {
    channelsIn.set(req.body.guild.id, req.body.voiceChannel.id)
    if (!musicChannels.has(voiceChannel.id)) {
      musicChannels.set(voiceChannel.id, { id: voiceChannel.id, queue: [] })
    }
    const musicChannel = musicChannels.get(voiceChannel.id)
    musicChannel.textChannel = req.body.textChannel.id
    musicChannel.stayInVoice = !!req.body.stayInVoice
    musicChannel.queue.push(req.body.song)
    if (musicChannel.queue.length === 1) {
      playSong(musicChannel.queue[0], voiceChannel)
    }
    res.json({ success: true, echo: req.body })
  })
})

app.post('/skip', (req, res) => {
  const voiceChannel = makeVoiceChannel(
    req.body.guild.id,
    req.body.voiceChannel.id
  )
  try {
    const dispatcher = voiceChannel.connection.dispatcher
    dispatcher.pause()
    dispatcher.end()
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false })
  }
})

app.post('/queue', (req, res) => {
  const musicChannel = getMusicChannel(req.body.voiceChannel.id)
  console.log(musicChannel.queue)
  res.json({ success: true, data: musicChannel.queue })
})

app.post('/stop', (req, res) => {
  const voiceChannel = makeVoiceChannel(
    req.body.guild.id,
    req.body.voiceChannel.id
  )
  try {
    const musicChannel = getMusicChannel(req.body.voiceChannel.id)
    musicChannel.queue = []
    const dispatcher = voiceChannel.connection.dispatcher
    dispatcher.pause()
    dispatcher.end()
    voiceChannel.leave()
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false })
  }
})

const port = configSecret.port || 3000

app.listen(port, () => console.log(`Viav listening on port ${port}`))

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
