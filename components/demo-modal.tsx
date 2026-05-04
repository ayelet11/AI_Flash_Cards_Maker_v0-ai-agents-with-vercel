'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Play } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function DemoModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  // Demo video script/storyboard text - using translations
  const demoSteps = [
    {
      title: t('demo.step1.title'),
      description: t('demo.step1.desc'),
    },
    {
      title: t('demo.step2.title'),
      description: t('demo.step2.desc'),
    },
    {
      title: t('demo.step3.title'),
      description: t('demo.step3.desc'),
    },
    {
      title: t('demo.step4.title'),
      description: t('demo.step4.desc'),
    },
    {
      title: t('demo.step5.title'),
      description: t('demo.step5.desc'),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          {t('demo.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('demo.title')}</DialogTitle>
          <DialogDescription>
            {t('demo.description')}
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
                <p className="text-lg font-medium text-foreground">{t('demo.videoPlaceholder')}</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t('demo.videoSubtext')}
                </p>
              </div>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('demo.quickStart')}</h3>
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
            <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">{t('demo.proTips')}</h4>
            <ul className="text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1 list-disc list-inside">
              <li>{t('demo.tip1')}</li>
              <li>{t('demo.tip2')}</li>
              <li>{t('demo.tip3')}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
