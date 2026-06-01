import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Blog — PrintMarketHub',
  description: 'Guides, tutorials, and pricing breakdowns for 3D printing in Switzerland.',
}

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-ink-900 tracking-tight">Blog</h1>
        <p className="text-warm-500">Guides, pricing breakdowns, and tutorials for getting the most out of 3D printing in Switzerland.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-warm-200 bg-white overflow-hidden hover:border-ink-300 hover:shadow-md transition-all">
            {/* Cover */}
            <div className={`h-32 bg-gradient-to-br ${post.coverBg} flex items-center justify-center`}>
              <span className="text-5xl">{post.coverIcon}</span>
            </div>
            {/* Content */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-semibold text-warm-600">{post.category}</span>
                <span className="text-xs text-warm-400">{post.readTime}</span>
              </div>
              <h2 className="font-bold text-ink-900 text-sm leading-snug group-hover:text-ink-600 transition-colors">{post.title}</h2>
              <p className="text-xs text-warm-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
              <p className="text-xs text-warm-400 pt-1">{new Date(post.date).toLocaleDateString('en-CH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
