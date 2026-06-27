'use client'

import { Fragment, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send, Check, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markConversationRead, sendFirstMessage } from '@/actions/messages'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmojiPicker } from '@/components/messaging/EmojiPicker'
import { cn } from '@/lib/utils'
import { getDictionary, formatDateLocalized, type Locale } from '@/lib/i18n'

type Msg = {
  id: string
  sender_id: string
  content: string
  created_at: string
  status?: 'sending' | 'sent' | 'failed'
}

interface MessageThreadProps {
  conversationId?: string
  currentUserId: string
  initialMessages: Msg[]
  otherName: string
  venueTitle: string | null
  locale: Locale
  /** Draft (compose) mode: no conversation exists yet. The first message creates
   *  it via `sendFirstMessage(draftVenueId, ...)` and redirects to the thread. */
  draftVenueId?: string
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  otherName,
  venueTitle,
  locale,
  draftVenueId,
}: MessageThreadProps) {
  const t = getDictionary(locale).messages
  const isHe = locale === 'he'
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [text, setText] = useState('')
  const [isSending, startSending] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const initials =
    otherName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

  // Keep the latest message in view by scrolling the messages container only —
  // never scrollIntoView, which also scrolls the window/page.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setText((prev) => prev + emoji)
      return
    }
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    setText(text.slice(0, start) + emoji + text.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  useEffect(() => {
    if (!conversationId) return
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
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev
            // Replace my own optimistic placeholder when the real row echoes back.
            if (m.sender_id === currentUserId) {
              const idx = prev.findIndex((x) => x.status === 'sending' && x.content === m.content)
              if (idx !== -1) {
                const copy = [...prev]
                copy[idx] = { ...m, status: 'sent' }
                return copy
              }
            }
            return [...prev, m]
          })
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
    if (!content) return
    // Show the message instantly with a "sending" status, then reconcile with
    // the saved row (from the action result or the realtime echo).
    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: Msg = {
      id: tempId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      status: 'sending',
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')
    startSending(async () => {
      try {
        // Draft mode: create the conversation + this message, then redirect to
        // the real thread (the redirect surfaces as a NEXT_REDIRECT error).
        if (!conversationId) {
          if (!draftVenueId) throw new Error(t.failed)
          await sendFirstMessage(draftVenueId, content)
          return
        }
        const sent = await sendMessage(conversationId, content)
        setMessages((prev) => {
          const hasReal = prev.some((x) => x.id === sent.id)
          const cleaned = prev.filter((x) => x.id !== tempId)
          return hasReal ? cleaned : [...cleaned, { ...sent, status: 'sent' as const }]
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('NEXT_REDIRECT')) throw err
        setMessages((prev) => prev.map((x) => (x.id === tempId ? { ...x, status: 'failed' } : x)))
        toast.error(msg || t.failed)
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
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          href="/messages"
          aria-label={t.backToInbox}
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Link>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{otherName}</p>
          {venueTitle && (
            <p className="truncate text-xs text-muted-foreground">
              {t.about} {venueTitle}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/30 px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{t.threadEmpty}</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === currentUserId
            const prev = messages[i - 1]
            const next = messages[i + 1]
            const showDay = !prev || !sameDay(prev.created_at, m.created_at)
            const groupStart = !prev || prev.sender_id !== m.sender_id || showDay
            const groupEnd =
              !next || next.sender_id !== m.sender_id || !sameDay(next.created_at, m.created_at)

            return (
              <Fragment key={m.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-background px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
                      {formatDateLocalized(m.created_at, locale)}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'flex items-end gap-2',
                    mine ? 'justify-end' : 'justify-start',
                    groupStart ? 'mt-3' : 'mt-0.5',
                  )}
                >
                  {!mine && (
                    <div className="w-7 shrink-0">
                      {groupEnd && (
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] px-3.5 py-2 text-sm shadow-sm',
                      mine
                        ? 'rounded-2xl bg-primary text-primary-foreground'
                        : 'rounded-2xl bg-background text-foreground',
                      groupEnd && (mine ? 'rounded-br-md' : 'rounded-bl-md'),
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>

                {groupEnd && (
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-[10px] text-muted-foreground',
                      mine ? 'justify-end' : 'ms-9',
                    )}
                  >
                    <span>{timeLabel(m.created_at)}</span>
                    {mine && m.status === 'sending' && <Clock className="h-3 w-3" aria-hidden="true" />}
                    {mine && m.status === 'failed' && (
                      <AlertCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
                    )}
                    {mine && (m.status === 'sent' || m.status === undefined) && (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    )}
                  </div>
                )}
              </Fragment>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 border-t bg-background px-4 py-3">
        <EmojiPicker onSelect={insertEmoji} label={isHe ? 'אימוג׳י' : 'Emoji'} />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t.composerPlaceholder}
          rows={1}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl"
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !text.trim()}
          size="icon"
          className="rounded-full"
          aria-label={t.send}
        >
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
