import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

export default function Home() {
  const [nickname, setNickname] = useState('')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isInChat, setIsInChat] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const handleJoinChat = () => {
    if (nickname.trim()) {
      setIsInChat(true)
    }
  }

  const handleSendMessage = () => {
    if (inputMessage.trim() && socketRef.current) {
      socketRef.current.emit('sendMessage', {
        nickname,
        message: inputMessage,
        type: 'text',
      })
      setInputMessage('')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && socketRef.current) {
      const reader = new FileReader()
      reader.onloadend = () => {
        socketRef.current.emit('sendMessage', {
          nickname,
          message: reader.result,
          type: 'image',
        })
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (isInChat) {
      socketRef.current = io('', {
        path: '/api/socket'
      })

      socketRef.current.on('connect', () => {
        setIsConnected(true)
        socketRef.current.emit('joinChat', { nickname })
      })

      socketRef.current.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message])
      })

      socketRef.current.on('disconnect', () => {
        setIsConnected(false)
      })

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
        }
      }
    }
  }, [isInChat, nickname])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isInChat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Head>
          <title>匿名聊天</title>
          <meta name="description" content="无需登录的多人匿名聊天" />
        </Head>

        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">匿名聊天</h1>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">输入昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入昵称"
            />
          </div>
          <button
            onClick={handleJoinChat}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            进入聊天
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>匿名聊天 - {nickname}</title>
        <meta name="description" content="无需登录的多人匿名聊天" />
      </Head>

      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">匿名聊天</h1>
          <div className="flex items-center">
            <span className="mr-2">{nickname}</span>
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md h-[70vh] sm:h-[80vh] overflow-y-auto mb-4 p-4">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.nickname === nickname ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-start ${msg.nickname === nickname ? 'justify-end' : 'justify-start'}`}>
                {msg.nickname !== nickname && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="max-w-[70%]">
                  <div className={`text-sm font-medium mb-1 ${msg.nickname === nickname ? 'text-right text-blue-600' : 'text-left text-gray-600'}`}>{msg.nickname}</div>
                  {msg.type === 'text' ? (
                    <div className={`inline-block p-2 rounded-lg ${msg.nickname === nickname ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'} shadow-sm`}>
                      {msg.message}
                    </div>
                  ) : (
                    <div className="inline-block">
                      <img src={msg.message} alt="Image" className="max-w-full sm:max-w-xs rounded-lg shadow-sm" />
                    </div>
                  )}
                </div>
                {msg.nickname === nickname && (
                  <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入消息..."
          />
          <label className="bg-gray-100 px-4 py-2 border-l border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            📷
          </label>
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            发送
          </button>
        </div>
      </main>
    </div>
  )
}