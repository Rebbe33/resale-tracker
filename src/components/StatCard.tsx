interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  icon?: React.ReactNode
}

export default function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  return (
    <div className={`card flex flex-col gap-1 ${accent ? 'border-orange-500/40 bg-orange-500/5' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <span className={`text-2xl font-bold ${accent ? 'text-orange-400' : 'text-zinc-100'}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  )
}
