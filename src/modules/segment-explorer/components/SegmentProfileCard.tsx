import { ArrowRight, Users } from 'lucide-react'
import type { SegmentGroup } from '../../../types'

interface SegmentProfileCardProps {
  group: SegmentGroup
  totalCustomers: number
  colorIndex: number
  selected: boolean
  onSelect: () => void
  onRecommendations: () => void
}

export default function SegmentProfileCard({ group, totalCustomers, colorIndex, selected, onSelect, onRecommendations }: SegmentProfileCardProps) {
  const share = totalCustomers ? (group.cantidad / totalCustomers) * 100 : 0
  return (
    <article className={`segment-profile-card ${selected ? 'selected' : ''}`}>
      <button className="segment-profile-main" onClick={onSelect} aria-pressed={selected}>
        <span className={`segment-color-bar group-color-${colorIndex % 5}`} />
        <span className="segment-profile-copy"><span className="segment-technical-label">GRUPO {group.id + 1} · {group.cantidad} CLIENTES</span><strong>{group.profile}</strong></span>
        <span className="segment-share"><b>{share.toFixed(0)}%</b><small>de la base</small></span>
      </button>
      <div className="segment-profile-tags">{Object.entries(group.attributes).map(([feature, level]) => <span key={feature}>{feature === 'gastoAcumulado' ? 'Gasto' : feature === 'visitas6Meses' ? 'Frecuencia' : 'Antigüedad'} <b>{level}</b></span>)}</div>
      <div className="segment-profile-footer"><span><Users size={13} /> {group.cantidad} registros</span><button className="text-action" onClick={onRecommendations}>Recomendaciones <ArrowRight size={13} /></button></div>
    </article>
  )
}