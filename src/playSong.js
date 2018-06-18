const ytdl = require('ytdl-core')
const { musicChannels } = require('./musicChannels')
const request = require('request')
const configSecret = require('../config.secret.json')

function playSong(song, voiceChannel) {
  console.log('attempting to play')
  // Get song queue
  const musicChannel = musicChannels.get(voiceChannel.id)
  const queue = musicChannel.queue
  if (queue.length === 0) {
    return
  }
  // Get YouTube ID
  const id = song.id
  // Create stream
  const streamOptions = { seek: 0, volume: 0.35 }
  const stream = ytdl('https://www.youtube.com/watch?v=' + id, {
    filter: 'audio'
  })
  // Dispatch stream to voice channel
  console.log('playing')
  var dispatcher
  try {
    dispatcher = voiceChannel.connection.playStream(stream, streamOptions)
  } catch (err) {
    console.error(err)
    return
  }
  // On song end, play next
  dispatcher.on('end', () => {
    console.log('song end')
    const lastSong = queue.shift()
    if (queue.length <= 0) {
      console.log('auto adding from ' + lastSong.id)
      console.log(
        'uri: ' +
          `https://www.googleapis.com/youtube/v3/search?part=snippet` +
          `&relatedToVideoId=${encodeURIComponent(lastSong.id)}&type=video` +
          `&key=${configSecret.apiKeyYT}`
      )
      // Automatically add song to queue
      request(
        `https://www.googleapis.com/youtube/v3/search?part=snippet` +
          `&relatedToVideoId=${encodeURIComponent(lastSong.id)}&type=video` +
          `&key=${configSecret.apiKeyYT}`,
        (err, response, body) => {
          const data = JSON.parse(body)
          // Remove live songs
          const items = []
          for (var i in data.items) {
            const item = data.items[i]
            if (item.snippet.liveBroadcastContent != 'live') {
              items.push(item)
            }
          }
          if (items.length === 0) return
          // Get a random song from item list
          const itemNum = Math.floor(Math.random() * data.items.length)
          const item = data.items[itemNum]
          // Push song to queue
          queue.push({
            id: item.id.videoId,
            title: item.snippet.title,
            live: false,
            auto: true
          })
          // Play song
          try {
            playSong(queue[0], voiceChannel)
          } catch (err) {
            console.error(err.message)
            callback(`**Crap!** ${err.message}`)
          }
        }
      )
    } else {
      console.log('playing next song')
      try {
        playSong(queue[0], voiceChannel)
      } catch (err) {
        console.error(err.message)
        //callback(`**Crap!** ${err.message}`)
      }
    }
  })
  // Catch errors
  dispatcher.on('error', console.error)
  // Display song info
  //callback(`${lang.now_playing} **` + queue[0].name + '**')
}
exports.playSong = playSong
