import { ArrowUpRight, Lightbulb, ShieldCheck } from 'lucide-react'
import type { SegmentationSummary } from '../../types'
import { buildGroupRecommendation } from '../../services/recommendationService'

interface RecommendationsProps {
  summary: SegmentationSummary | null
  onAnalyze: () => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

export default function Recommendations({ summary, onAnalyze }: RecommendationsProps) {
  if (!summary) {
    return <div className="page-stack"><div className="page-heading-row"><div><span className="eyebrow">IDEAS PARA EL EQUIPO COMERCIAL</span><h2>Recomendaciones</h2><p>Propuestas orientativas basadas en promedios de cada grupo.</p></div></div><section className="panel empty-state recommendations-empty"><div className="empty-icon"><Lightbulb size={20} /></div><strong>Primero necesitamos un análisis</strong><p>Ejecuta K-Means para observar los perfiles agregados y preparar ideas comerciales.</p><button className="button button-primary button-small" onClick={onAnalyze}>Ir a segmentación</button></section></div>
  }
  const averages = {
    spend: summary.grupos.reduce((sum, group) => sum + group.gastoPromedio * group.cantidad, 0) / summary.cantidadProcesada,
    visits: summary.grupos.reduce((sum, group) => sum + group.visitasPromedio * group.cantidad, 0) / summary.cantidadProcesada,
    age: summary.grupos.reduce((sum, group) => sum + group.antiguedadPromedio * group.cantidad, 0) / summary.cantidadProcesada,
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row"><div><span className="eyebrow">IDEAS PARA EL EQUIPO COMERCIAL</span><h2>Recomendaciones</h2><p>Hipótesis de acción a partir de los promedios observados.</p></div><span className="quiet-tag">Basado en K = {summary.k}</span></div>
      <section className="recommendation-note"><ShieldCheck size={18} /><p>Estas propuestas son orientativas. Los segmentos describen patrones agregados y no determinan las preferencias de una persona.</p></section>
      <section className="recommendation-grid">
        {summary.grupos.map((group, index) => {
          const suggestion = buildGroupRecommendation(group, averages)
          return <article className="panel recommendation-card" key={group.id}>
            <div className="recommendation-card-top"><span className={`segment-swatch group-color-${index % 5}`} /><span>GRUPO {group.id + 1}</span><small>{group.cantidad} clientes</small></div>
            <h3>{suggestion.profile}</h3>
            <div className="recommendation-metrics"><span><small>Gasto medio</small><strong>{money.format(group.gastoPromedio)}</strong></span><span><small>Visitas medias</small><strong>{group.visitasPromedio.toFixed(1)}</strong></span></div>
            <div className="recommendation-signal"><span>SEÑAL DEL GRUPO</span><p>{suggestion.signal}</p></div>
            <div className="commercial-recommendation"><span>RECOMENDACIÓN COMERCIAL</span><p>{suggestion.recommendation}</p></div>
            <div className="suggestion-copy"><Lightbulb size={17} /><div><span>PROPUESTA COMERCIAL</span><p>{suggestion.proposal}</p></div></div>
            <button className="text-action" onClick={onAnalyze}>Revisar datos del grupo <ArrowUpRight size={15} /></button>
          </article>
        })}
      </section>
    </div>
  )
}