'use client'

import { Flashcard } from './flashcard'
import { Button } from '@/components/ui/button'
import { Download, RotateCcw } from 'lucide-react'

interface FlashcardData {
  question: string
  answer: string
}

interface FlashcardListProps {
  flashcards: FlashcardData[]
  onReset: () => void
}

export function FlashcardList({ flashcards, onReset }: FlashcardListProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Your Flashcards ({flashcards.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Set
          </Button>
          <Button size="sm" onClick={exportToMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Export MD
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {flashcards.map((card, index) => (
          <div key={index} className="max-w-xs mx-auto w-full">
            <Flashcard
              question={card.question}
              answer={card.answer}
              index={index}
            />
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Click any card to flip and reveal the answer
      </p>
    </div>
  )
}
