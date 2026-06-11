import { Platform } from '@/types'

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'vinted',        label: 'Vinted',        color: '#09B1BA' },
  { value: 'ebay',          label: 'eBay',          color: '#E53238' },
  { value: 'leboncoin',     label: 'Leboncoin',     color: '#F56B2A' },
  { value: 'facebook',      label: 'Facebook',      color: '#1877F2' },
  { value: 'vide_greniers', label: 'Vide-greniers', color: '#8B5CF6' },
  { value: 'autre',         label: 'Autre',         color: '#6B7280' },
]

export const CATEGORIES = [
  'Vêtements', 'Chaussures', 'Accessoires', 'Électronique', 'Livres',
  'Jeux / Jouets', 'Décoration', 'Mobilier', 'Sport', 'Beauté', 'Autre',
]

export const CONDITIONS = ['Neuf', 'Très bon état', 'Bon état', 'Usagé']

export const COST_LABELS = [
  'Emballage', "Frais d'envoi", 'Essence', 'Achat en lot', 'Réparation', 'Nettoyage', 'Autre',
]

export function getPlatform(value: string) {
  return PLATFORMS.find(p => p.value === value) ?? { value, label: value, color: '#6B7280' }
}

export function savings10(profit: number): number {
  return profit > 0 ? profit * 0.1 : 0
}
