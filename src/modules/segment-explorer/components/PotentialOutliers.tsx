import { AlertTriangle, UserRound } from 'lucide-react'
import type { Customer, SegmentGroup } from '../../../types'

interface PotentialOutliersProps {
  customers: Customer[]
  groups: SegmentGroup[]
  onSelectCustomer: (customer: Customer) => void
}

export default function PotentialOutliers({ customers, groups, onSelectCustomer }: PotentialOutliersProps) {
  const outliers = customers.filter((customer) => customer.potentialOutlier)
  const hasSmallGroup = groups.some((group) => group.distanceThreshold === null)
  return (
    <section className="panel potential-outliers-panel">
      <div className="segment-table-heading"><div><span className="eyebrow">REVISIÓN DE DISTANCIAS</span><h3>Clientes atípicos</h3></div><span className="quiet-tag"><AlertTriangle size={13} /> Señales orientativas</span></div>
      <p className="outlier-description">Se muestran registros en la cola superior de distancia al centroide de su propio segmento. No representan por sí solos fraude ni anomalía real.</p>
      {outliers.length ? <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Segmento</th><th>Distancia</th><th>Percentil</th><th>Estado</th><th /></tr></thead><tbody>
        {outliers.map((customer) => <tr key={customer.id}><td><strong>{customer.nombre}</strong><small className="table-subline">{customer.id}</small></td><td>Grupo {(customer.segmento ?? 0) + 1}</td><td>{customer.distanceToCentroid?.toFixed(3)}</td><td>{customer.distancePercentile?.toFixed(0)}%</td><td><span className="outlier-status">Posible comportamiento atípico</span></td><td><button className="icon-button" title="Abrir detalle del cliente" aria-label={`Abrir detalle de ${customer.nombre}`} onClick={() => onSelectCustomer(customer)}><UserRound size={16} /></button></td></tr>)}
      </tbody></table></div> : <div className="outlier-empty"><strong>No hay señales por encima del umbral actual.</strong><span>El resultado depende de las distancias relativas y del tamaño de cada grupo.</span></div>}
      {hasSmallGroup && <p className="outlier-footnote">Algunos grupos tienen menos de cinco clientes; no se clasifica su cola de distancia por falta de muestra suficiente.</p>}
    </section>
  )
}