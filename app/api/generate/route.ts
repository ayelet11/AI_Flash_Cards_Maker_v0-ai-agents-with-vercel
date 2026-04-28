import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { z } from 'zod'

// Helper to create a Google provider with a specific API key
function getGoogleProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey })
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Rate limit: 10 requests per minute per IP
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
})

const FlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  // Get IP for rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  
  const { success, remaining, reset } = await ratelimit.limit(ip)
  
  if (!success) {
    return Response.json(
      { 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: 0,
        resetAt: reset,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }

  try {
    const { content, cardCount = 5 } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 15000) {
      return Response.json({ error: 'Content too long. Maximum 15,000 characters.' }, { status: 400 })
    }

    // Debug: Log which env vars are present
    const primaryKeyExists = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const backupKeyExists = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP
    console.log('[v0] Environment check:', { 
      primaryKeyExists, 
      backupKeyExists,
      primaryKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length ?? 0,
      backupKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP?.length ?? 0,
    })

    // Demo mode: generate sample flashcards when API key is not configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const words = content.split(/\s+/).filter(w => w.length > 4)
      const demoFlashcards = Array.from({ length: Math.min(cardCount, 5) }, (_, i) => ({
        question: `What is the significance of "${words[i * 2] || 'this concept'}" in the provided text?`,
        answer: `This is a demo flashcard. Add your GOOGLE_GENERATIVE_AI_API_KEY in project settings to generate real AI-powered flashcards from your content.`,
      }))

      return Response.json({
        flashcards: demoFlashcards,
        remaining,
        demo: true,
        debug: { primaryKeyExists, backupKeyExists },
      }, {
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        }
      })
    }

    // Collect available API keys
    const apiKeys: string[] = []
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      apiKeys.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    }
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP) {
      apiKeys.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP)
    }

    const prompt = `You are an expert educator creating study flashcards. Analyze the following content and create ${cardCount} high-quality flashcards.

Rules:
- Each flashcard should have a clear, specific question
- Answers should be concise but complete (1-3 sentences)
- Focus on key concepts, definitions, and important facts
- Questions should test understanding, not just memorization
- Vary question types: "What is...", "How does...", "Why...", "Explain..."
- If the content contains mathematical formulas or symbols, explain them in plain language

Content to analyze:
${content}

Generate exactly ${cardCount} flashcards.`

    // Try each key until one works
    let lastError: Error | null = null
    for (const apiKey of apiKeys) {
      try {
        const google = getGoogleProvider(apiKey)
        const result = await generateText({
          model: google('gemini-2.0-flash'),
          output: Output.object({ schema: FlashcardSchema }),
          prompt,
        })

        return Response.json({
          flashcards: result.output?.flashcards ?? [],
          remaining,
          demo: false,
        }, {
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          }
        })
      } catch (error) {
        lastError = error as Error
        // If rate limited (429) or quota exceeded, try next key
        const errorMessage = String(error)
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.log('[v0] API key rate limited, trying backup key...')
          continue
        }
        // For other errors, throw immediately
        throw error
      }
    }

    // All keys exhausted
    console.error('All API keys exhausted:', lastError)
    return Response.json(
      { error: 'API quota exceeded on all keys. Please try again later.' },
      { status: 429 }
    )
  } catch (error) {
    console.error('Error generating flashcards:', error)
    return Response.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    )
  }
}
