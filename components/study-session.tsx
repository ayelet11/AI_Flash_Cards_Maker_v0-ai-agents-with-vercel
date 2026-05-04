'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Download, RotateCcw, Check, RefreshCw, ChevronLeft, ChevronRight, Mic, MicOff, Volume2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { Celebration } from '@/components/celebration'

// Gradient border colors that cycle: teal, orange, green, blue, yellow, purple
const gradientBorders = [
  'from-teal-500 via-teal-400 to-teal-300',
  'from-orange-500 via-orange-400 to-orange-300',
  'from-green-500 via-green-400 to-green-300',
  'from-blue-500 via-blue-400 to-blue-300',
  'from-yellow-500 via-yellow-400 to-yellow-300',
  'from-purple-500 via-purple-400 to-purple-300',
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

  console.log('[v0] Voice support check:', { isSupported, voiceMode })

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
    console.log('[v0] Evaluating spoken answer:', transcript.slice(0, 100))

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
      console.log('[v0] Evaluation response:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate')
      }

      setEvaluation(data)
    } catch (err) {
      console.error('[v0] Evaluation error:', err)
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-4">
            You&apos;ve reviewed all {flashcards.length} cards.
          </p>
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            {correctCount} / {flashcards.length} marked as correct
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Set
          </Button>
          <Button onClick={exportToMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Export MD
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
            {isReviewMode ? 'Review Mode' : 'Study Session'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Card {currentPosition + 1} of {totalInCurrentMode}
            {isReviewMode && ` (reviewing ${reviewCards.length} cards)`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={voiceMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVoiceMode(!voiceMode)}
            disabled={!isSupported}
            title={!isSupported ? 'Voice mode not supported in this browser' : voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
            className={!isSupported ? 'opacity-50' : ''}
          >
            <Volume2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{voiceMode ? 'Voice' : 'Voice'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">New</span>
          </Button>
          <Button size="sm" onClick={exportToMarkdown}>
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Export</span>
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{correctCount} correct</span>
          <span className="text-amber-600 dark:text-amber-400">{reviewCount} to review</span>
          <span>{unseenCount} remaining</span>
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
          <div className={cn(
            'absolute inset-0 rounded-xl p-1 bg-gradient-to-br',
            gradientBorders[actualIndex % gradientBorders.length]
          )}>
            <div className="backface-hidden h-full rounded-lg bg-card p-5 flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-2">
                Card {actualIndex + 1} - Question
              </span>
              <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <p className="text-center text-lg text-foreground font-medium">
                  {currentCard.question}
                </p>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-2">
                {voiceMode ? 'Speak your answer, then check' : 'Click to reveal answer'}
              </span>
            </div>
          </div>

          {/* Back - Answer */}
          <div className={cn(
            'absolute inset-0 rotate-y-180 rounded-xl p-1 bg-gradient-to-br',
            gradientBorders[actualIndex % gradientBorders.length]
          )}>
            <div className="backface-hidden h-full rounded-lg bg-card p-5 flex flex-col">
              <span className="text-xs font-medium text-primary mb-2">
                Card {actualIndex + 1} - Answer
              </span>
              <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <p className="text-center text-foreground">
                  {currentCard.answer}
                </p>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-2">
                Click to see question
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
                  Getting hint...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get a Hint
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
            <span className="text-sm font-medium">Listen and Correct Me</span>
            <Button
              size="sm"
              variant={isListening ? 'destructive' : 'default'}
              onClick={handleVoiceToggle}
              disabled={isEvaluating}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Speaking
                </>
              )}
            </Button>
          </div>

          {/* Transcript display */}
          {(transcript || isListening) && (
            <div className="rounded-md border border-border bg-background p-3 min-h-[60px]">
              <p className="text-sm text-foreground">
                {transcript || (isListening ? 'Listening...' : '')}
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
              Evaluating your answer...
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
                  {evaluation.isCorrect ? 'Good job!' : 'Keep practicing'}
                </span>
                <span className="text-sm font-medium">
                  Score: {evaluation.score}/100
                </span>
              </div>
              <p className="text-sm text-foreground">{evaluation.feedback}</p>
              {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Missing points:</p>
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
                Show Correct Answer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation and marking buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          disabled={currentPosition === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={() => markCard('review')}
            disabled={!isFlipped && !evaluation}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ask Again
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => markCard('correct')}
            disabled={!isFlipped && !evaluation}
          >
            <Check className="h-4 w-4 mr-2" />
            Correct
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentPosition === totalInCurrentMode - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {voiceMode 
          ? 'Speak your answer, get AI feedback, then mark as Correct or Ask Again'
          : 'Flip the card, then mark as Correct or Ask Again'}
      </p>
    </div>
  )
}
