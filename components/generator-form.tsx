'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertCircle, Sparkles, Link, FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface GeneratorFormProps {
  onGenerate: (flashcards: { question: string; answer: string }[], isDemo: boolean) => void
}

export function GeneratorForm({ onGenerate }: GeneratorFormProps) {
  const { t } = useLanguage()
  const [inputMode, setInputMode] = useState<'text' | 'link'>('text')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [cardCount, setCardCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [extractedFrom, setExtractedFrom] = useState<string | null>(null)

  const handleExtractFromUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setError(null)
    setIsExtracting(true)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract content')
      }

      setContent(data.text)
      setExtractedFrom(data.sourceUrl)
      setInputMode('text') // Switch to text mode to show extracted content
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract content from URL')
    } finally {
      setIsExtracting(false)
    }
  }

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
      {/* Input Mode Toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">{t('form.inputSource')}</Label>
        <RadioGroup
          value={inputMode}
          onValueChange={(value) => setInputMode(value as 'text' | 'link')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text-mode" />
            <Label htmlFor="text-mode" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              {t('form.pasteText')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id="link-mode" />
            <Label htmlFor="link-mode" className="flex items-center gap-2 cursor-pointer">
              <Link className="h-4 w-4" />
              {t('form.fromUrl')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* URL Input */}
      {inputMode === 'link' && (
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-medium text-foreground">
            {t('form.urlLabel')}
          </Label>
          <div className="flex gap-2">
            <Input
              id="url"
              type="url"
              placeholder={t('form.urlPlaceholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleExtractFromUrl}
              disabled={isExtracting || !url.trim()}
            >
              {isExtracting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('form.extracting')}
                </>
              ) : (
                t('form.extract')
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('form.urlHint')}
          </p>
        </div>
      )}

      {/* Text Content */}
      <div className="space-y-2">
        <label
          htmlFor="content"
          className="text-sm font-medium text-foreground"
        >
          {inputMode === 'link' ? t('form.contentLabelExtracted') : t('form.contentLabel')}
        </label>
        {extractedFrom && (
          <p className="text-xs text-muted-foreground">
            {t('form.extractedFrom')} <a href={extractedFrom} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{extractedFrom}</a>
          </p>
        )}
        <Textarea
          id="content"
          placeholder={t('form.contentPlaceholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-y"
          maxLength={maxChars}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} {t('form.characters')}
          </span>
          {remaining !== null && (
            <span>{remaining} {t('form.requestsRemaining')}</span>
          )}
        </div>
      </div>

      {/* Card Count Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t('form.cardCount')}
          </label>
          <span className="text-sm font-medium text-primary">{cardCount}</span>
        </div>
        <Slider
          value={[cardCount]}
          onValueChange={([value]) => setCardCount(value)}
          min={3}
          max={30}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 {t('form.cards')}</span>
          <span>30 {t('form.cards')}</span>
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
            {t('form.generating')}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {t('form.generate')}
          </>
        )}
      </Button>

      {content.trim().length > 0 && content.trim().length < 50 && (
        <p className="text-center text-xs text-muted-foreground">
          {t('form.minChars')}
        </p>
      )}
    </form>
  )
}
