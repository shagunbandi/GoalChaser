import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Developer Documentation',
  description: 'Plugin SDK API reference and component library for Goal Chaser',
}

const docLinks = [
  {
    title: 'Component Library',
    description: 'SDK UI components, states, and analytics with live examples',
    href: '/developer/documentation/storybook/index.html',
    icon: '📚',
  },
  {
    title: 'API Reference',
    description: 'TypeScript types, interfaces, hooks, and services',
    href: '/developer/documentation/api/index.html',
    icon: '📖',
  },
]

export default function DeveloperDocumentationPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="text-2xl font-semibold text-white/95 mb-2">
          Developer Documentation
        </h1>
        <p className="text-white/60 text-sm mb-10">
          Plugin SDK reference for Goal Chaser. Use the links below to open the
          component library (Storybook) or the API docs (TypeDoc).
        </p>
        <ul className="space-y-4">
          {docLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="
                  flex items-start gap-4 p-5 rounded-2xl
                  bg-white/3 border border-white/8
                  hover:bg-white/6 hover:border-white/12
                  transition-all duration-200
                "
              >
                <span className="text-2xl" aria-hidden>
                  {link.icon}
                </span>
                <div>
                  <span className="font-medium text-white/90 block mb-1">
                    {link.title}
                  </span>
                  <span className="text-sm text-white/50">{link.description}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
