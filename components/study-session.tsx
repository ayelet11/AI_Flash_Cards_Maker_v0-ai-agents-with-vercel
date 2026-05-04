'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Download, RotateCcw, Check, RefreshCw, ChevronLeft, ChevronRight, Mic, MicOff, Volume2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { Celebration } from '@/components/celebration'
import { useLanguage } from '@/contexts/language-context'

// Gradient border colors that cycle through a variety of hues
const gradientBorders = [
  'from-teal-500 via-teal-400 to-teal-300',
  'from-orange-500 via-orange-400 to-orange-300',
  'from-green-500 via-green-400 to-green-300',
  'from-blue-500 via-blue-400 to-blue-300',
  'from-yellow-500 via-yellow-400 to-yellow-300',
  'from-purple-500 via-purple-400 to-purple-300',
  'from-rose-500 via-rose-400 to-rose-300',
  'from-amber-500 via-amber-400 to-amber-300',
  'from-indigo-500 via-indigo-400 to-indigo-300',
  'from-cyan-500 via-cyan-400 to-cyan-300',
  'from-emerald-500 via-emerald-400 to-emerald-300',
  'from-fuchsia-500 via-fuchsia-400 to-fuchsia-300',
]

interface FlashcardData {
  question: string
  answer: string
}

interface StudySessionProps {
  flashcards: FlashcardData[]
  onReset: () => void
}

type CardStatus = 'unseen' | 'correct' | 'review'

interface Evaluation {
  isCorrect: boolean
  score: number
  feedback: string
  missingPoints: string[] | null
  suggestions: string | null
}

export function StudySession({ flashcards, onReset }: StudySessionProps) {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardStatuses, setCardStatuses] = useState<CardStatus[]>(() => 
    flashcards.map(() => 'unseen')
  )
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [voiceMode, setVoiceMode] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)

  const { isListening, transcript, error: voiceError, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput()

  // Get current card based on mode
  const currentCards = isReviewMode ? reviewCards : flashcards.map((_, i) => i)
  const actualIndex = isReviewMode ? reviewCards[reviewIndex] : currentIndex
  const currentCard = flashcards[actualIndex]
  const totalInCurrentMode = currentCards.length
  const currentPosition = isReviewMode ? reviewIndex : currentIndex

  const correctCount = cardStatuses.filter(s => s === 'correct').length
  const reviewCount = cardStatuses.filter(s => s === 'review').length
  const unseenCount = cardStatuses.filter(s => s === 'unseen').length
  const progress = ((flashcards.length - unseenCount) / flashcards.length) * 100



  const getHint = async () => {
    if (hint || isLoadingHint) return
    
    setIsLoadingHint(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCard.question,
          answer: currentCard.answer,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get hint')
      }

      setHint(data.hint)
    } catch {
      // Silently fail - hint is optional
    } finally {
      setIsLoadingHint(false)
    }
  }

  const evaluateAnswer = async () => {
    if (!transcript.trim()) {
      return
    }

    setIsEvaluating(true)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: transcript,
          correctAnswer: currentCard.answer,
          question: currentCard.question,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate')
      }

      setEvaluation(data)
    } catch {
      // Silently fail - evaluation is optional
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
      // Auto-evaluate after stopping
      setTimeout(() => {
        if (transcript.trim()) {
          evaluateAnswer()
        }
      }, 500)
    } else {
      resetTranscript()
      setEvaluation(null)
      startListening()
    }
  }

  const markCard = useCallback((status: 'correct' | 'review') => {
    const newStatuses = [...cardStatuses]
    newStatuses[actualIndex] = status
    setCardStatuses(newStatuses)


    // Reset voice state and hint
    resetTranscript()
    setEvaluation(null)
    setHint(null)
    setIsFlipped(false)
    
    if (isReviewMode) {
      if (reviewIndex < reviewCards.length - 1) {
        setReviewIndex(reviewIndex + 1)
      } else {
        const stillToReview = newStatuses
          .map((s, i) => s === 'review' ? i : -1)
          .filter(i => i !== -1)
        
        if (stillToReview.length > 0) {
          setReviewCards(stillToReview)
          setReviewIndex(0)
        } else {
          setIsReviewMode(false)
        }
      }
    } else {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        const toReview = newStatuses
          .map((s, i) => s === 'review' ? i : -1)
          .filter(i => i !== -1)
        
        if (toReview.length > 0) {
          setReviewCards(toReview)
          setReviewIndex(0)
          setIsReviewMode(true)
        }
      }
    }
  }, [cardStatuses, actualIndex, currentIndex, flashcards.length, isReviewMode, reviewIndex, reviewCards, resetTranscript])

  const goToPrevious = () => {
    setIsFlipped(false)
    resetTranscript()
    setEvaluation(null)
    setHint(null)
    if (isReviewMode) {
      if (reviewIndex > 0) setReviewIndex(reviewIndex - 1)
    } else {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    setIsFlipped(false)
    resetTranscript()
    setEvaluation(null)
    setHint(null)
    if (isReviewMode) {
      if (reviewIndex < reviewCards.length - 1) setReviewIndex(reviewIndex + 1)
    } else {
      if (currentIndex < flashcards.length - 1) setCurrentIndex(currentIndex + 1)
    }
  }

  const exportToMarkdown = () => {
    const markdown = flashcards
      .map(
        (card, i) =>
          `## Card ${i + 1}\n\n**Q:** ${card.question}\n\n**A:** ${card.answer}\n`
      )
      .join('\n---\n\n')

    const blob = new Blob([`# Study Flashcards\n\n${markdown}`], {
      type: 'text/markdown',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flashcards.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allComplete = unseenCount === 0 && reviewCount === 0

  if (allComplete) {
    return (
      <div className="space-y-6 text-center">
        <Celebration isActive={allComplete} />
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('complete.title')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('complete.reviewed', { count: flashcards.length })}
          </p>
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            {t('complete.score', { correct: correctCount, total: flashcards.length })}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('complete.newSet')}
          </Button>
          <Button onClick={exportToMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            {t('complete.exportMd')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isReviewMode ? t('study.reviewMode') : t('study.studySession')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('study.cardOf', { current: currentPosition + 1, total: totalInCurrentMode })}
            {isReviewMode && ` ${t('study.reviewing', { count: reviewCards.length })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={voiceMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVoiceMode(!voiceMode)}
            disabled={!isSupported}
            title={!isSupported ? t('voice.notSupported') : t('study.voice')}
            className={!isSupported ? 'opacity-50' : ''}
          >
            <Volume2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('study.voice')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('study.new')}</span>
          </Button>
          <Button size="sm" onClick={exportToMarkdown}>
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('study.export')}</span>
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{correctCount} {t('study.correct')}</span>
          <span className="text-amber-600 dark:text-amber-400">{reviewCount} {t('study.toReview')}</span>
          <span>{unseenCount} {t('study.remaining')}</span>
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="perspective-1000 h-72 cursor-pointer max-w-xl mx-auto"
        onClick={() => !voiceMode && setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-500 transform-style-3d',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front - Question */}
          <div 
            className={cn(
              'absolute inset-0 rounded-xl p-1 bg-gradient-to-br',
              gradientBorders[actualIndex % gradientBorders.length]
            )}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="h-full rounded-lg bg-card p-5 flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-2">
                {t('study.cardOf', { current: actualIndex + 1, total: flashcards.length })} - {t('study.question')}
              </span>
              <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <p className="text-center text-lg text-foreground font-medium">
                  {currentCard.question}
                </p>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-2">
                {voiceMode ? t('study.speakAnswer') : t('study.clickToReveal')}
              </span>
            </div>
          </div>

          {/* Back - Answer */}
          <div 
            className={cn(
              'absolute inset-0 rounded-xl p-1 bg-gradient-to-br',
              gradientBorders[actualIndex % gradientBorders.length]
            )}
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="h-full rounded-lg bg-card p-5 flex flex-col">
              <span className="text-xs font-medium text-primary mb-2">
                {t('study.cardOf', { current: actualIndex + 1, total: flashcards.length })} - {t('study.answer')}
              </span>
              <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <p className="text-center text-foreground">
                  {currentCard.answer}
                </p>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-2">
                {t('study.clickToSeeQuestion')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hint section - only show when card is not flipped */}
      {!isFlipped && (
        <div className="flex flex-col items-center gap-3 max-w-xl mx-auto">
          {!hint ? (
            <Button
              variant="outline"
              size="sm"
              onClick={getHint}
              disabled={isLoadingHint}
              className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            >
              {isLoadingHint ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  {t('study.gettingHint')}
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {t('study.getHint')}
                </>
              )}
            </Button>
          ) : (
            <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{hint}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice input section */}
      {voiceMode && !isFlipped && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('voice.title')}</span>
            <Button
              size="sm"
              variant={isListening ? 'destructive' : 'default'}
              onClick={handleVoiceToggle}
              disabled={isEvaluating}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  {t('voice.stop')}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  {t('voice.start')}
                </>
              )}
            </Button>
          </div>

          {/* Transcript display */}
          {(transcript || isListening) && (
            <div className="rounded-md border border-border bg-background p-3 min-h-[60px]">
              <p className="text-sm text-foreground">
                {transcript || (isListening ? t('voice.listening') : '')}
              </p>
            </div>
          )}

          {voiceError && (
            <p className="text-sm text-destructive">{voiceError}</p>
          )}

          {/* Evaluation loading */}
          {isEvaluating && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              {t('voice.evaluating')}
            </div>
          )}

          {/* Evaluation result */}
          {evaluation && (
            <div className={cn(
              'rounded-lg border p-4 space-y-2',
              evaluation.isCorrect 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-amber-500/30 bg-amber-500/10'
            )}>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'font-medium',
                  evaluation.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {evaluation.isCorrect ? t('voice.goodJob') : t('voice.keepPracticing')}
                </span>
                <span className="text-sm font-medium">
                  {t('voice.score')} {evaluation.score}/100
                </span>
              </div>
              <p className="text-sm text-foreground">{evaluation.feedback}</p>
              {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">{t('voice.missingPoints')}</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {evaluation.missingPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setIsFlipped(true)}
              >
                {t('voice.showAnswer')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation and marking buttons */}
      <div className="flex flex-col gap-4">
        {/* Main action buttons - always visible */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={() => markCard('review')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('study.askAgain')}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => markCard('correct')}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('study.markCorrect')}
          </Button>
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPosition === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('study.previous')}
          </Button>

          <span className="text-xs text-muted-foreground">
            {cardStatuses[actualIndex] === 'unseen' ? t('study.notMarked') : 
             cardStatuses[actualIndex] === 'correct' ? t('study.markedCorrect') : t('study.markedReview')}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentPosition === totalInCurrentMode - 1}
          >
            {t('study.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {voiceMode 
          ? t('study.voiceInstruction')
          : t('study.flipInstruction')}
      </p>
      
      {/* Hint about completion */}
      {unseenCount > 0 && unseenCount < flashcards.length && (
        <p className="text-center text-xs text-amber-600 dark:text-amber-400">
          {t('study.completionHint', { count: unseenCount })}
        </p>
      )}
    </div>
  )
}
