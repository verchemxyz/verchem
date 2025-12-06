'use client'

/**
 * AI Chemistry Tutor - Chat Interface
 *
 * Main chat window with message history and input
 *
 * Last Updated: 2025-12-02
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Beaker,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAiTutor } from './AiTutorProvider'
import { CALCULATOR_NAMES } from '@/lib/ai-tutor'

export function AiTutorChat() {
  const { state, closeChat, sendMessage, clearSession } = useAiTutor()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.session?.messages])

  // Focus input when chat opens
  useEffect(() => {
    if (state.isOpen) {
      inputRef.current?.focus()
    }
  }, [state.isOpen])

  // Handle send
  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return
    const message = input
    setInput('')
    await sendMessage(message)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!state.isOpen) return null

  const context = state.session?.currentContext
  const messages = state.session?.messages || []
  const quota = state.quota

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:bottom-6 sm:right-6 sm:h-[550px] sm:w-[420px] sm:rounded-2xl dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-6 w-6" />
            <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-semibold">AI Chemistry Tutor</h3>
            {quota && (
              <p className="text-xs text-white/80">
                {quota.queriesRemaining} queries remaining
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearSession}
            className="rounded-lg p-1.5 hover:bg-white/10"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={closeChat}
            className="rounded-lg p-1.5 hover:bg-white/10"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Context Badge */}
      {context && (
        <div className="flex items-center gap-2 border-b border-gray-100 bg-purple-50 px-4 py-2 text-sm dark:border-gray-800 dark:bg-purple-900/20">
          <Beaker className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-purple-700 dark:text-purple-300">
            Context: {CALCULATOR_NAMES[context.calculatorId]}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <Sparkles className="mb-3 h-12 w-12 text-purple-400" />
            <h4 className="mb-1 font-medium text-gray-700 dark:text-gray-300">
              Hi! I'm your AI Chemistry Tutor
            </h4>
            <p className="max-w-xs text-sm">
              Ask me anything about chemistry - I'll help you understand concepts
              and solve problems step by step.
            </p>
            <div className="mt-4 grid gap-2">
              {[
                'Explain how pH works',
                'Help me balance equations',
                'What is electronegativity?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          // Handle code blocks
                          code: ({ children, className }) => {
                            const isInline = !className
                            if (isInline) {
                              return (
                                <code className="rounded bg-gray-200 px-1 py-0.5 font-mono text-sm dark:bg-gray-700">
                                  {children}
                                </code>
                              )
                            }
                            return (
                              <pre className="overflow-x-auto rounded bg-gray-200 p-2 dark:bg-gray-700">
                                <code>{children}</code>
                              </pre>
                            )
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {state.isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about chemistry..."
            disabled={state.isLoading || (quota?.isOverLimit ?? false)}
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || state.isLoading || (quota?.isOverLimit ?? false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {quota?.isOverLimit && (
          <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
            Query limit reached. Upgrade for more!
          </p>
        )}
      </div>
    </div>
  )
}
