'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { sendMessage } from '@/app/actions/send-message'
import type { Database } from '@/lib/types/database'

type Message = Database['public']['Tables']['messages']['Row']

interface MessageThreadProps {
  jobId: string
  currentUserId: string
  receiverId: string
  jobTitle: string
  initialMessages: Message[]
}

export function MessageThread({
  jobId,
  currentUserId,
  receiverId,
  jobTitle,
  initialMessages,
}: MessageThreadProps) {
  const [messages, setMessages]     = useState<Message[]>(initialMessages)
  const [content, setContent]       = useState('')
  const [sending, setSending]       = useState(false)
  const [filterWarning, setWarning] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark received messages as read on mount
  useEffect(() => {
    supabase
      .from('messages')
      .update({ is_read: true } as any)
      .eq('job_id', jobId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
      .then(() => {})
  }, [jobId, currentUserId, supabase])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          setMessages((prev) => {
            const msg = payload.new as Message
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId, supabase])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return

    setSending(true)
    setWarning(null)
    setContent('')

    try {
      const { message, wasModified, removedTypes } = await sendMessage({
        jobId,
        senderId:   currentUserId,
        receiverId,
        content:    text,
      })

      // Add filtered message to local state (realtime deduplicates)
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev
        return [...prev, message as Message]
      })

      if (wasModified) {
        setWarning(
          `Your message was modified: ${removedTypes.join(', ')} removed. Sharing contact details is not allowed before a deal is made on the platform.`
        )
      }
    } catch (err) {
      setContent(text) // restore on failure
      alert(err instanceof Error ? err.message : 'Failed to send message.')
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-[600px] card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm truncate">Re: {jobTitle}</h3>
        <p className="text-xs text-warm-400 mt-0.5">
          Contact info (emails, phone numbers, social handles) is automatically removed from messages.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 text-sm ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Filter warning */}
      {filterWarning && (
        <div className="mx-3 mb-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
          <span className="text-amber-500 text-sm mt-0.5 flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-800">{filterWarning}</p>
          <button onClick={() => setWarning(null)} className="ml-auto text-amber-400 hover:text-amber-600 flex-shrink-0 text-xs">✕</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => { setContent(e.target.value); setWarning(null) }}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <Button type="submit" size="sm" loading={sending} disabled={!content.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
