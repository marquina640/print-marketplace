export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  coverIcon: string
  coverBg: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-get-a-custom-3d-print-in-switzerland',
    title: 'How to Get a Custom 3D Print in Switzerland (Without Owning a Printer)',
    excerpt: 'You have a design - or you found one on Thingiverse - and you want it printed. Here are all your options in Switzerland and how to choose the right one.',
    date: '2025-05-20',
    readTime: '5 min read',
    category: 'Guide',
    coverIcon: '🖨️',
    coverBg: 'from-blue-600 to-indigo-700',
  },
  {
    slug: 'cost-of-3d-printing-switzerland',
    title: 'What Does a Custom 3D Print Cost in Switzerland in 2025?',
    excerpt: 'Pricing for 3D printing varies wildly. Here\'s a clear breakdown of what affects cost, typical price ranges by material, and how to get a fair quote.',
    date: '2025-05-27',
    readTime: '4 min read',
    category: 'Pricing',
    coverIcon: '💰',
    coverBg: 'from-emerald-500 to-teal-600',
  },
  {
    slug: 'thingiverse-makerworld-get-models-printed-switzerland',
    title: 'From Thingiverse to Your Door: Getting 3D Models Printed in Switzerland',
    excerpt: 'Found the perfect model on Thingiverse or MakerWorld but don\'t have a printer? Here\'s how to go from download link to finished part - step by step.',
    date: '2025-06-01',
    readTime: '4 min read',
    category: 'Tutorial',
    coverIcon: '📦',
    coverBg: 'from-orange-500 to-amber-600',
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
