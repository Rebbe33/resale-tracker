'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ItemSummary, ItemStatus } from '@/types'
import { formatEur, formatDate, CATEGORIES } from '@/lib/utils'
import { ItemStatusBadge } from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import { Search, ChevronRight, PlusCircle } from 'lucide-react'

const STATUS_OPTIONS: { value: ItemStatus | 'tous'; label: string }[] = [
  { value: 'tous',     label: 'Tous' },
  { value: 'en_stock', label: 'En stock' },
  { value: 'en_vente', label: 'En vente' },
  { value: 'vendu',    label: 'Vendus' },
  { value: 'archivé',  label: 'Archivés' },
]

function InventaireInner() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ItemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ItemStatus | 'tous'>((searchParams.get('status') as ItemStatus) ?? 'tous')
  const [category, setCategory] = useState('toutes')
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'prix'>('date')

  useEffect(() => {
    supabase.from('rv_item_summary').select('*').then(({ data }) => {
      setItems(data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = items
    .filter(i => status === 'tous' || i.status === status)
    .filter(i => category === 'toutes' || i.category === category)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'profit') return (b.net_profit ?? -9999) - (a.net_profit ?? -9999)
      if (sortBy === 'prix') return (b.purchase_price + b.total_costs) - (a.purchase_price + a.total_costs)
      return new Date(b.acquisition_date).getTime() - new Date(a.acquisition_date).getTime()
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventaire</h1>
        <Link href="/objet/nouveau" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> Ajouter
        </Link>
      </div>
      <div className="card space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="pl-9" placeholder="Rechercher un objet…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setStatus(s.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${status === s.value ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="flex-1 min-w-[140px]" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="toutes">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="flex-1 min-w-[140px]" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            <option value="date">Trier par date</option>
            <option value="profit">Trier par bénéfice</option>
            <option value="prix">Trier par prix investi</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-zinc-500 py-16">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-zinc-500">Aucun objet trouvé.</p>
          <Link href="/objet/nouveau" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle size={15} /> Ajouter un objet
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Link key={item.id} href={`/objet/${item.id}`}
              className="card flex items-center justify-between hover:border-zinc-600 transition-colors group">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-zinc-100 truncate">{item.name}</p>
                  <ItemStatusBadge status={item.status} />
                  {item.category && <span className="badge bg-zinc-800 text-zinc-400">{item.category}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                  <span>{formatDate(item.acquisition_date)}</span>
                  <span>Acheté {formatEur(item.purchase_price)}</span>
                  <span>Frais {formatEur(item.total_costs)}</span>
                  {item.sold_platform && <PlatformBadge platform={item.sold_platform} />}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {item.net_profit != null ? (
                  <div className="text-right">
                    <p className={`font-bold text-sm ${item.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.net_profit >= 0 ? '+' : ''}{formatEur(item.net_profit)}
                    </p>
                    <p className="text-xs text-zinc-500">{formatEur(item.sold_price ?? 0)} vendu</p>
                  </div>
                ) : <p className="text-xs text-zinc-600">—</p>}
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Inventaire() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500 py-20">Chargement…</div>}>
      <InventaireInner />
    </Suspense>
  )
}
