import { ArrowUpRight, Lightbulb, ShieldCheck } from 'lucide-react'
import type { SegmentationSummary } from '../../types'

interface RecommendationsProps {
  summary: SegmentationSummary | null
  onAnalyze: () => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

function getSuggestion(group: SegmentationSummary['grupos'][number], averages: { spend: number; visits: number; age: number }) {
  const highSpend = group.gastoPromedio >= averages.spend * 1.2
  const frequent = group.visitasPromedio >= averages.visits * 1.2
  const established = group.antiguedadPromedio >= averages.age * 1.2
  if (highSpend && frequent) return {
    profile: 'Mayor actividad y gasto',
    recommendation: 'Priorizar la fidelización y reconocer la actividad recurrente.',
    proposal: 'Invitar al programa Nova+: puntos dobles en una categoría durante una semana y acceso anticipado a novedades.',
  }
  if (!highSpend && frequent) return {
    profile: 'Visitas frecuentes, gasto moderado',
    recommendation: 'Aumentar el valor de cada visita con productos complementarios.',
    proposal: 'Probar un combo de productos relacionados con un beneficio por compra conjunta y comparar su conversión.',
  }
  if (highSpend && !frequent) return {
    profile: 'Gasto medio elevado',
    recommendation: 'Facilitar la recompra con novedades afines a compras anteriores.',
    proposal: 'Enviar una selección personalizada junto con un cupón de retorno de un solo uso y vigencia limitada.',
  }
  if (established && !frequent) return {
    profile: 'Relación de larga duración',
    recommendation: 'Recuperar visitas cuidando el vínculo con clientes antiguos.',
    proposal: 'Enviar una invitación de regreso con un beneficio por antigüedad canjeable en la próxima visita.',
  }
  return {
    profile: 'Actividad por desarrollar',
    recommendation: 'Explorar incentivos sencillos para estimular una nueva compra.',
    proposal: 'Probar una promoción de bienvenida en una categoría relevante y medir la respuesta antes de extenderla.',
  }
}

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
          const suggestion = getSuggestion(group, averages)
          return <article className="panel recommendation-card" key={group.id}>
            <div className="recommendation-card-top"><span className={`segment-swatch group-color-${index % 5}`} /><span>GRUPO {group.id + 1}</span><small>{group.cantidad} clientes</small></div>
            <h3>{suggestion.profile}</h3>
            <div className="recommendation-metrics"><span><small>Gasto medio</small><strong>{money.format(group.gastoPromedio)}</strong></span><span><small>Visitas medias</small><strong>{group.visitasPromedio.toFixed(1)}</strong></span></div>
            <div className="commercial-recommendation"><span>RECOMENDACIÓN COMERCIAL</span><p>{suggestion.recommendation}</p></div>
            <div className="suggestion-copy"><Lightbulb size={17} /><div><span>PROPUESTA COMERCIAL</span><p>{suggestion.proposal}</p></div></div>
            <button className="text-action" onClick={onAnalyze}>Revisar datos del grupo <ArrowUpRight size={15} /></button>
          </article>
        })}
      </section>
    </div>
  )
}