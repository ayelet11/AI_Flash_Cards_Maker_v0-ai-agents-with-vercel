'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Track finalized text separately to avoid duplication
  const finalizedTextRef = useRef('')

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        // Process all results from the beginning to build complete transcript
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        // Update finalized text ref when we have final results
        if (finalTranscript) {
          finalizedTextRef.current = finalTranscript
        }

        // Display: finalized text + current interim text
        setTranscript(finalizedTextRef.current + interimTranscript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('[v0] Speech recognition error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    setError(null)
    setTranscript('')
    finalizedTextRef.current = ''
    
    try {
      recognitionRef.current.start()
      setIsListening(true)
      console.log('[v0] Started listening')
    } catch (err) {
      console.error('[v0] Failed to start listening:', err)
      setError('Failed to start voice recognition')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    recognitionRef.current.stop()
    setIsListening(false)
    console.log('[v0] Stopped listening')
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    finalizedTextRef.current = ''
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
