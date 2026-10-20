import { ArrowRight, Users, Wallet, Repeat2, Layers3, Sparkles } from 'lucide-react'
import type { Customer, AppView, SegmentationSummary } from '../../types'

interface DashboardProps {
  customers: Customer[]
  summary: SegmentationSummary | null
  onNavigate: (view: AppView) => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

export default function Dashboard({ customers, summary, onNavigate }: DashboardProps) {
  const average = (pick: (customer: Customer) => number) => customers.length
    ? customers.reduce((total, customer) => total + pick(customer), 0) / customers.length
    : 0
  const metrics = [
    { label: 'Clientes registrados', value: number.format(customers.length), hint: 'Base activa', icon: Users, tone: 'green' },
    { label: 'Gasto promedio', value: money.format(average((customer) => customer.gastoAcumulado)), hint: 'Por cliente', icon: Wallet, tone: 'coral' },
    { label: 'Visitas promedio', value: number.format(average((customer) => customer.visitas6Meses)), hint: 'Últimos 6 meses', icon: Repeat2, tone: 'blue' },
    { label: 'Segmentos detectados', value: number.format(summary?.grupos.length ?? 0), hint: summary ? `K = ${summary.k}` : 'Sin ejecutar', icon: Layers3, tone: 'lime' },
  ]
  const maxGroup = Math.max(1, ...(summary?.grupos.map((group) => group.cantidad) ?? []))

  return (
    <div className="page-stack">
      <section className="welcome-band">
        <div>
          <span className="eyebrow">INTELIGENCIA COMERCIAL</span>
          <h2>Conoce mejor a tus clientes.</h2>
          <p>Explora hábitos de compra y convierte patrones en decisiones comerciales.</p>
        </div>
        <div className="welcome-art" aria-hidden="true"><span /><span /><span /><span /><i /></div>
        <button className="button button-light" onClick={() => onNavigate('segmentation')}>
          Ir a segmentación <ArrowRight size={16} />
        </button>
      </section>

      <section className="metric-grid" aria-label="Indicadores principales">
        {metrics.map(({ label, value, hint, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon tone-${tone}`}><Icon size={18} strokeWidth={2} /></div>
            <span className="metric-label">{label}</span>
            <strong>{value}</strong>
            <span className="metric-hint">{hint}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel group-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">LECTURA DE GRUPOS</span><h3>Panorama de segmentos</h3></div>
            {summary && <span className="quiet-tag">K = {summary.k}</span>}
          </div>
          {summary ? (
            <div className="group-list">
              {summary.grupos.map((group, index) => (
                <div className="group-row" key={group.id}>
                  <div className={`group-dot group-color-${index % 5}`} />
                  <div className="group-main">
                    <div className="group-line"><strong>Segmento {group.id + 1}</strong><span>{group.cantidad} clientes</span></div>
                    <div className="bar-track"><span className={`bar-fill group-color-${index % 5}`} style={{ width: `${(group.cantidad / maxGroup) * 100}%` }} /></div>
                    <small>{money.format(group.gastoPromedio)} gasto medio · {number.format(group.visitasPromedio)} visitas</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <div className="empty-icon"><Sparkles size={19} /></div>
              <strong>Aún no hay segmentos</strong>
              <p>Ejecuta K-Means para descubrir grupos de clientes por similitud.</p>
              <button className="button button-primary button-small" onClick={() => onNavigate('segmentation')}>Preparar análisis</button>
            </div>
          )}
        </article>

        <article className="panel insight-panel">
          <span className="eyebrow">SIGUIENTE PASO</span>
          <h3>Del dato a la acción</h3>
          <p>Los grupos son un punto de partida. Revisa los promedios y decide qué propuesta tiene sentido para cada perfil.</p>
          <button className="text-action" onClick={() => onNavigate(summary ? 'recommendations' : 'customers')}>
            {summary ? 'Ver recomendaciones' : 'Revisar clientes'} <ArrowRight size={15} />
          </button>
          {summary && <div className="last-run">Último análisis · {new Date(summary.fechaEjecucion).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
        </article>
      </section>
    </div>
  )
}