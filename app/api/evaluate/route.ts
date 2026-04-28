import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

function getGoogleProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey })
}

const EvaluationSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  missingPoints: z.array(z.string()).nullable(),
  suggestions: z.string().nullable(),
})

export async function POST(req: Request) {
  try {
    const { userAnswer, correctAnswer, question } = await req.json()

    console.log('[v0] Evaluating answer:', { 
      questionLength: question?.length,
      userAnswerLength: userAnswer?.length,
      correctAnswerLength: correctAnswer?.length 
    })

    if (!userAnswer || !correctAnswer || !question) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP
    
    if (!apiKey) {
      // Demo mode evaluation
      const words = userAnswer.toLowerCase().split(/\s+/)
      const correctWords = correctAnswer.toLowerCase().split(/\s+/)
      const matchCount = words.filter((w: string) => correctWords.includes(w)).length
      const score = Math.min(100, Math.round((matchCount / correctWords.length) * 100))
      
      return Response.json({
        isCorrect: score >= 60,
        score,
        feedback: 'Demo mode: Add your API key for AI-powered evaluation.',
        missingPoints: null,
        suggestions: null,
        demo: true,
      })
    }

    const google = getGoogleProvider(apiKey)

    const prompt = `You are an educator evaluating a student's spoken answer. Be encouraging but accurate.

Question: ${question}

Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Evaluate if the student's answer captures the main points of the correct answer. Consider:
- The student spoke this answer, so minor wording differences are expected
- Focus on conceptual understanding, not exact wording
- Be lenient with phrasing but strict on factual accuracy

Provide:
1. isCorrect: true if the answer demonstrates understanding of the key concepts (score >= 60)
2. score: 0-100 based on how well they captured the main points
3. feedback: A brief, encouraging assessment (1-2 sentences)
4. missingPoints: Array of key points they missed (if any)
5. suggestions: How they could improve their answer (if needed)`

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      output: Output.object({ schema: EvaluationSchema }),
      prompt,
    })

    console.log('[v0] Evaluation result:', result.output)

    return Response.json({
      ...result.output,
      demo: false,
    })

  } catch (error) {
    console.error('[v0] Evaluation error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return Response.json(
      { error: `Failed to evaluate answer: ${errorMessage}` },
      { status: 500 }
    )
  }
}
