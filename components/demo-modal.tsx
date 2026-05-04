'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Play } from 'lucide-react'

export function DemoModal() {
  const [isOpen, setIsOpen] = useState(false)

  // Demo video script/storyboard text
  const demoSteps = [
    {
      title: 'Step 1: Paste Your Content',
      description: 'Copy any study material - lecture notes, Wikipedia articles, textbook chapters, or even URLs. Our AI works with any text format.',
    },
    {
      title: 'Step 2: Choose Card Count',
      description: 'Select how many flashcards you want (3-30). More cards give deeper coverage, fewer cards focus on key concepts.',
    },
    {
      title: 'Step 3: Generate with AI',
      description: 'Click "Generate Flashcards" and watch as Gemini AI creates perfectly structured Q&A pairs from your content.',
    },
    {
      title: 'Step 4: Study Interactively',
      description: 'Flip through cards, mark them as correct or needing review. Use voice mode to practice speaking answers out loud!',
    },
    {
      title: 'Step 5: Review & Export',
      description: 'Track your progress with the visual dashboard. Export your cards to Markdown for offline study or sharing.',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Watch Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">How Smart Study Cards Works</DialogTitle>
          <DialogDescription>
            Transform any content into effective study flashcards in seconds
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Video placeholder - in production this would be an actual video */}
          <div className="relative aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3 p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Demo Video Coming Soon</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Follow the step-by-step guide below to learn how to create AI-powered flashcards from any content.
                </p>
              </div>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Start Guide</h3>
            <div className="space-y-3">
              {demoSteps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Pro Tips</h4>
            <ul className="text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1 list-disc list-inside">
              <li>For best results, use well-structured content with clear concepts</li>
              <li>Try the voice mode to practice explaining answers in your own words</li>
              <li>Export to Markdown for use with Anki or other flashcard apps</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
