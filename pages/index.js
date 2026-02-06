import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Send, Image } from 'lucide-react'

export default function Home() {
  const [nickname, setNickname] = useState('')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isInChat, setIsInChat] = useState(false)
  const supabaseRef = useRef(null)
  const subscriptionRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Initialize Supabase client
  useEffect(() => {
    supabaseRef.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }, [])

  const handleJoinChat = () => {
    if (nickname.trim()) {
      setIsInChat(true)
    }
  }

  // Simple encryption/decryption using Base64
  const encryptMessage = (message) => {
    return btoa(unescape(encodeURIComponent(message)))
  }

  const decryptMessage = (message) => {
    try {
      return decodeURIComponent(escape(atob(message)))
    } catch (e) {
      // If decryption fails, return original message (for images)
      return message
    }
  }

  const handleSendMessage = () => {
    if (inputMessage.trim() && supabaseRef.current) {
      supabaseRef.current
        .from('chat_messages')
        .insert({
          nickname,
          message: encryptMessage(inputMessage),
          type: 'text',
          timestamp: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error sending message:', error)
          } else {
            setInputMessage('')
          }
        })
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && supabaseRef.current) {
      console.log('Uploading file:', file.name, file.type, file.size)
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.error('File is not an image:', file.type)
        return
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('File too large:', file.size)
        return
      }
      
      const reader = new FileReader()
      reader.onloadstart = () => {
        console.log('Starting to read file...')
      }
      reader.onloadend = () => {
        console.log('File read complete, data URL length:', reader.result.length)
        
        supabaseRef.current
          .from('chat_messages')
          .insert({
            nickname,
            message: reader.result, // Images are already base64 encoded
            type: 'image',
            timestamp: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error sending image:', error)
            } else {
              console.log('Image sent successfully')
            }
          })
      }
      reader.onerror = (error) => {
        console.error('Error reading file:', error)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (isInChat && supabaseRef.current) {
      // Don't load existing messages for new users
      setMessages([])

      // Send join message
      supabaseRef.current
        .from('chat_messages')
        .insert({
          nickname: 'System',
          message: encryptMessage(`${nickname} 加入了聊天`),
          type: 'text',
          timestamp: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error sending join message:', error)
          }
        })

      // Subscribe to new messages
      subscriptionRef.current = supabaseRef.current
        .channel('chat_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          console.log('New message received:', payload.new)
          setMessages((prev) => [...prev, payload.new])
        })
        .subscribe()

      setIsConnected(true)

      return () => {
        if (subscriptionRef.current) {
          supabaseRef.current.removeChannel(subscriptionRef.current)
        }
      }
    }
  }, [isInChat, nickname])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isInChat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-2">
        <Head>
          <title>Stranger Things</title>
          <meta name="description" content="无需登录的多人聊天" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
        </Head>

        <div className="bg-gray-100 p-2 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-800 font-['Playfair Display']">Stranger Things</h1>
          <div className="mb-2">
            <label className="block text-gray-700 mb-1 text-sm">输入昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="请输入昵称"
            />
          </div>
          <button
            onClick={handleJoinChat}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-sm"
          >
            进入聊天
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Stranger Things - {nickname}</title>
        <meta name="description" content="无需登录的多人聊天" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="bg-blue-600 text-white p-2">
        <div className="w-full flex justify-between items-center px-2">
          <h1 className="text-xl font-bold text-white font-['Playfair Display']">Stranger Things</h1>
          <div className="flex items-center">
            <span className="mr-2 text-sm truncate max-w-[120px]">{nickname}</span>
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full p-4 pb-20">
        <div className="flex-grow overflow-y-auto">
          {messages.map((msg, index) => (
            <div 
              key={`${msg.timestamp}-${index}`} 
              className={`mb-4 ${msg.nickname === nickname ? 'text-right' : 'text-left'}`}
            >
              {msg.nickname !== nickname && (
                <div className="flex items-start mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-gray-600 mr-2">{msg.nickname}</span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {msg.type === 'text' ? (
                      <div className="inline-block p-3 rounded-lg bg-gray-100 text-gray-800 max-w-[80%]">
                        <p className="text-sm">{decryptMessage(msg.message)}</p>
                      </div>
                    ) : (
                      <div className="inline-block max-w-[80%]">
                        <img 
                          src={msg.message} 
                          alt="Image" 
                          className="max-w-full rounded-lg"
                          onError={(e) => {
                            console.error('Error loading image:', e.target.src)
                            e.target.alt = 'Image failed to load'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {msg.nickname === nickname && (
                <div className="flex items-start justify-end mb-2">
                  <div className="flex-grow max-w-[80%]">
                    <div className="flex items-center justify-end mb-1">
                      <span className="text-xs text-gray-400 mr-2">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <span className="text-xs font-medium text-blue-600">{msg.nickname}</span>
                    </div>
                    {msg.type === 'text' ? (
                      <div className="inline-block p-3 rounded-lg bg-blue-100 text-gray-800 max-w-[80%]">
                        <p className="text-sm">{decryptMessage(msg.message)}</p>
                      </div>
                    ) : (
                      <div className="inline-block max-w-[80%]">
                        <img 
                          src={msg.message} 
                          alt="Image" 
                          className="max-w-full rounded-lg"
                          onError={(e) => {
                            console.error('Error loading image:', e.target.src)
                            e.target.alt = 'Image failed to load'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => document.getElementById('image-upload').click()}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow mx-3 px-4 py-2 rounded-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入消息..."
          />
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}