'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FlashcardProps {
  question: string
  answer: string
  index: number
}

export function Flashcard({ question, answer, index }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="group perspective-1000 h-48 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-500 transform-style-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        {/* Front - Question */}
        <div className="absolute inset-0 backface-hidden rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <span className="text-xs font-medium text-muted-foreground mb-2">
            Card {index + 1} - Question
          </span>
          <p className="flex-1 flex items-center justify-center text-center text-foreground font-medium">
            {question}
          </p>
          <span className="text-xs text-muted-foreground text-center mt-2">
            Click to reveal answer
          </span>
        </div>

        {/* Back - Answer */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm flex flex-col">
          <span className="text-xs font-medium text-primary mb-2">
            Card {index + 1} - Answer
          </span>
          <p className="flex-1 flex items-center justify-center text-center text-foreground">
            {answer}
          </p>
          <span className="text-xs text-muted-foreground text-center mt-2">
            Click to see question
          </span>
        </div>
      </div>
    </div>
  )
}
