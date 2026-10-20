import { ArrowRight, Users } from 'lucide-react'
import { clusteringFeatures, type Customer, type SegmentGroup } from '../../types'

interface SegmentDetailProps {
  group: SegmentGroup
  customers: Customer[]
  totalCustomers: number
  onRecommendations: () => void
  onSelectCustomer: (customer: Customer) => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

function formatFeature(feature: typeof clusteringFeatures[number], value: number) {
  if (feature === 'gastoAcumulado') return money.format(value)
  if (feature === 'visitas6Meses') return `${value.toFixed(1)} visitas`
  return `${value.toFixed(1)} meses`
}

function featureLabel(feature: typeof clusteringFeatures[number]) {
  if (feature === 'gastoAcumulado') return 'Gasto acumulado'
  if (feature === 'visitas6Meses') return 'Visitas / 6 meses'
  return 'Antigüedad'
}

export default function SegmentDetail({ group, customers, totalCustomers, onRecommendations, onSelectCustomer }: SegmentDetailProps) {
  const share = totalCustomers ? (group.cantidad / totalCustomers) * 100 : 0
  return (
    <section className="panel segment-detail-panel">
      <div className="segment-detail-heading"><div><span className="eyebrow">PERFIL DEL GRUPO {group.id + 1}</span><h3>{group.profile}</h3><p><Users size={14} /> {group.cantidad} clientes · {share.toFixed(1)}% de la base</p></div><button className="button button-light button-small" onClick={onRecommendations}>Ver recomendación comercial <ArrowRight size={14} /></button></div>
      <div className="segment-detail-metrics">
        {clusteringFeatures.map((feature) => <article key={feature}><span>{featureLabel(feature)}</span><strong>{formatFeature(feature, group.centroid[feature])}</strong><small>{group.differences[feature] === null ? 'Sin media global comparable' : `${group.differences[feature]! > 0 ? '+' : ''}${group.differences[feature]!.toFixed(1)}% frente a la media`}</small></article>)}
        <article><span>Distancia media al centroide</span><strong>{group.averageDistance.toFixed(3)}</strong><small>Dispersión cuadrática: {group.inertia.toFixed(3)}</small></article>
      </div>
      <div className="centroid-strip"><span>CENTROIDE EN DATOS ORIGINALES</span>{clusteringFeatures.map((feature) => <span key={feature}>{featureLabel(feature)} <b>{formatFeature(feature, group.centroid[feature])}</b></span>)}</div>
      <div className="segment-members-heading"><strong>Clientes del grupo</strong><span>{customers.length} registros</span></div>
      <div className="segment-member-list">{customers.map((customer) => <button key={customer.id} className="segment-member-row" onClick={() => onSelectCustomer(customer)}><span className="avatar">{customer.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{customer.nombre}</strong><small>{customer.id}</small></span><span className="member-distance">{customer.distanceToCentroid?.toFixed(3)} distancia</span><span className="member-percentile">P{customer.distancePercentile?.toFixed(0)}</span></button>)}</div>
      <p className="segment-detail-note">El perfil y las diferencias resumen promedios. No describen las preferencias individuales de cada cliente.</p>
    </section>
  )
}