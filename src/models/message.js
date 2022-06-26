function constructor(message, profile, contact)  {
    this.content = message.content
    this.contactId = contact.id
    this.time = message.time
    this.attachments =  message.attachments || []
    this.author = {
      username: profile.username,
      avatar: profile.avatar,
      id: profile.id,
    }
}

module.exports = constructor 
