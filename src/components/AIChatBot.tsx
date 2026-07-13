import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Brain, PaperPlaneRight, X, Sparkle, User, Robot } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { PatternSummary, Product } from '@/lib/types'
import { insforge } from '@/lib/insforge'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatBotProps {
  products: Product[]
  patternSummary: PatternSummary[]
  isOpen: boolean
  onClose: () => void
}

export function AIChatBot({ products, patternSummary, isOpen, onClose }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Cosmo has arrived, clipboard calibrated and mildly offended by Earth produce logistics. Ask me which markdowns deserve immediate action, what patterns are forming, or where your inventory is quietly plotting against revenue.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await getAIResponse(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const getAIResponse = async (userQuery: string): Promise<string> => {
    const { data, error } = await insforge.functions.invoke<{ response?: string; error?: string }>('cosmo-chat', {
      body: {
        userQuery,
        products,
        patternSummary,
        messages: messages.slice(-6).map(message => ({
          role: message.role,
          content: message.content,
        })),
      },
    })

    if (error) {
      return `Cosmo reached the InsForge relay, but the relay filed a grievance: ${error.message}. The produce math remains immaculate; the function transmission did not.`
    }

    if (data?.error) {
      return data.error
    }

    if (!data?.response) {
      return 'Cosmo received no usable response from the server-side cognition vault. This is exactly why the Galactic Forms Office discourages empty envelopes.'
    }

    return data.response
  }

  const getSuggestedQuestions = () => [
    "What's my biggest revenue opportunity?",
    "Which products should I prioritize today?",
    "Suggest optimal discount percentages",
    "How can I reduce waste this week?"
  ]

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-6 right-6 z-50 w-96 no-print"
    >
      <Card className="overflow-hidden shadow-2xl border-2 border-primary/20">
        <div className="bg-gradient-to-r from-primary to-accent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                <Brain size={24} weight="bold" className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Cosmo</h3>
                <p className="text-xs text-white/80">Powered by FreshSave Intelligence</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X size={20} weight="bold" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary/10' 
                    : 'bg-accent/10'
                }`}>
                  {message.role === 'user' ? (
                    <User size={18} weight="bold" className="text-primary" />
                  ) : (
                    <Robot size={18} weight="bold" className="text-accent" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Robot size={18} weight="bold" className="text-accent" />
                  </div>
                  <div className="bg-muted p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Suggested Questions:</p>
                {getSuggestedQuestions().map((question, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(question)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                  >
                    <Sparkle size={14} weight="bold" className="mr-2 flex-shrink-0 text-accent" />
                    <span className="text-xs">{question}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4 bg-muted/30">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="flex-shrink-0"
            >
              <PaperPlaneRight size={18} weight="bold" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkle size={12} weight="bold" className="mr-1" />
              AI-Powered
            </Badge>
            <span className="text-xs text-muted-foreground">
              {products.length} products in context
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
