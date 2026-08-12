'use client'

import { addInternalNote } from '@/app/(workspace)/dashboard/actions'
import { MessageSquare, Send, User } from 'lucide-react'
import { useRef, useState } from 'react'

export default function InternalNotes({
  projectId,
  notes,
  currentUserId
}: {
  projectId: string
  notes: any[]
  currentUserId: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 md:p-8">
      <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
        <MessageSquare size={18} className="text-purple-500" /> Diskusi Tim Internal
        <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
          Tidak Terlihat Klien
        </span>
      </h3>
      
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {notes && notes.length > 0 ? (
          notes.map((note) => {
            const isMe = note.author_id === currentUserId
            return (
              <div key={note.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm mt-1">
                  {note.profiles?.full_name?.substring(0, 1).toUpperCase() || <User size={14} />}
                </div>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#4B5563]">
                      {isMe ? 'Anda' : note.profiles?.full_name || 'Staf'}
                    </span>
                    <span className="text-[9px] text-[#9CA3AF]">
                      {new Date(note.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-[#2563EB] text-white rounded-tr-none' : 'bg-[#F3F4F6] text-[#111827] rounded-tl-none'}`}>
                    {note.content}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-[#9CA3AF] italic text-center py-4">
            Belum ada diskusi internal.
          </p>
        )}
      </div>

      <form 
        ref={formRef}
        action={async (formData) => {
          setIsSubmitting(true)
          await addInternalNote(formData)
          formRef.current?.reset()
          setIsSubmitting(false)
        }} 
        className="flex gap-2"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input 
          type="text" 
          name="content"
          placeholder="Tulis pesan ke tim, tagih invoice, atau instruksi eksekutor..." 
          required 
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-xs focus:border-[#2563EB] outline-none transition-all disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-[12px] transition-all disabled:opacity-50 shadow-sm flex items-center justify-center shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
