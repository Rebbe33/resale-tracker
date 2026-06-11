'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ItemSummary } from '@/types'
import { formatEur, savings10, PLATFORMS } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, PiggyBank, ShoppingBag, Package } from 'lucide-react'

export default function Stats() {
  const [summaries, setSummaries] = useState<ItemSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('rv_item_summary').select('*').then(({ data }) => {
      setSummaries(data ?? [])
      setLoading(false)
    })
  }, [])

  const sold = summaries.filter(s => s.status === 'vendu' && s.net_profit != null)
  const totalProfit = sold.reduce((acc, s) => acc + (s.net_profit ?? 0), 0)
  const totalRevenue = sold.reduce((acc, s) => acc + (s.sold_price ?? 0), 0)
  const totalInvested = summaries.reduce((acc, s) => acc + s.purchase_price + s.total_costs, 0)
  const avgProfit = sold.length > 0 ? totalProfit / sold.length : 0
  const savingsAmount = savings10(totalProfit)
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const platformData = PLATFORMS.map(p => ({
    name: p.label, color: p.color,
    profit: sold.filter(s => s.sold_platform === p.value).reduce((acc, s) => acc + (s.net_profit ?? 0), 0),
    count: sold.filter(s => s.sold_platform === p.value).length,
  })).filter(p => p.count > 0).sort((a, b) => b.profit - a.profit)

  const catMap: Record<string, number> = {}
  sold.forEach(s => { const cat = s.category ?? 'Non catégorisé'; catMap[cat] = (catMap[cat] ?? 0) + (s.net_profit ?? 0) })
  const categoryData = Object.entries(catMap).map(([name, profit]) => ({ name, profit })).sort((a, b) => b.profit - a.profit)

  const monthMap: Record<string, number> = {}
  sold.forEach(s => {
    if (!s.sold_at) return
    const d = new Date(s.sold_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] ?? 0) + (s.net_profit ?? 0)
  })
  const monthData = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([key, profit]) => {
    const [y, m] = key.split('-')
    return { name: new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), profit }
  })

  const top5 = [...sold].sort((a, b) => (b.net_profit ?? 0) - (a.net_profit ?? 0)).slice(0, 5)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
          <p className="text-zinc-400 mb-1">{label}</p>
          <p className="font-bold text-orange-400">{formatEur(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="text-center text-zinc-500 py-20">Chargement…</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-zinc-500 text-sm mt-1">{sold.length} vente{sold.length !== 1 ? 's' : ''} analysées</p>
      </div>

      {sold.length === 0 ? (
        <div className="card text-center py-12 text-zinc-500">
          <Package size={40} className="mx-auto mb-3 text-zinc-700" />
          <p>Pas encore de ventes enregistrées.</p>
          <p className="text-sm mt-1">Les stats apparaîtront dès ta première vente.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Bénéfice net total" value={formatEur(totalProfit)} accent icon={<TrendingUp size={16} />} />
            <StatCard label="Épargne à virer (10%)" value={formatEur(savingsAmount)} icon={<PiggyBank size={16} />} />
            <StatCard label="CA total" value={formatEur(totalRevenue)} icon={<ShoppingBag size={16} />} />
            <StatCard label="Investi total" value={formatEur(totalInvested)} />
            <StatCard label="Bénéfice moyen/vente" value={formatEur(avgProfit)} />
            <StatCard label="Marge bénéficiaire" value={`${profitMargin.toFixed(1)}%`} />
          </div>

          {savingsAmount > 0 && (
            <div className="card border-green-500/30 bg-green-500/5 flex items-center gap-4">
              <PiggyBank size={32} className="text-green-400 shrink-0" />
              <div>
                <p className="font-semibold text-green-300 text-lg">Vire <span className="font-bold">{formatEur(savingsAmount)}</span> sur ton compte épargne</p>
                <p className="text-sm text-zinc-500">= 10% de tes {formatEur(totalProfit)} de bénéfices nets cumulés</p>
              </div>
            </div>
          )}

          {monthData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-zinc-300 mb-4">Bénéfices par mois</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatEur(v)} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {platformData.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-zinc-300 mb-4">Par plateforme</h2>
                <div className="space-y-3">
                  {platformData.map(p => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: p.color }} className="font-medium">{p.name}</span>
                        <span className="text-zinc-300">{formatEur(p.profit)} · {p.count} vente{p.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.profit / platformData[0].profit) * 100}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {categoryData.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-zinc-300 mb-4">Par catégorie</h2>
                <div className="space-y-3">
                  {categoryData.map((c, i) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">{c.name}</span>
                        <span className="text-zinc-300">{formatEur(c.profit)}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${(c.profit / categoryData[0].profit) * 100}%`, opacity: 1 - i * 0.12 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-zinc-300 mb-4">Top 5 ventes les plus profitables</h2>
            <div className="space-y-2">
              {top5.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xl font-bold text-zinc-700 w-8 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500">{s.category} · {s.sold_platform}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-green-400">{formatEur(s.net_profit ?? 0)}</p>
                    <p className="text-xs text-zinc-500">{formatEur(s.sold_price ?? 0)} vendu</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
