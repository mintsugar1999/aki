import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Socket is initializing')
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    
    io.on('connection', (socket) => {
      console.log('New client connected')
      
      socket.on('joinChat', (data) => {
        console.log(`${data.nickname} joined the chat`)
        socket.join('chatroom')
        io.to('chatroom').emit('receiveMessage', {
          nickname: 'System',
          message: `${data.nickname} 加入了聊天`,
          type: 'text'
        })
      })
      
      socket.on('sendMessage', (data) => {
        console.log('Received message:', data)
        io.to('chatroom').emit('receiveMessage', data)
      })
      
      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })
    
    res.socket.server.io = io
  } else {
    console.log('Socket is already running')
  }
  res.end()
}

export default SocketHandler