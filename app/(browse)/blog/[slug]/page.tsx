import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPost } from '@/lib/blog-posts'

// Content registry — add new posts here
import Post1 from './content/how-to-get-a-custom-3d-print-switzerland'
import Post2 from './content/cost-of-3d-printing-switzerland'
import Post3 from './content/thingiverse-makerworld-get-models-printed-switzerland'

const CONTENT: Record<string, React.ComponentType> = {
  'how-to-get-a-custom-3d-print-in-switzerland': Post1,
  'cost-of-3d-printing-switzerland': Post2,
  'thingiverse-makerworld-get-models-printed-switzerland': Post3,
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} — PrintMarketHub Blog`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  const Content = CONTENT[slug]

  if (!post || !Content) return notFound()

  const dateStr = new Date(post.date).toLocaleDateString('en-CH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">

      {/* Back */}
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-ink-700 transition-colors">
        ← Back to blog
      </Link>

      {/* Cover */}
      <div className={`h-48 sm:h-60 rounded-2xl bg-gradient-to-br ${post.coverBg} flex items-center justify-center shadow-sm`}>
        <span className="text-7xl">{post.coverIcon}</span>
      </div>

      {/* Meta */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="rounded-full bg-warm-100 px-3 py-1 text-xs font-semibold text-warm-600">{post.category}</span>
          <span className="text-xs text-warm-400">{post.readTime}</span>
          <span className="text-xs text-warm-400">{dateStr}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="text-warm-500 text-base leading-relaxed">{post.excerpt}</p>
      </div>

      <hr className="border-warm-200" />

      {/* Post content */}
      <Content />

      <hr className="border-warm-200" />

      {/* More posts */}
      <div>
        <p className="font-bold text-ink-900 mb-4">More from the blog</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {BLOG_POSTS.filter((p) => p.slug !== slug).map((related) => (
            <Link key={related.slug} href={`/blog/${related.slug}`}
              className="flex gap-3 rounded-xl border border-warm-200 bg-white p-4 hover:border-ink-300 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${related.coverBg} flex items-center justify-center text-xl`}>
                {related.coverIcon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-warm-400 mb-0.5">{related.category} · {related.readTime}</p>
                <p className="text-sm font-semibold text-ink-900 group-hover:text-ink-600 transition-colors leading-snug line-clamp-2">{related.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
