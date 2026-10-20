import { X } from 'lucide-react'
import type { Customer } from '../../../types'

interface CustomerDetailDialogProps {
  customer: Customer | null
  onClose: () => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

export default function CustomerDetailDialog({ customer, onClose }: CustomerDetailDialogProps) {
  if (!customer) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal customer-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
        <div className="modal-heading"><div><span className="eyebrow">REGISTRO INDIVIDUAL</span><h3 id="customer-detail-title">{customer.nombre}</h3><p>{customer.id} · Grupo {customer.segmento === undefined ? 'sin asignar' : customer.segmento + 1}</p></div><button className="icon-button" aria-label="Cerrar detalle" onClick={onClose}><X size={18} /></button></div>
        <div className="customer-detail-metrics"><span><small>Gasto acumulado</small><strong>{money.format(customer.gastoAcumulado)}</strong></span><span><small>Visitas / 6 meses</small><strong>{customer.visitas6Meses}</strong></span><span><small>Antigüedad</small><strong>{customer.antiguedadMeses} meses</strong></span></div>
        <div className="customer-distance-note"><span>Distancia al centroide</span><strong>{customer.distanceToCentroid?.toFixed(3) ?? 'No disponible'}</strong><small>Percentil dentro del grupo: {customer.distancePercentile?.toFixed(0) ?? 'No disponible'}{customer.distancePercentile === undefined ? '' : '%'}</small></div>
        <p className="customer-detail-caveat">{customer.potentialOutlier ? 'Registro alejado del patrón principal de su segmento; es una señal para revisar, no un diagnóstico.' : 'La distancia describe similitud con el centro del segmento y no determina por sí sola un comportamiento.'}</p>
      </section>
    </div>
  )
}