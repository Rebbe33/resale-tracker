import { getPlatform } from '@/lib/utils'

export default function PlatformBadge({ platform }: { platform: string }) {
  const p = getPlatform(platform)
  return (
    <span className="badge font-semibold"
      style={{ backgroundColor: p.color + '30', color: p.color, border: `1px solid ${p.color}50` }}>
      {p.label}
    </span>
  )
}
