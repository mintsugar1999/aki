import Pusher from 'pusher'

// 初始化Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
})

const SocketHandler = (req, res) => {
  if (req.method === 'POST') {
    const { action, data } = req.body
    
    if (action === 'joinChat') {
      console.log(`${data.nickname} joined the chat`)
      pusher.trigger('chatroom', 'receiveMessage', {
        nickname: 'System',
        message: `${data.nickname} 加入了聊天`,
        type: 'text'
      })
    } else if (action === 'sendMessage') {
      console.log('Received message:', data)
      pusher.trigger('chatroom', 'receiveMessage', data)
    }
    
    res.status(200).json({ success: true })
  } else {
    res.status(200).json({ message: 'Socket API' })
  }
}

export default SocketHandler