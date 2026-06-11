'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Item, Cost, Listing, Sale, PriceHistory, Platform } from '@/types'
import { formatEur, formatDate, PLATFORMS, COST_LABELS } from '@/lib/utils'
import { ItemStatusBadge, ListingStatusBadge } from '@/components/StatusBadge'
import PlatformBadge from '@/components/PlatformBadge'
import { ArrowLeft, Plus, Trash2, TrendingDown, ShoppingCart, ExternalLink, PiggyBank } from 'lucide-react'

export default function ObjetDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [sale, setSale] = useState<Sale | null>(null)
  const [priceHistories, setPriceHistories] = useState<Record<string, PriceHistory[]>>({})
  const [loading, setLoading] = useState(true)
  const [showCostForm, setShowCostForm] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [showPriceForm, setShowPriceForm] = useState<string | null>(null)
  const [costLabel, setCostLabel] = useState(COST_LABELS[0])
  const [costAmount, setCostAmount] = useState('')
  const [costDate, setCostDate] = useState(new Date().toISOString().split('T')[0])
  const [listPlatform, setListPlatform] = useState<Platform>('vinted')
  const [listPrice, setListPrice] = useState('')
  const [listUrl, setListUrl] = useState('')
  const [salePlatform, setSalePlatform] = useState<Platform>('vinted')
  const [salePrice, setSalePrice] = useState('')
  const [saleFees, setSaleFees] = useState('0')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleListingId, setSaleListingId] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [priceReason, setPriceReason] = useState('')

  async function load() {
    const [itemRes, costsRes, listingsRes, saleRes] = await Promise.all([
      supabase.from('rv_items').select('*').eq('id', id).single(),
      supabase.from('rv_costs').select('*').eq('item_id', id).order('date', { ascending: false }),
      supabase.from('rv_listings').select('*').eq('item_id', id).order('listed_at', { ascending: false }),
      supabase.from('rv_sales').select('*').eq('item_id', id).maybeSingle(),
    ])
    setItem(itemRes.data)
    setCosts(costsRes.data ?? [])
    setListings(listingsRes.data ?? [])
    setSale(saleRes.data)
    const listingIds = (listingsRes.data ?? []).map((l: Listing) => l.id)
    if (listingIds.length > 0) {
      const { data: ph } = await supabase.from('rv_price_history').select('*').in('listing_id', listingIds).order('changed_at', { ascending: false })
      const grouped: Record<string, PriceHistory[]> = {}
      ;(ph ?? []).forEach((p: PriceHistory) => { grouped[p.listing_id] = [...(grouped[p.listing_id] ?? []), p] })
      setPriceHistories(grouped)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0)
  const invested = (item?.purchase_price ?? 0) + totalCosts
  const netProfit = sale ? sale.sold_price - sale.platform_fees - invested : null

  async function saveCost() {
    if (!costAmount) return
    await supabase.from('rv_costs').insert({ item_id: id, label: costLabel, amount: parseFloat(costAmount), date: costDate })
    setCostAmount(''); setShowCostForm(false); load()
  }
  async function deleteCost(costId: string) {
    await supabase.from('rv_costs').delete().eq('id', costId); load()
  }
  async function saveListing() {
    if (!listPrice) return
    await supabase.from('rv_listings').insert({ item_id: id, platform: listPlatform, initial_price: parseFloat(listPrice), current_price: parseFloat(listPrice), url: listUrl || null, status: 'actif' })
    await supabase.from('rv_items').update({ status: 'en_vente' }).eq('id', id)
    setListPrice(''); setListUrl(''); setShowListingForm(false); load()
  }
  async function updateListingStatus(listingId: string, status: string) {
    await supabase.from('rv_listings').update({ status }).eq('id', listingId); load()
  }
  async function savePriceReduction(listing: Listing) {
    if (!newPrice) return
    const np = parseFloat(newPrice)
    await supabase.from('rv_price_history').insert({ listing_id: listing.id, old_price: listing.current_price, new_price: np, changed_at: new Date().toISOString().split('T')[0], reason: priceReason || null })
    await supabase.from('rv_listings').update({ current_price: np }).eq('id', listing.id)
    setNewPrice(''); setPriceReason(''); setShowPriceForm(null); load()
  }
  async function saveSale() {
    if (!salePrice) return
    await supabase.from('rv_sales').insert({ item_id: id, listing_id: saleListingId || null, platform: salePlatform, sold_at: saleDate, sold_price: parseFloat(salePrice), platform_fees: parseFloat(saleFees) || 0, notes: saleNotes || null })
    await supabase.from('rv_items').update({ status: 'vendu' }).eq('id', id)
    if (saleListingId) await supabase.from('rv_listings').update({ status: 'vendu' }).eq('id', saleListingId)
    setShowSaleForm(false); load()
  }
  async function deleteItem() {
    if (!confirm('Supprimer cet objet ? Cette action est irréversible.')) return
    await supabase.from('rv_items').delete().eq('id', id)
    router.push('/inventaire')
  }

  if (loading) return <div className="text-center text-zinc-500 py-20">Chargement…</div>
  if (!item) return <div className="text-center text-zinc-500 py-20">Objet introuvable.</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/inventaire" className="text-zinc-500 hover:text-zinc-300 mt-1 transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{item.name}</h1>
            <ItemStatusBadge status={item.status} />
          </div>
          {item.category && <p className="text-zinc-500 text-sm mt-0.5">{item.category} · {item.condition}</p>}
        </div>
        <button onClick={deleteItem} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-1"><Trash2 size={18} /></button>
      </div>

      <div className="card">
        <h2 className="font-semibold text-zinc-300 mb-3">Résumé financier</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-zinc-800/60 rounded-lg p-3"><p className="text-xs text-zinc-500">Achat</p><p className="font-bold text-zinc-200">{formatEur(item.purchase_price)}</p></div>
          <div className="bg-zinc-800/60 rounded-lg p-3"><p className="text-xs text-zinc-500">Frais annexes</p><p className="font-bold text-zinc-200">{formatEur(totalCosts)}</p></div>
          <div className="bg-zinc-800/60 rounded-lg p-3"><p className="text-xs text-zinc-500">Total investi</p><p className="font-bold text-orange-400">{formatEur(invested)}</p></div>
          {sale ? (
            <div className={`rounded-lg p-3 ${(netProfit ?? 0) >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="text-xs text-zinc-500">Bénéfice net</p>
              <p className={`font-bold ${(netProfit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netProfit != null ? ((netProfit >= 0 ? '+' : '') + formatEur(netProfit)) : '—'}
              </p>
            </div>
          ) : (
            <div className="bg-zinc-800/60 rounded-lg p-3"><p className="text-xs text-zinc-500">Bénéfice</p><p className="text-zinc-600 text-sm">Pas encore vendu</p></div>
          )}
        </div>
        {netProfit != null && netProfit > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-green-900/20 rounded-lg px-3 py-2 border border-green-900/40">
            <PiggyBank size={14} className="text-green-400" />
            <p className="text-sm text-green-300">Épargne à virer : <span className="font-bold">{formatEur(netProfit * 0.1)}</span></p>
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold text-zinc-300 mb-3">Détails</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-zinc-500">Acquisition</span>
          <span className="capitalize">{item.acquisition_type} · {formatDate(item.acquisition_date)}</span>
          {item.description && <><span className="text-zinc-500">Description</span><span>{item.description}</span></>}
          {item.notes && <><span className="text-zinc-500">Notes</span><span>{item.notes}</span></>}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-300">Frais annexes</h2>
          <button onClick={() => setShowCostForm(!showCostForm)} className="btn-secondary text-sm flex items-center gap-1.5"><Plus size={14} /> Ajouter</button>
        </div>
        {showCostForm && (
          <div className="space-y-2 bg-zinc-800/40 p-3 rounded-lg border border-zinc-700">
            <div className="grid grid-cols-2 gap-2">
              <select value={costLabel} onChange={e => setCostLabel(e.target.value)}>{COST_LABELS.map(l => <option key={l}>{l}</option>)}</select>
              <input type="number" min="0" step="0.01" placeholder="Montant (€)" value={costAmount} onChange={e => setCostAmount(e.target.value)} />
            </div>
            <input type="date" value={costDate} onChange={e => setCostDate(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowCostForm(false)} className="btn-secondary flex-1 text-sm">Annuler</button>
              <button onClick={saveCost} className="btn-primary flex-1 text-sm">Enregistrer</button>
            </div>
          </div>
        )}
        {costs.length === 0 ? <p className="text-zinc-500 text-sm">Aucun frais enregistré.</p> : (
          <div className="space-y-1.5">
            {costs.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                <div><span className="text-sm">{c.label}</span><span className="text-xs text-zinc-500 ml-2">{formatDate(c.date)}</span></div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{formatEur(c.amount)}</span>
                  <button onClick={() => deleteCost(c.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-300">Mises en vente</h2>
          {item.status !== 'vendu' && (
            <button onClick={() => setShowListingForm(!showListingForm)} className="btn-secondary text-sm flex items-center gap-1.5"><Plus size={14} /> Ajouter</button>
          )}
        </div>
        {showListingForm && (
          <div className="space-y-2 bg-zinc-800/40 p-3 rounded-lg border border-zinc-700">
            <div className="grid grid-cols-2 gap-2">
              <select value={listPlatform} onChange={e => setListPlatform(e.target.value as Platform)}>
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Prix de vente (€)" value={listPrice} onChange={e => setListPrice(e.target.value)} />
            </div>
            <input placeholder="Lien de l'annonce (optionnel)" value={listUrl} onChange={e => setListUrl(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowListingForm(false)} className="btn-secondary flex-1 text-sm">Annuler</button>
              <button onClick={saveListing} className="btn-primary flex-1 text-sm">Enregistrer</button>
            </div>
          </div>
        )}
        {listings.length === 0 ? <p className="text-zinc-500 text-sm">Pas encore de mise en vente.</p> : listings.map(l => (
          <div key={l.id} className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2"><PlatformBadge platform={l.platform} /><ListingStatusBadge status={l.status} /></div>
              <div className="text-right">
                <p className="font-bold">{formatEur(l.current_price)}</p>
                {l.current_price !== l.initial_price && <p className="text-xs text-zinc-500 line-through">{formatEur(l.initial_price)}</p>}
              </div>
            </div>
            <p className="text-xs text-zinc-500">Mis en vente le {formatDate(l.listed_at)}</p>
            {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline flex items-center gap-1"><ExternalLink size={11} /> Voir l&apos;annonce</a>}
            {(priceHistories[l.id] ?? []).length > 0 && (
              <div className="space-y-1 pt-1 border-t border-zinc-700">
                {priceHistories[l.id].map(ph => (
                  <div key={ph.id} className="flex items-center gap-2 text-xs text-zinc-500">
                    <TrendingDown size={11} className="text-yellow-500" />
                    <span>{formatEur(ph.old_price)} → {formatEur(ph.new_price)}</span>
                    <span>{formatDate(ph.changed_at)}</span>
                    {ph.reason && <span>· {ph.reason}</span>}
                  </div>
                ))}
              </div>
            )}
            {l.status === 'actif' && (
              <div className="flex gap-2 flex-wrap pt-1 border-t border-zinc-700">
                <button onClick={() => setShowPriceForm(showPriceForm === l.id ? null : l.id)} className="btn-secondary text-xs flex items-center gap-1"><TrendingDown size={12} /> Baisser le prix</button>
                <button onClick={() => updateListingStatus(l.id, 'pausé')} className="btn-secondary text-xs">Mettre en pause</button>
                <button onClick={() => updateListingStatus(l.id, 'retiré')} className="btn-secondary text-xs">Retirer</button>
              </div>
            )}
            {showPriceForm === l.id && (
              <div className="space-y-2 bg-zinc-900 p-3 rounded-lg border border-zinc-700">
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" step="0.01" placeholder="Nouveau prix (€)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                  <input placeholder="Raison (optionnel)" value={priceReason} onChange={e => setPriceReason(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPriceForm(null)} className="btn-secondary flex-1 text-xs">Annuler</button>
                  <button onClick={() => savePriceReduction(l)} className="btn-primary flex-1 text-xs">Enregistrer</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sale ? (
        <div className="card border-green-500/30 bg-green-500/5 space-y-2">
          <h2 className="font-semibold text-green-300 flex items-center gap-2"><ShoppingCart size={16} /> Vendu !</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-zinc-500">Plateforme</span><PlatformBadge platform={sale.platform} />
            <span className="text-zinc-500">Date</span><span>{formatDate(sale.sold_at)}</span>
            <span className="text-zinc-500">Prix de vente</span><span className="font-bold">{formatEur(sale.sold_price)}</span>
            <span className="text-zinc-500">Commission</span><span>{formatEur(sale.platform_fees)}</span>
            <span className="text-zinc-500">Bénéfice net</span>
            <span className={`font-bold ${(netProfit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netProfit != null ? formatEur(netProfit) : '—'}</span>
          </div>
          {sale.notes && <p className="text-sm text-zinc-500 mt-2">{sale.notes}</p>}
        </div>
      ) : (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-300 flex items-center gap-2"><ShoppingCart size={16} /> Enregistrer la vente</h2>
            <button onClick={() => setShowSaleForm(!showSaleForm)} className={showSaleForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>{showSaleForm ? 'Annuler' : 'Vendu !'}</button>
          </div>
          {showSaleForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label>Plateforme de vente</label>
                  <select value={salePlatform} onChange={e => setSalePlatform(e.target.value as Platform)}>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select></div>
                <div><label>Listing correspondant (optionnel)</label>
                  <select value={saleListingId} onChange={e => setSaleListingId(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {listings.map(l => <option key={l.id} value={l.id}>{l.platform} · {formatEur(l.current_price)}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Prix de vente final (€)</label><input type="number" min="0" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} /></div>
                <div><label>Commission plateforme (€)</label><input type="number" min="0" step="0.01" value={saleFees} onChange={e => setSaleFees(e.target.value)} /></div>
              </div>
              <div><label>Date de vente</label><input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} /></div>
              <div><label>Notes</label><input placeholder="Acheteur sympa, envoi rapide…" value={saleNotes} onChange={e => setSaleNotes(e.target.value)} /></div>
              {salePrice && (
                <div className="bg-zinc-800/60 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-zinc-500">Prix vendu</span><span>{formatEur(parseFloat(salePrice) || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">− Commission</span><span className="text-red-400">− {formatEur(parseFloat(saleFees) || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">− Investi</span><span className="text-red-400">− {formatEur(invested)}</span></div>
                  <div className="flex justify-between font-bold border-t border-zinc-700 pt-1 mt-1">
                    <span>Bénéfice net</span>
                    <span className={(parseFloat(salePrice) || 0) - (parseFloat(saleFees) || 0) - invested >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatEur((parseFloat(salePrice) || 0) - (parseFloat(saleFees) || 0) - invested)}
                    </span>
                  </div>
                </div>
              )}
              <button onClick={saveSale} className="btn-primary w-full">Confirmer la vente</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
