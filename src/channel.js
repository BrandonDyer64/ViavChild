const { client } = require('./discordClient')
const { musicChannels } = require('./musicChannels')

exports.channelsIn = new Map()

client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (newMember.voiceChannel !== oldMember.voiceChannel) {
    if (newMember.voiceChannel != null) {
      let voiceChannel = newMember.voiceChannel
      // If someone joined my channel
      if (
        voiceChannel.members.size == 2 &&
        voiceChannel == newMember.guild.me.voiceChannel
      ) {
        if (voiceChannel.connection && voiceChannel.connection.dispatcher) {
          try {
            setTimeout(() => {
              console.log('resume')
              voiceChannel.connection.dispatcher.resume()
            }, 1000)
          } catch (e) {
            console.log(e)
          }
        }
      }
    }
    if (oldMember.voiceChannel != null) {
      // If I'm the only one left. I leave
      if (
        oldMember.voiceChannel.members.size === 1 &&
        oldMember.voiceChannel == oldMember.guild.me.voiceChannel
      ) {
        // Try to leave channel
        try {
          // Dissolve or pause dispatcher
          if (
            oldMember.voiceChannel.connection &&
            oldMember.voiceChannel.connection.dispatcher
          ) {
            musicChannel = musicChannels.get(oldMember.voiceChannel.id)
            if (musicChannel.stayInVoice) {
              // Pause the music
              console.log('pause')
              oldMember.voiceChannel.connection.dispatcher.pause()
            } else {
              // Destroy queue
              musicChannel.queue = []
              try {
                oldMember.voiceChannel.connection.dispatcher.end()
              } catch (e) {}
              // Leave
              try {
                oldMember.voiceChannel.leave()
              } catch (e) {}
              channelsIn.delete(oldMember.guild.id)
            }
          }
        } catch (err) {
          console.log(e)
        }
      }
    }
  }
})
