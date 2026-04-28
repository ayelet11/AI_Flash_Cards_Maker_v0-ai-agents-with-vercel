'use client'

import { useState } from 'react'
import { GeneratorForm } from '@/components/generator-form'
import { FlashcardList } from '@/components/flashcard-list'
import { BookOpen } from 'lucide-react'

interface FlashcardData {
  question: string
  answer: string
}

export default function Home() {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])

  const handleReset = () => {
    setFlashcards([])
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Smart Study Cards
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Paste your notes or articles and let AI generate interactive flashcards for effective studying.
          </p>
        </header>

        {/* Main Content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {flashcards.length === 0 ? (
            <GeneratorForm onGenerate={setFlashcards} />
          ) : (
            <FlashcardList flashcards={flashcards} onReset={handleReset} />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by Gemini AI. Rate limited to 10 requests per minute.
          </p>
        </footer>
      </div>
    </main>
  )
}
