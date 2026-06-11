'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AcquisitionType } from '@/types'
import { CATEGORIES, CONDITIONS, COST_LABELS, PLATFORMS, formatEur } from '@/lib/utils'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface CostLine { label: string; amount: string }

export default function NouvelObjet() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>('achat')
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0])
  const [purchasePrice, setPurchasePrice] = useState('0')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [costs, setCosts] = useState<CostLine[]>([])
  const [addListing, setAddListing] = useState(false)
  const [platform, setPlatform] = useState('vinted')
  const [listingPrice, setListingPrice] = useState('')
  const [listingUrl, setListingUrl] = useState('')

  const addCost = () => setCosts(c => [...c, { label: COST_LABELS[0], amount: '' }])
  const removeCost = (i: number) => setCosts(c => c.filter((_, idx) => idx !== i))
  const updateCost = (i: number, field: keyof CostLine, val: string) =>
    setCosts(c => c.map((line, idx) => idx === i ? { ...line, [field]: val } : line))

  const totalCosts = costs.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0)
  const invested = (parseFloat(purchasePrice) || 0) + totalCosts

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true); setError('')
    const { data: item, error: itemErr } = await supabase.from('rv_items').insert({
      name: name.trim(), description: description || null, category: category || null,
      acquisition_type: acquisitionType, acquisition_date: acquisitionDate,
      purchase_price: parseFloat(purchasePrice) || 0, condition: condition || null,
      notes: notes || null, status: addListing ? 'en_vente' : 'en_stock',
    }).select('id').single()

    if (itemErr || !item) { setError(itemErr?.message ?? 'Erreur'); setSaving(false); return }

    const costRows = costs.filter(c => parseFloat(c.amount) > 0).map(c => ({
      item_id: item.id, label: c.label, amount: parseFloat(c.amount), date: acquisitionDate,
    }))
    if (costRows.length > 0) await supabase.from('rv_costs').insert(costRows)

    if (addListing && listingPrice) {
      await supabase.from('rv_listings').insert({
        item_id: item.id, platform, initial_price: parseFloat(listingPrice),
        current_price: parseFloat(listingPrice), url: listingUrl || null, status: 'actif',
      })
    }
    router.push(`/objet/${item.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventaire" className="text-zinc-500 hover:text-zinc-300 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold">Nouvel objet</h1>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-zinc-300">Informations</h2>
        <div><label>Nom *</label><input placeholder="ex: Veste en jean vintage" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label>Description</label>
          <textarea rows={2} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full resize-none"
            placeholder="Marque, taille, particularités…" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label>Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">— Choisir —</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label>État</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="">— Choisir —</option>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div><label>Notes</label>
          <textarea rows={2} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full resize-none"
            value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-zinc-300">Acquisition</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['achat', 'don', 'troc'] as AcquisitionType[]).map(t => (
            <button key={t} onClick={() => setAcquisitionType(t)}
              className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${acquisitionType === t ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label>Date d&apos;acquisition</label><input type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} /></div>
          <div><label>Prix d&apos;achat (€)</label><input type="number" min="0" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} disabled={acquisitionType === 'don'} /></div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-300">Frais annexes</h2>
          <button onClick={addCost} className="btn-secondary flex items-center gap-1.5 text-sm"><Plus size={14} /> Ajouter</button>
        </div>
        {costs.length === 0 && <p className="text-zinc-500 text-sm">Emballage, essence, livraison achat… Ajoute tes frais ici.</p>}
        {costs.map((cost, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select className="flex-1" value={cost.label} onChange={e => updateCost(i, 'label', e.target.value)}>
              {COST_LABELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <input type="number" min="0" step="0.01" placeholder="Montant (€)" className="flex-1"
              value={cost.amount} onChange={e => updateCost(i, 'amount', e.target.value)} />
            <button onClick={() => removeCost(i)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
          </div>
        ))}
        {costs.length > 0 && (
          <p className="text-sm text-zinc-400">
            Total frais : <span className="font-semibold text-zinc-200">{formatEur(totalCosts)}</span>
            {' '}· Investi total : <span className="font-semibold text-orange-400">{formatEur(invested)}</span>
          </p>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-300">Mise en vente immédiate</h2>
          <button onClick={() => setAddListing(!addListing)}
            className={`relative w-11 h-6 rounded-full transition-colors ${addListing ? 'bg-orange-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${addListing ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {addListing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label>Plateforme</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select></div>
              <div><label>Prix de mise en vente (€)</label>
                <input type="number" min="0" step="0.01" value={listingPrice} onChange={e => setListingPrice(e.target.value)} placeholder="0.00" /></div>
            </div>
            <div><label>Lien de l&apos;annonce (optionnel)</label>
              <input placeholder="https://…" value={listingUrl} onChange={e => setListingUrl(e.target.value)} /></div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Link href="/inventaire" className="btn-secondary flex-1 text-center">Annuler</Link>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </div>
  )
}
