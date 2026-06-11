import { ItemStatus, ListingStatus } from '@/types'

const itemStatusConfig: Record<ItemStatus, { label: string; classes: string }> = {
  en_stock: { label: 'En stock', classes: 'bg-zinc-700 text-zinc-300' },
  en_vente: { label: 'En vente', classes: 'bg-blue-900/50 text-blue-300' },
  vendu:    { label: 'Vendu',    classes: 'bg-green-900/50 text-green-300' },
  archivé:  { label: 'Archivé', classes: 'bg-zinc-800 text-zinc-500' },
}

const listingStatusConfig: Record<ListingStatus, { label: string; classes: string }> = {
  actif:  { label: 'Actif',   classes: 'bg-blue-900/50 text-blue-300' },
  pausé:  { label: 'Pausé',   classes: 'bg-yellow-900/50 text-yellow-300' },
  retiré: { label: 'Retiré',  classes: 'bg-zinc-700 text-zinc-400' },
  vendu:  { label: 'Vendu',   classes: 'bg-green-900/50 text-green-300' },
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const cfg = itemStatusConfig[status]
  return <span className={`badge ${cfg.classes}`}>{cfg.label}</span>
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const cfg = listingStatusConfig[status]
  return <span className={`badge ${cfg.classes}`}>{cfg.label}</span>
}
