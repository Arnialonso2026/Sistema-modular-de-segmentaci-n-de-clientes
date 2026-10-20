import { useMemo } from 'react'
import { Scatter, ScatterChart, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Customer, PcaCentroidCoordinate, PcaCoordinate, PcaProjection, SegmentGroup } from '../../../types'

interface PcaScatterChartProps {
  projection: PcaProjection
  groups: SegmentGroup[]
  customers: Customer[]
  selectedGroup: number | null
  onSelectCustomer: (customer: Customer) => void
}

interface PcaPoint extends PcaCoordinate {
  customer: Customer
}

type TooltipDatum = PcaPoint | PcaCentroidCoordinate

const colors = ['#247a62', '#d17a5c', '#6686a3', '#a39442', '#8b739a']
const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

function PcaTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload: TooltipDatum }> }) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload
  if (!('customerId' in point)) {
    return <div className="pca-tooltip"><strong>Centroide · Grupo {point.segmento + 1}</strong><span>PC1 {point.pc1.toFixed(2)} · PC2 {point.pc2.toFixed(2)}</span></div>
  }
  const customer = point.customer
  return <div className="pca-tooltip"><strong>{customer.nombre}</strong><span>{customer.id} · Grupo {point.segmento + 1}</span><span>{money.format(customer.gastoAcumulado)} · {customer.visitas6Meses} visitas · {customer.antiguedadMeses} meses</span><span>Distancia al centroide: {customer.distanceToCentroid?.toFixed(3) ?? 'No disponible'}</span></div>
}

function CentroidShape(props: { cx?: number; cy?: number; payload?: PcaCentroidCoordinate }) {
  const { cx = 0, cy = 0, payload } = props
  const color = colors[(payload?.segmento ?? 0) % colors.length]
  return <g transform={`translate(${cx},${cy})`}><circle r="11" fill="#fff" stroke={color} strokeWidth="2" /><path d="M-5 0h10M0-5v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></g>
}

export default function PcaScatterChart({ projection, groups, customers, selectedGroup, onSelectCustomer }: PcaScatterChartProps) {
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers])
  const points = projection.coordinates.flatMap((coordinate) => {
    const customer = customerById.get(coordinate.customerId)
    return customer ? [{ ...coordinate, customer }] : []
  })

  return (
    <section className="panel pca-panel">
      <div className="pca-panel-heading"><div><span className="eyebrow">MAPA DE PROXIMIDAD</span><h3>Vista PCA de segmentos</h3><p>La proximidad en el plano resume similitudes entre las variables seleccionadas.</p></div><span className="pca-explained">PC1 {projection.explainedVariance[0].toFixed(1)}% · PC2 {projection.explainedVariance[1].toFixed(1)}%</span></div>
      {!projection.informative ? (
        <div className="pca-empty"><strong>La proyección no separa visualmente estos registros.</strong><span>La varianza disponible es insuficiente para un mapa informativo; revisa las métricas y perfiles en tabla.</span></div>
      ) : (
        <div className="pca-chart-wrap"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 24, bottom: 20, left: 8 }}>
          <CartesianGrid stroke="#e8eee9" strokeDasharray="3 4" />
          <XAxis type="number" dataKey="pc1" name="PC1" tick={{ fill: '#77847e', fontSize: 9 }} tickLine={false} axisLine={{ stroke: '#dce4dd' }} label={{ value: `PC1 · ${projection.explainedVariance[0].toFixed(1)}%`, position: 'insideBottom', offset: -11, fill: '#75847a', fontSize: 10 }} />
          <YAxis type="number" dataKey="pc2" name="PC2" tick={{ fill: '#77847e', fontSize: 9 }} tickLine={false} axisLine={false} label={{ value: `PC2 · ${projection.explainedVariance[1].toFixed(1)}%`, angle: -90, position: 'insideLeft', fill: '#75847a', fontSize: 10 }} />
          <ZAxis range={[54, 54]} />
          <Tooltip content={(props) => <PcaTooltip active={props.active} payload={props.payload as ReadonlyArray<{ payload: TooltipDatum }> | undefined} />} cursor={{ strokeDasharray: '3 3' }} />
          {groups.map((group, index) => <Scatter key={group.id} name={`Grupo ${group.id + 1}`} data={points.filter((point) => point.segmento === group.id)} fill={colors[index % colors.length]} fillOpacity={selectedGroup === null || selectedGroup === group.id ? 0.82 : 0.18} onClick={(point) => { const selected = point as unknown as { payload?: PcaPoint }; if (selected.payload?.customer) onSelectCustomer(selected.payload.customer) }} />)}
          <Scatter name="Centroides" data={projection.centroids} shape={<CentroidShape />} isAnimationActive={false} />
        </ScatterChart></ResponsiveContainer></div>
      )}
      <div className="pca-legend"><span><i className="centroid-legend" /> Centroide</span>{groups.map((group, index) => <span key={group.id} className={selectedGroup === null || selectedGroup === group.id ? '' : 'legend-muted'}><i style={{ background: colors[index % colors.length] }} /> Grupo {group.id + 1}</span>)}</div>
      <p className="pca-footnote">PCA reduce dimensiones solo para esta visualización. K-Means conserva las variables estandarizadas originales; las distancias en el plano no sustituyen las distancias del modelo.</p>
    </section>
  )
}