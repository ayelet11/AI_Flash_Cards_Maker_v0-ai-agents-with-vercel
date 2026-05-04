'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FlashcardProps {
  question: string
  answer: string
  index: number
}

// Gradient border colors that cycle: teal, orange, green, blue, yellow, purple
const gradientBorders = [
  'from-teal-500 via-teal-400 to-teal-300',
  'from-orange-500 via-orange-400 to-orange-300',
  'from-green-500 via-green-400 to-green-300',
  'from-blue-500 via-blue-400 to-blue-300',
  'from-yellow-500 via-yellow-400 to-yellow-300',
  'from-purple-500 via-purple-400 to-purple-300',
]

export function Flashcard({ question, answer, index }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const gradientClass = gradientBorders[index % gradientBorders.length]

  return (
    <div
      className="group perspective-1000 h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
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
          gradientClass
        )}>
          <div className="backface-hidden h-full rounded-lg bg-card p-5 flex flex-col">
            <span className="text-xs font-medium text-muted-foreground mb-2">
              Card {index + 1} - Question
            </span>
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
              <p className="text-center text-foreground font-medium">
                {question}
              </p>
            </div>
            <span className="text-xs text-muted-foreground text-center mt-2">
              Click to reveal answer
            </span>
          </div>
        </div>

        {/* Back - Answer */}
        <div className={cn(
          'absolute inset-0 rotate-y-180 rounded-xl p-1 bg-gradient-to-br',
          gradientClass
        )}>
          <div className="backface-hidden h-full rounded-lg bg-card p-5 flex flex-col">
            <span className="text-xs font-medium text-primary mb-2">
              Card {index + 1} - Answer
            </span>
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
              <p className="text-center text-foreground">
                {answer}
              </p>
            </div>
            <span className="text-xs text-muted-foreground text-center mt-2">
              Click to see question
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
