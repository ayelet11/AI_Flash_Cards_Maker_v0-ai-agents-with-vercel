'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Sparkles } from 'lucide-react'

interface GeneratorFormProps {
  onGenerate: (flashcards: { question: string; answer: string }[], isDemo: boolean) => void
}

export function GeneratorForm({ onGenerate }: GeneratorFormProps) {
  const [content, setContent] = useState('')
  const [cardCount, setCardCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, cardCount }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      setRemaining(data.remaining)
      onGenerate(data.flashcards, data.demo === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const charCount = content.length
  const maxChars = 15000

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="content"
          className="text-sm font-medium text-foreground"
        >
          Paste your notes, article, or study material
        </label>
        <Textarea
          id="content"
          placeholder="Paste your study material here... This could be lecture notes, a Wikipedia article, textbook content, or any text you want to learn from."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-y"
          maxLength={maxChars}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
          </span>
          {remaining !== null && (
            <span>{remaining} requests remaining this minute</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Number of flashcards
          </label>
          <span className="text-sm font-medium text-primary">{cardCount}</span>
        </div>
        <Slider
          value={[cardCount]}
          onValueChange={([value]) => setCardCount(value)}
          min={3}
          max={15}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 cards</span>
          <span>15 cards</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || content.trim().length < 50}
      >
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Flashcards
          </>
        )}
      </Button>

      {content.trim().length > 0 && content.trim().length < 50 && (
        <p className="text-center text-xs text-muted-foreground">
          Please enter at least 50 characters of content
        </p>
      )}
    </form>
  )
}
