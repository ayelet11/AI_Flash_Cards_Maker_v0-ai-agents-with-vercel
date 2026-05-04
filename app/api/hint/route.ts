import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

function getGoogleProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey })
}

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json()

    if (!question || !answer) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP
    
    if (!apiKey) {
      // Demo mode hint - provide a basic hint based on the answer
      const words = answer.split(/\s+/)
      const keyWord = words.length > 3 ? words[Math.floor(words.length / 2)] : words[0]
      return Response.json({
        hint: `Think about "${keyWord}"...`,
        demo: true,
      })
    }

    const google = getGoogleProvider(apiKey)

    const prompt = `You are a helpful study assistant. A student is trying to answer a flashcard question but needs a hint.

Question: ${question}

Correct Answer: ${answer}

Provide a helpful hint that:
1. Does NOT reveal the answer directly
2. Points the student in the right direction
3. Mentions a key concept or gives a partial clue
4. Is encouraging and supportive
5. Is 1-2 sentences maximum

Generate a helpful hint:`

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    })

    return Response.json({
      hint: result.text.trim(),
      demo: false,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return Response.json(
      { error: `Failed to generate hint: ${errorMessage}` },
      { status: 500 }
    )
  }
}
