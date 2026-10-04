import { NextRequest, NextResponse } from 'next/server'

// Block private/internal hostnames to prevent SSRF
function isSafeUrl(raw: string): boolean {
  let parsed: URL
  try { parsed = new URL(raw) } catch { return false }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  const host = parsed.hostname.toLowerCase()
  // Block localhost variants
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
  // Block link-local / AWS metadata
  if (host.startsWith('169.254.')) return false
  // Block RFC-1918 private ranges
  if (host.startsWith('10.')) return false
  if (host.startsWith('192.168.')) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
  // Block .internal / .local / .localhost TLDs
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) return false
  return true
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ imageUrl: null })

  if (!isSafeUrl(url)) return NextResponse.json({ imageUrl: null })

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
