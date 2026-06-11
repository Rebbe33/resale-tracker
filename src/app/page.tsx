'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ItemSummary } from '@/types'
import { formatEur, formatDate, savings10, PLATFORMS } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import PlatformBadge from '@/components/PlatformBadge'
import { TrendingUp, PiggyBank, ShoppingBag, Clock, ChevronRight } from 'lucide-react'

export default function Dashboard() {
  const [summaries, setSummaries] = useState<ItemSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('rv_item_summary').select('*').then(({ data }) => {
      setSummaries(data ?? [])
      setLoading(false)
    })
  }, [])

  const sold = summaries.filter(s => s.status === 'vendu')
  const inSale = summaries.filter(s => s.status === 'en_vente')
  const inStock = summaries.filter(s => s.status === 'en_stock')

  const totalRevenue = sold.reduce((acc, s) => acc + (s.sold_price ?? 0), 0)
  const totalProfit = sold.reduce((acc, s) => acc + (s.net_profit ?? 0), 0)
  const totalInvested = summaries.reduce((acc, s) => acc + s.purchase_price + s.total_costs, 0)
  const savingsAmount = savings10(totalProfit)

  const platformProfits: Record<string, number> = {}
  sold.forEach(s => {
    if (s.sold_platform) {
      platformProfits[s.sold_platform] = (platformProfits[s.sold_platform] ?? 0) + (s.net_profit ?? 0)
    }
  })

  const recentSales = [...sold]
    .sort((a, b) => new Date(b.sold_at ?? 0).getTime() - new Date(a.sold_at ?? 0).getTime())
    .slice(0, 5)

  if (loading) return <div className="text-zinc-500 py-20 text-center">Chargement…</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Tableau de bord</h1>
        <p className="text-zinc-500 text-sm mt-1">{summaries.length} objet{summaries.length !== 1 ? 's' : ''} au total</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Bénéfice net total" value={formatEur(totalProfit)} sub={`sur ${sold.length} vente${sold.length !== 1 ? 's' : ''}`} accent icon={<TrendingUp size={16} />} />
        <StatCard label="Épargne (10%)" value={formatEur(savingsAmount)} sub="à virer sur ton compte épargne" icon={<PiggyBank size={16} />} />
        <StatCard label="Chiffre d'affaires" value={formatEur(totalRevenue)} sub="revenus bruts" icon={<ShoppingBag size={16} />} />
        <StatCard label="Total investi" value={formatEur(totalInvested)} sub="achats + frais divers" icon={<Clock size={16} />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En stock', count: inStock.length, color: 'text-zinc-300' },
          { label: 'En vente', count: inSale.length,  color: 'text-blue-400' },
          { label: 'Vendus',   count: sold.length,    color: 'text-green-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card text-center">
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {totalProfit > 0 && (
        <div className="card border-green-500/30 bg-green-500/5 flex items-center gap-4">
          <PiggyBank size={32} className="text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-300">
              Vire <span className="text-xl">{formatEur(savingsAmount)}</span> sur ton compte épargne
            </p>
            <p className="text-sm text-zinc-500">= 10% de tes {formatEur(totalProfit)} de bénéfices nets</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-200">Dernières ventes</h2>
            <Link href="/inventaire" className="text-xs text-orange-400 hover:underline">Voir tout</Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-zinc-500 text-sm">Pas encore de ventes.</p>
          ) : recentSales.map(s => (
            <Link key={s.id} href={`/objet/${s.id}`}
              className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 hover:text-orange-300 transition-colors group">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.sold_at ? formatDate(s.sold_at) : ''} · {s.sold_platform}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-sm font-semibold text-green-400">{formatEur(s.net_profit ?? 0)}</p>
                  <p className="text-xs text-zinc-500">{formatEur(s.sold_price ?? 0)} vendu</p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 group-hover:text-orange-400" />
              </div>
            </Link>
          ))}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-zinc-200">Plateformes</h2>
          {Object.keys(platformProfits).length === 0 ? (
            <p className="text-zinc-500 text-sm">Pas encore de données.</p>
          ) : PLATFORMS.filter(p => platformProfits[p.value] !== undefined).map(p => {
            const profit = platformProfits[p.value] ?? 0
            const maxProfit = Math.max(...Object.values(platformProfits))
            return (
              <div key={p.value} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: p.color }} className="font-medium">{p.label}</span>
                  <span className="text-zinc-300">{formatEur(profit)}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(profit / maxProfit) * 100}%`, backgroundColor: p.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
