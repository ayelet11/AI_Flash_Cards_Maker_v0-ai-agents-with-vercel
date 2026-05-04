import * as cheerio from 'cheerio'

// Transform Google Workspace URLs to their export endpoints
function transformGoogleUrl(url: string): { url: string; isGoogleExport: boolean } {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    
    // Google Docs: docs.google.com/document/d/{ID}/...
    if (hostname === 'docs.google.com' && parsed.pathname.includes('/document/d/')) {
      const match = parsed.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
      if (match) {
        return {
          url: `https://docs.google.com/document/d/${match[1]}/export?format=txt`,
          isGoogleExport: true
        }
      }
    }
    
    // Google Slides: docs.google.com/presentation/d/{ID}/...
    if (hostname === 'docs.google.com' && parsed.pathname.includes('/presentation/d/')) {
      const match = parsed.pathname.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
      if (match) {
        return {
          url: `https://docs.google.com/presentation/d/${match[1]}/export?format=txt`,
          isGoogleExport: true
        }
      }
    }
    
    // Google Sheets: docs.google.com/spreadsheets/d/{ID}/...
    if (hostname === 'docs.google.com' && parsed.pathname.includes('/spreadsheets/d/')) {
      const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
      if (match) {
        return {
          url: `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`,
          isGoogleExport: true
        }
      }
    }
    
    return { url, isGoogleExport: false }
  } catch {
    return { url, isGoogleExport: false }
  }
}

// Block private/internal IP ranges to prevent SSRF
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true
    }
    
    // Block private IP ranges
    const privatePatterns = [
      /^10\./,           // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,     // 192.168.0.0/16
      /^169\.254\./,     // Link-local
      /^0\./,            // 0.0.0.0/8
    ]
    
    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return true
      }
    }
    
    return false
  } catch {
    return true // If URL parsing fails, block it
  }
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const MAX_CONTENT_LENGTH = 100 * 1024 // 100KB
const MAX_TEXT_LENGTH = 15000 // Same as our text input limit

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    
    console.log('[v0] URL extraction requested:', url)
    
    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }
    
    if (!isValidUrl(url)) {
      return Response.json({ error: 'Invalid URL. Only http and https URLs are allowed.' }, { status: 400 })
    }
    
    if (isPrivateUrl(url)) {
      return Response.json({ error: 'Access to private/internal URLs is not allowed.' }, { status: 403 })
    }
    
    // Transform Google Workspace URLs to export endpoints
    const { url: fetchUrl, isGoogleExport } = transformGoogleUrl(url)
    console.log('[v0] Fetch URL:', fetchUrl, 'isGoogleExport:', isGoogleExport)
    
    // Fetch the URL with timeout and size limit
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    let response: Response
    try {
      response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'StudyCardsBot/1.0 (Educational content extractor)',
        },
        redirect: 'follow',
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log('[v0] Fetch error:', fetchError)
      return Response.json({ error: 'Failed to fetch URL. The website may be unavailable or blocking requests.' }, { status: 502 })
    }
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.log('[v0] HTTP error:', response.status)
      return Response.json({ error: `Failed to fetch URL: HTTP ${response.status}` }, { status: 502 })
    }
    
    // Check content type - allow more types for Google exports
    const contentType = response.headers.get('content-type') || ''
    const allowedTypes = ['text/html', 'text/plain', 'text/csv', 'application/csv']
    const isAllowedType = allowedTypes.some(type => contentType.includes(type))
    
    if (!isAllowedType && !isGoogleExport) {
      return Response.json({ error: 'URL must point to an HTML or text page.' }, { status: 400 })
    }
    
    // Check content length
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      return Response.json({ error: 'Page content is too large (max 100KB).' }, { status: 400 })
    }
    
    // Read content with size limit
    const reader = response.body?.getReader()
    if (!reader) {
      return Response.json({ error: 'Failed to read response body.' }, { status: 500 })
    }
    
    let totalSize = 0
    const chunks: Uint8Array[] = []
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      totalSize += value.length
      if (totalSize > MAX_CONTENT_LENGTH) {
        reader.cancel()
        return Response.json({ error: 'Page content is too large (max 100KB).' }, { status: 400 })
      }
      
      chunks.push(value)
    }
    
    const rawContent = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
    console.log('[v0] Content fetched, length:', rawContent.length)
    
    let mainContent: string
    
    // For Google exports (plain text/CSV), use content directly
    if (isGoogleExport) {
      mainContent = rawContent
    } else {
      // Parse HTML and extract text
      const $ = cheerio.load(rawContent)
      
      // Remove script, style, nav, footer, header elements
      $('script, style, nav, footer, header, aside, iframe, noscript').remove()
      
      // Get main content - try article, main, or body
      mainContent = $('article').text() || $('main').text() || $('body').text()
    }
    
    // Clean up whitespace
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    
    // Truncate to max length
    if (mainContent.length > MAX_TEXT_LENGTH) {
      mainContent = mainContent.slice(0, MAX_TEXT_LENGTH)
      console.log('[v0] Text truncated to', MAX_TEXT_LENGTH, 'characters')
    }
    
    console.log('[v0] Extracted text length:', mainContent.length)
    
    if (mainContent.length < 50) {
      return Response.json({ error: 'Could not extract enough text content from the URL.' }, { status: 400 })
    }
    
    return Response.json({ 
      text: mainContent,
      sourceUrl: url,
      extractedLength: mainContent.length,
    })
    
  } catch (error) {
    console.error('[v0] URL extraction error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return Response.json(
      { error: `Failed to extract content: ${errorMessage}` },
      { status: 500 }
    )
  }
}
