import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Location defaults (Zurich focus) ─────────────────────
export const DEFAULT_LOCATION = 'Zurich, Switzerland'
export const DEFAULT_CITY = 'Zurich'
export const DEFAULT_LAT = 47.3769
export const DEFAULT_LNG = 8.5417

// ── Materials & Colors ────────────────────────────────────
export const MATERIALS = [
  'Suggest the best one',
  'PLA', 'ABS', 'PETG', 'TPU', 'ASA', 'Nylon',
  'Resin (Standard)', 'Resin (ABS-Like)',
  'Carbon Fiber PLA', 'Wood PLA', 'Metal PLA', 'Other',
]

export const COLORS = [
  'Multicolour',
  'Black', 'White', 'Gray', 'Red', 'Blue', 'Green',
  'Yellow', 'Orange', 'Purple', 'Pink', 'Brown',
  'Transparent', 'Natural/Beige', 'Silver/Metallic', 'Gold', 'Other',
]

// ── Printer brands → models ───────────────────────────────
export const PRINTER_BRANDS: Record<string, string[]> = {
  'Bambu Lab':    ['X2D', 'H2D', 'H2S', 'H2S Ultra', 'H2C', 'P2S', 'P1S', 'P1P', 'X1 Carbon', 'X1 Carbon Combo', 'X1E', 'A1', 'A1 Combo', 'A1 Mini', 'A1 Mini Combo'],
  'Prusa':        ['CORE One L', 'CORE One+', 'XL', 'MK4S', 'MK4', 'MK3.5', 'SL1S Speed', 'MINI+', 'Pro'],
  'Creality':     ['Ender 3 S1 Pro', 'Ender 3 V3', 'Ender 3 V3 KE', 'K1', 'K1 Max', 'K2 Plus', 'CR-10 Smart Pro'],
  'Voron':        ['0.2', '2.4', 'Switchwire', 'Trident'],
  'Elegoo':       ['Mars 4', 'Mars 4 Max', 'Mars 4 Ultra', 'Neptune 4', 'Neptune 4 Max', 'Neptune 4 Pro', 'Saturn 4', 'Saturn 4 Ultra'],
  'Anycubic':     ['Kobra 2 Max', 'Kobra 2 Neo', 'Kobra 3', 'Photon M3 Max', 'Photon Mono M5S', 'Photon Mono M7 Pro'],
  'Ultimaker':    ['Factor 4', 'S3', 'S5', 'S7 Pro Bundle'],
  'Formlabs':     ['Form 3', 'Form 3+', 'Form 3BL', 'Form 4', 'Form 4L'],
  'Raise3D':      ['E2', 'E2CF', 'Pro3', 'Pro3 Plus'],
  'FlashForge':   ['Adventurer 5M', 'Adventurer 5M Pro', 'Creator Pro 2', 'Guider 3 Ultra'],
  'Artillery':    ['Genius Pro', 'Hornet', 'Sidewinder X4 Plus'],
  'Phrozen':      ['Sonic Mega 8K S', 'Sonic Mini 8K S', 'Transform'],
  'Markforged':   ['Mark Two', 'Onyx One', 'Onyx Pro'],
  'Other / DIY':  ['Custom Build', 'RepRap', 'Other'],
}

export const ALL_PRINTER_BRAND_NAMES = Object.keys(PRINTER_BRANDS)

export const SWISS_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'zurich':             { lat: 47.3769, lng: 8.5417 },
  'zürich':             { lat: 47.3769, lng: 8.5417 },
  'bern':               { lat: 46.9481, lng: 7.4474 },
  'basel':              { lat: 47.5596, lng: 7.5886 },
  'geneva':             { lat: 46.2044, lng: 6.1432 },
  'genève':             { lat: 46.2044, lng: 6.1432 },
  'lausanne':           { lat: 46.5197, lng: 6.6323 },
  'winterthur':         { lat: 47.4988, lng: 8.7242 },
  'lucerne':            { lat: 47.0502, lng: 8.3093 },
  'luzern':             { lat: 47.0502, lng: 8.3093 },
  'st. gallen':         { lat: 47.4245, lng: 9.3767 },
  'st gallen':          { lat: 47.4245, lng: 9.3767 },
  'lugano':             { lat: 46.0037, lng: 8.9511 },
  'biel':               { lat: 47.1368, lng: 7.2467 },
  'thun':               { lat: 46.7583, lng: 7.6278 },
  'schaffhausen':       { lat: 47.6965, lng: 8.6339 },
  'fribourg':           { lat: 46.8066, lng: 7.1620 },
  'freiburg':           { lat: 46.8066, lng: 7.1620 },
  'chur':               { lat: 46.8499, lng: 9.5329 },
  'neuchâtel':          { lat: 46.9899, lng: 6.9293 },
  'neuchatel':          { lat: 46.9899, lng: 6.9293 },
  'zug':                { lat: 47.1660, lng: 8.5158 },
  'sion':               { lat: 46.2274, lng: 7.3605 },
  'uster':              { lat: 47.3516, lng: 8.7197 },
  'la chaux-de-fonds':  { lat: 47.0971, lng: 6.8264 },
  'yverdon':            { lat: 46.7785, lng: 6.6412 },
  'kriens':             { lat: 47.0355, lng: 8.2809 },
  'emmen':              { lat: 47.0738, lng: 8.2985 },
  'horgen':             { lat: 47.2598, lng: 8.5980 },
  'thalwil':            { lat: 47.2930, lng: 8.5637 },
  'arbon':              { lat: 47.5141, lng: 9.4337 },
  'aarau':              { lat: 47.3925, lng: 8.0514 },
  'frenkendorf':        { lat: 47.5085, lng: 7.7115 },
  'solothurn':          { lat: 47.2088, lng: 7.5323 },
  'brugg':              { lat: 47.4832, lng: 8.2063 },
}

export function cityToCoords(city: string | null | undefined): { lat: number; lng: number } | null {
  if (!city) return null
  return SWISS_CITY_COORDS[city.toLowerCase().trim()] ?? null
}

/** Geocode an address string using OpenStreetMap Nominatim (no API key needed) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PrintMarketHub/1.0 (contact@printmarkethub.com)' },
    })
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    return null
  } catch {
    return null
  }
}

// ── Certification system ──────────────────────────────────
export const CERTIFICATION_LEVELS = [
  {
    level: 0,
    name: 'Community Maker',
    shortName: 'Community',
    description: 'Hobby-level printing. Decorative parts, figurines, consumer prints.',
    color: 'warm' as const,
    icon: '◎',
  },
  {
    level: 1,
    name: 'Verified Maker',
    shortName: 'Verified',
    description: 'Passed PrintMarketHub quality inspection. Suitable for functional parts and reliable consumer products.',
    color: 'ink' as const,
    icon: '✓',
  },
  {
    level: 2,
    name: 'Engineering Maker',
    shortName: 'Engineering',
    description: 'Calibrated machines, engineering materials, tolerance validation. For prototypes and mechanical parts.',
    color: 'gold' as const,
    icon: '◆',
  },
  {
    level: 3,
    name: 'Engineering Maker',
    shortName: 'Engineering+',
    description: 'Elite manufacturing. Batch production, fulfillment, enterprise-grade workflows.',
    color: 'violet' as const,
    icon: '★',
  },
] as const

export function getCertificationLevel(level: number) {
  return CERTIFICATION_LEVELS[Math.min(Math.max(level ?? 0, 0), 3)]
}

// ── Job classification ────────────────────────────────────
export const JOB_TYPES = [
  {
    value: 'decorative',
    label: 'Decorative',
    description: 'Visual models, figurines, display pieces. Precision not critical.',
    hint: 'Toys · Art · Props · Display',
    minCertLevel: 0,
    color: 'warm' as const,
    icon: '◻',
  },
  {
    value: 'functional',
    label: 'Functional',
    description: 'Parts that need to work — enclosures, mounts, brackets. Moderate precision.',
    hint: 'Housings · Brackets · Clips · Mounts',
    minCertLevel: 0,
    color: 'ink' as const,
    icon: '⬡',
  },
  {
    value: 'engineering',
    label: 'Engineering',
    description: 'Tolerance-critical components. Prototypes, mechanisms, assemblies. ±0.2 mm or better required.',
    hint: 'Robotics · Fixtures · Tooling · Mechanisms',
    minCertLevel: 1,
    color: 'gold' as const,
    icon: '◈',
  },
  {
    value: 'production',
    label: 'Production',
    description: 'Batch manufacturing, repeat orders, fulfillment workflows.',
    hint: 'Small batch · Repeat orders · Fulfillment',
    minCertLevel: 2,
    color: 'violet' as const,
    icon: '◉',
  },
] as const

export type JobType = typeof JOB_TYPES[number]['value']

export function getJobType(value: string) {
  return JOB_TYPES.find((t) => t.value === value) ?? JOB_TYPES[0]
}

// ── Manufacturing processes ───────────────────────────────
export const MANUFACTURING_PROCESSES = [
  { value: 'fdm',          label: 'FDM Printing',       description: 'Fused filament — PLA, PETG, ABS, etc.',       available: true  },
  { value: 'resin',        label: 'Resin (SLA/MSLA)',   description: 'High detail, smooth finish',                  available: true  },
  { value: 'sls',          label: 'SLS (Powder)',        description: 'Nylon sintering — strong, no supports',       available: true  },
  { value: 'cnc',          label: 'CNC Machining',       description: 'Subtractive machining — coming soon',         available: false },
  { value: 'laser',        label: 'Laser Cutting',       description: 'Flat sheet cutting & engraving — coming soon', available: false },
  { value: 'sheet_metal',  label: 'Sheet Metal',         description: 'Bending, punching, forming — coming soon',    available: false },
  { value: 'other',        label: 'Other',               description: 'Other process',                               available: true  },
] as const

export type ManufacturingProcess = typeof MANUFACTURING_PROCESSES[number]['value']

// ── Benchmark test parts ──────────────────────────────────
export const BENCHMARK_REQUIREMENTS: Record<number, {
  title: string
  parts: { name: string; purpose: string; criteria: string[] }[]
  extras: string[]
}> = {
  1: {
    title: 'Verified Quality — Level 1',
    parts: [
      {
        name: 'Calibration Cube (20×20×20 mm)',
        purpose: 'Dimensional accuracy and first-layer quality',
        criteria: ['All faces within ±0.3 mm', 'No warping or lifting', 'Clean top surface', 'Sharp edges'],
      },
      {
        name: 'Overhang Test',
        purpose: 'Overhang and cooling performance',
        criteria: ['Clean 30°, 45°, 60° overhangs', 'No excessive drooping at 60°', 'Good surface on all angles'],
      },
      {
        name: 'Bridge Test (25 mm)',
        purpose: 'Bridging and retraction quality',
        criteria: ['Bridge sag under 1 mm', 'No stringing across gap', 'Smooth underside'],
      },
      {
        name: 'Surface Finish Panel (80×80×5 mm)',
        purpose: 'Top surface and side wall quality',
        criteria: ['No gaps or holes in top layer', 'Consistent layer lines on sides', 'No blobs or zits'],
      },
    ],
    extras: [
      'Print all parts in PLA or your primary material',
      'Use your normal print settings — do not tune just for testing',
      'Photograph each part from multiple angles with a ruler or coin for scale',
    ],
  },
  2: {
    title: 'Engineering Certified — Level 2',
    parts: [
      {
        name: 'All Level 1 parts (re-print in engineering material)',
        purpose: 'Baseline capability in PETG, ABS, ASA, Nylon, or similar',
        criteria: ['All Level 1 criteria met', 'In an engineering-grade material'],
      },
      {
        name: 'Threaded Test (M5 external thread + captured M5 nut)',
        purpose: 'Thread print capability and tolerance',
        criteria: ['M5 nut fits without post-processing', 'External thread engages smoothly', 'No cross-threading'],
      },
      {
        name: 'Tolerance Gauge (0.1 / 0.2 / 0.3 / 0.4 mm slots)',
        purpose: 'Dimensional tolerance stack and fine feature resolution',
        criteria: ['0.3 mm and 0.4 mm slots pass a 0.3 mm feeler gauge', '0.1 mm slot may be fused (acceptable)', 'No layer delamination'],
      },
      {
        name: 'Snap-Fit Assembly',
        purpose: 'Flex and living-hinge capability',
        criteria: ['Cantilever snaps and releases 10+ times without failure', 'Arm deflects without cracking'],
      },
      {
        name: 'Thin Wall Test (0.4 / 0.8 / 1.2 / 1.6 mm walls)',
        purpose: 'Fine wall resolution',
        criteria: ['0.8 mm and above stand freely', 'No gaps between perimeters', '0.4 mm wall acceptable if machine-limited'],
      },
    ],
    extras: [
      'Include caliper measurements of the tolerance gauge slots (photo of calipers on part)',
      'Document your material brand, grade, and drying procedure',
      'Include machine settings screenshot (layer height, temp, speed, infill)',
      'All parts must be printed on the same machine you listed in your profile',
    ],
  },
  3: {
    title: 'Production Partner — Level 3',
    parts: [
      {
        name: 'Batch of 10 identical Calibration Cubes',
        purpose: 'Repeatability across a production run',
        criteria: ['All 10 within ±0.3 mm of each other', 'All 10 pass Level 1 criteria', 'No rejects'],
      },
      {
        name: 'All Level 2 parts (single set)',
        purpose: 'Engineering capability maintained',
        criteria: ['All Level 2 criteria met'],
      },
    ],
    extras: [
      'Provide a measurement report: caliper readings for all 10 cubes (X, Y, Z)',
      'Include a machine maintenance log (last maintenance date, nozzle age, bed condition)',
      'Provide print time and estimated cost per unit for the calibration cube batch',
      'Document packaging and shipping methodology',
      'Production Partner approval includes a 2-week trial period with real jobs',
    ],
  },
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    open:        'bg-emerald-100 text-emerald-800',
    quoted:      'bg-ink-100 text-ink-800',
    accepted:    'bg-violet-100 text-violet-800',
    in_progress: 'bg-amber-100 text-amber-800',
    completed:   'bg-warm-100 text-warm-700',
    cancelled:   'bg-red-100 text-red-800',
    pending:     'bg-amber-100 text-amber-800',
    rejected:    'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-warm-100 text-warm-700'
}
