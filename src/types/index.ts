export type AcquisitionType = 'achat' | 'don' | 'troc'
export type ItemStatus = 'en_stock' | 'en_vente' | 'vendu' | 'archivé'
export type ListingStatus = 'actif' | 'pausé' | 'retiré' | 'vendu'
export type Platform = 'vinted' | 'ebay' | 'leboncoin' | 'facebook' | 'vide_greniers' | 'autre'

export interface Item {
  id: string
  name: string
  description?: string
  category?: string
  acquisition_type: AcquisitionType
  acquisition_date: string
  purchase_price: number
  condition?: string
  notes?: string
  status: ItemStatus
  photo_url?: string
  created_at: string
}

export interface Cost {
  id: string
  item_id: string
  label: string
  amount: number
  date: string
  notes?: string
  created_at: string
}

export interface Listing {
  id: string
  item_id: string
  platform: Platform
  listed_at: string
  initial_price: number
  current_price: number
  status: ListingStatus
  url?: string
  created_at: string
}

export interface PriceHistory {
  id: string
  listing_id: string
  old_price: number
  new_price: number
  changed_at: string
  reason?: string
  created_at: string
}

export interface Sale {
  id: string
  item_id: string
  listing_id?: string
  platform: Platform
  sold_at: string
  sold_price: number
  platform_fees: number
  shipping_paid_by_buyer: boolean
  notes?: string
  created_at: string
}

export interface ItemSummary {
  id: string
  name: string
  category?: string
  status: ItemStatus
  acquisition_type: AcquisitionType
  acquisition_date: string
  purchase_price: number
  condition?: string
  total_costs: number
  sold_price?: number
  platform_fees?: number
  sold_platform?: Platform
  sold_at?: string
  net_profit?: number
}
