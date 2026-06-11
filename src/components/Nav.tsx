'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, BarChart3, PlusCircle } from 'lucide-react'

const links = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/inventaire', label: 'Inventaire', icon: Package },
  { href: '/stats',      label: 'Stats',      icon: BarChart3 },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-orange-400 tracking-tight text-lg">📦 Resale Tracker</span>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${path === href ? 'bg-orange-500/15 text-orange-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <Link href="/objet/nouveau" className="btn-primary flex items-center gap-1.5 text-sm ml-2">
            <PlusCircle size={15} />
            <span className="hidden sm:inline">Ajouter</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
