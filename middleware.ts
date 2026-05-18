import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set(['/', '/login', '/signup'])

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required by @supabase/ssr
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.has(pathname)
  const isAuthCallback = pathname.startsWith('/auth/')

  // Unauthenticated → send to login for protected routes
  if (!user && !isPublic && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Already logged in → don't show login/signup
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Authenticated route guards
  if (user && !isPublic && !isAuthCallback) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('user_id', user.id)
      .single()

    // Needs role selection — but never interrupt an admin
    if (!profile?.role && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Admin always goes straight to admin dashboard, never to onboarding/setup
    // — unless they are in preview mode, in which case let them through
    const isAdminPreviewing = profile?.role === 'admin' &&
      !!request.cookies.get('admin_preview_as')?.value

    if (profile?.role === 'admin' && !isAdminPreviewing && (pathname === '/onboarding' || pathname === '/profile/setup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/admin'
      return NextResponse.redirect(url)
    }

    // Printer owner needs to complete profile (skip this check for admin in preview mode)
    if (
      !isAdminPreviewing &&
      profile?.role === 'printer_owner' &&
      !profile.onboarding_complete &&
      pathname !== '/profile/setup' &&
      pathname !== '/onboarding'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/profile/setup'
      return NextResponse.redirect(url)
    }

    // /dashboard → role-specific dashboard
    if (pathname === '/dashboard') {
      const roleMap: Record<string, string> = {
        client: '/dashboard/client',
        printer_owner: '/dashboard/printer',
        admin: '/dashboard/admin',
      }
      const target = roleMap[profile?.role ?? '']
      if (target) {
        const url = request.nextUrl.clone()
        url.pathname = target
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
