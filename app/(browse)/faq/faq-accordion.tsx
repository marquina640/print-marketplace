'use client'

import { useState } from 'react'

interface FAQItem {
  q: string
  a: React.ReactNode
}

function AccordionItem({ q, a }: FAQItem) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-ink-300 bg-ink-50/40' : 'border-warm-200 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-ink-900 text-sm leading-snug">{q}</span>
        <span className={`text-warm-400 text-lg flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-warm-600 leading-relaxed border-t border-warm-100 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

interface FAQSectionProps {
  title: string
  icon: string
  items: FAQItem[]
}

export function FAQSection({ title, icon, items }: FAQSectionProps) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900 mb-4">
        <span>{icon}</span> {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <AccordionItem key={i} {...item} />
        ))}
      </div>
    </div>
  )
}
