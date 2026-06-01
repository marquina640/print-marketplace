import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ imageUrl: null })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrintMarketHub/1.0; +https://printmarkethub.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return NextResponse.json({ imageUrl: null })

    const html = await res.text()

    // Try multiple og:image meta tag patterns
    const patterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+name=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']og:image["']/i,
    ]

    let imageUrl: string | null = null
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        imageUrl = match[1]
        break
      }
    }

    // Resolve protocol-relative URLs
    if (imageUrl?.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    }
    // Resolve root-relative URLs
    if (imageUrl?.startsWith('/')) {
      const base = new URL(url)
      imageUrl = `${base.origin}${imageUrl}`
    }

    return NextResponse.json({ imageUrl })
  } catch {
    return NextResponse.json({ imageUrl: null })
  }
}
