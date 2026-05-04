'use client'

import { useState } from 'react'
import { GeneratorForm } from '@/components/generator-form'
import { StudySession } from '@/components/study-session'
import { DemoModal } from '@/components/demo-modal'
import { LanguageSelector } from '@/components/language-selector'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen } from 'lucide-react'

interface FlashcardData {
  question: string
  answer: string
}

export default function Home() {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const { t } = useLanguage()

  const handleGenerate = (cards: FlashcardData[], demo: boolean) => {
    setFlashcards(cards)
    setIsDemo(demo)
  }

  const handleReset = () => {
    setFlashcards([])
    setIsDemo(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <header className="mb-10 text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageSelector />
          </div>
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('app.title')}
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            {t('app.subtitle')}
          </p>
          <div className="mt-4">
            <DemoModal />
          </div>
        </header>

        {/* Main Content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {flashcards.length === 0 ? (
            <GeneratorForm onGenerate={handleGenerate} />
          ) : (
            <>
              {isDemo && (
                <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 sm:p-4 text-center text-xs sm:text-sm text-amber-700 dark:text-amber-400 break-words">
                  <span className="font-medium">{t('demo.warning')}</span> Add your <code className="bg-amber-500/20 px-1 rounded text-[10px] sm:text-xs break-all">GOOGLE_GENERATIVE_AI_API_KEY</code> {t('demo.warningText')}
                </div>
              )}
              <StudySession flashcards={flashcards} onReset={handleReset} />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('app.footer')}
          </p>
        </footer>
      </div>
    </main>
  )
}
