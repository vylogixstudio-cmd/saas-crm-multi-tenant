'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendGlobalMessage } from '@/app/(workspace)/dashboard/messages/actions'
import { 
  Send, Paperclip, X, Tag, FileText, Image as ImageIcon, 
  User, Users, Loader2, CheckCircle2 
} from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  role: string
  organization_id: string
}

interface Project {
  id: string
  title: string
  status?: string
}

interface Message {
  id: string
  content: string
  file_url: string | null
  created_at: string
  tagged_projects: { id: string, title: string }[] | null
  author_id: string
  author: {
    full_name: string
    role: string
  }
}

interface GlobalChatClientProps {
  currentUser: Profile
  initialMessages: Message[]
  activeProjects: Project[]
}

export default function GlobalChatClient({ 
  currentUser, 
  initialMessages, 
  activeProjects 
}: GlobalChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<{id: string, title: string}[]>([])
  
  // UI States
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [supabase] = useState(() => createClient())

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Realtime Subscription
  useEffect(() => {
    if (!currentUser.organization_id) return

    const channel = supabase
      .channel(`global_messages_${currentUser.organization_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_messages',
          filter: `organization_id=eq.${currentUser.organization_id}`
        },
        async (payload) => {
          // Fetch complete message details (with author & project joins)
          const { data: newMsg } = await supabase
            .from('global_messages')
            .select(`
              id, content, file_url, created_at, tagged_projects, author_id,
              author:profiles!global_messages_author_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.find(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg as unknown as Message]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.organization_id, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || isSending) return

    setIsSending(true)
    try {
      const formData = new FormData()
      formData.append('content', newMessage.trim() || (selectedFile ? 'Mengirim file lampiran' : ''))
      if (selectedFile) formData.append('file', selectedFile)
      if (selectedProjects.length > 0) formData.append('tagged_projects', JSON.stringify(selectedProjects))

      const result = await sendGlobalMessage(formData)
      if (result?.error) {
        alert(result.error)
      } else {
        setNewMessage('')
        setSelectedFile(null)
        setSelectedProjects([])
        setShowProjectPicker(false)
      }
    } catch (error) {
      console.error(error)
      alert("Gagal mengirim pesan.")
    } finally {
      setIsSending(false)
    }
  }

  const formatRole = (role: string) => {
    return role.replace('staff_', '').toUpperCase()
  }

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Users size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-[#111827]">Grup Internal Agensi</h2>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F8F9FA]/50" style={{ backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {messages.map((msg, index) => {
          const isMe = msg.author_id === currentUser.id
          const showAuthor = index === 0 || messages[index - 1].author_id !== msg.author_id
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showAuthor && !isMe && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <span className="text-xs font-bold text-gray-700">{msg.author?.full_name || 'User'}</span>
                  <span className="text-[10px] font-black uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">
                    {formatRole(msg.author?.role || '')}
                  </span>
                </div>
              )}
              
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm relative group ${
                isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-black/5 text-gray-800 rounded-tl-sm'
              }`}>
                
                {/* Project Tags */}
                {msg.tagged_projects && msg.tagged_projects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.tagged_projects.map(p => (
                      <Link key={p.id} href={`/dashboard/project/${p.id}`} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 hover:opacity-80 transition-opacity ${
                        isMe ? 'bg-emerald-700/50 border-emerald-500 text-emerald-50' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <Tag size={12} />
                        <span className="truncate max-w-[150px]">{p.title}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* File Attachment */}
                {msg.file_url && (
                  <div className="mb-2">
                    {msg.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                       <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                         <img src={msg.file_url} alt="Attachment" className="rounded-xl max-h-48 object-cover border border-white/20" />
                       </a>
                    ) : (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-lg border ${
                        isMe ? 'bg-emerald-700/50 border-emerald-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <FileText size={24} className={isMe ? 'text-emerald-200' : 'text-blue-500'} />
                        <span className="text-xs font-medium truncate max-w-[150px]">Lihat Dokumen</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Text Content */}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                
                {/* Timestamp */}
                <div className={`text-[10px] text-right mt-1.5 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview Area */}
      {(selectedFile || selectedProjects.length > 0) && (
        <div className="px-6 py-2 bg-gray-50 border-t border-black/5 flex flex-wrap items-center gap-2">
          {selectedFile && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
              {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-emerald-500" /> : <FileText size={14} className="text-blue-500" />}
              <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-rose-500 ml-1"><X size={14} /></button>
            </div>
          )}
          
          {selectedProjects.map(proj => (
            <div key={proj.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
              <Tag size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-800 truncate max-w-[150px]">
                {proj.title}
              </span>
              <button onClick={() => setSelectedProjects(prev => prev.filter(p => p.id !== proj.id))} className="text-amber-600 hover:text-rose-500 ml-1"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white border-t border-black/5">
        <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-4 relative">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
            className="hidden" 
          />

          <div className="flex flex-col flex-1 gap-2">
            
            {/* Project Picker (Dropdown) */}
            {showProjectPicker && (
              <div className="absolute bottom-16 left-0 w-64 bg-white border border-gray-200 shadow-xl rounded-[16px] overflow-hidden z-30">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-600">Pilih Project untuk Di-tag</div>
                <div className="max-h-48 overflow-y-auto">
                  {activeProjects.map(proj => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => { 
                        if (!selectedProjects.find(p => p.id === proj.id)) {
                          setSelectedProjects(prev => [...prev, { id: proj.id, title: proj.title }]); 
                        }
                        setShowProjectPicker(false); 
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="font-bold truncate">{proj.title}</div>
                      <div className="text-[10px] text-gray-500">{proj.status?.replace(/_/g, ' ')}</div>
                    </button>
                  ))}
                  {activeProjects.length === 0 && (
                    <div className="px-4 py-4 text-xs text-gray-500 text-center">Tidak ada project aktif.</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2 bg-[#F8F9FA] border border-black/10 rounded-[20px] px-2 sm:px-4 py-2 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              
              <button 
                type="button" 
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className={`p-2 rounded-full transition-colors ${selectedProjects.length > 0 ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                title="Tag Project"
              >
                <Tag size={20} />
              </button>
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${selectedFile ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                title="Lampirkan File"
              >
                <Paperclip size={20} />
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan untuk tim..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-2"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !selectedFile)}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 text-white rounded-[20px] flex items-center justify-center shrink-0 shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="ml-1" />}
          </button>
        </form>
      </div>
    </div>
  )
}
