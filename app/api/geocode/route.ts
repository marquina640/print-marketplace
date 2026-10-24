import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 })

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PrintMarketHub/1.0 (contact@printmarkethub.com)' },
    })
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (data[0]) {
      return NextResponse.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Geocode failed' }, { status: 500 })
  }
}
