'use client'

import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Image from 'next/image'

interface CelebrationProps {
  isActive: boolean
}

export function Celebration({ isActive }: CelebrationProps) {
  const [showCharacter, setShowCharacter] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (isActive && !hasRun.current) {
      hasRun.current = true
      
      // Fire confetti from both sides
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          setShowCharacter(true)
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        // Confetti from left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ff6b6b', '#ffa94d', '#51cf66', '#339af0', '#ffd43b', '#cc5de8'],
        })
        
        // Confetti from right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#ff6b6b', '#ffa94d', '#51cf66', '#339af0', '#ffd43b', '#cc5de8'],
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isActive])

  // Reset when not active
  useEffect(() => {
    if (!isActive) {
      hasRun.current = false
      setShowCharacter(false)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="flex justify-center my-4">
      {showCharacter && (
        <div className="animate-bounce">
          <Image
            src="/images/celebration-character.jpg"
            alt="Celebration bunny bouncing on trampoline"
            width={200}
            height={200}
            className="rounded-xl shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
