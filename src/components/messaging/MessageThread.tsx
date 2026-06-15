'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markConversationRead } from '@/actions/messages'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, formatDateTimeLocalized, type Locale } from '@/lib/i18n'

type Msg = { id: string; sender_id: string; content: string; created_at: string }

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  initialMessages: Msg[]
  otherName: string
  venueTitle: string | null
  locale: Locale
}

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  otherName,
  venueTitle,
  locale,
}: MessageThreadProps) {
  const t = getDictionary(locale).messages
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [text, setText] = useState('')
  const [isSending, startSending] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    markConversationRead(conversationId).catch(() => {})

    const supabase = createClient()
    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Msg
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
          if (m.sender_id !== currentUserId) markConversationRead(conversationId).catch(() => {})
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  const handleSend = () => {
    const content = text.trim()
    if (!content || isSending) return
    setText('')
    startSending(async () => {
      try {
        const sent = await sendMessage(conversationId, content)
        setMessages((prev) => (prev.some((x) => x.id === sent.id) ? prev : [...prev, sent]))
      } catch (err) {
        setText(content)
        toast.error(err instanceof Error ? err.message : t.failed)
      }
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/messages"
          aria-label={t.backToInbox}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold">{otherName}</p>
          {venueTitle && (
            <p className="truncate text-xs text-muted-foreground">
              {t.about} {venueTitle}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{t.threadEmpty}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatDateTimeLocalized(m.created_at, locale)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 border-t px-4 py-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t.composerPlaceholder}
          rows={1}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none"
        />
        <Button onClick={handleSend} disabled={isSending || !text.trim()} size="icon" aria-label={t.send}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 rtl:rotate-180" />
          )}
        </Button>
      </div>
    </div>
  )
}
