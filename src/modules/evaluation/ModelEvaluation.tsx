import { useEffect, useState } from 'react'
import { Activity, BadgeCheck, ChartNoAxesColumnIncreasing, Info } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { evaluateKMeans } from '../../services/modelEvaluationService'
import type { Customer } from '../../types'
import type { ModelEvaluation } from '../../types/evaluation'

interface ModelEvaluationProps {
  customers: Customer[]
}

const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })

function describeSilhouette(score: number) {
  if (score < 0) return 'Hay clientes posiblemente asignados al grupo equivocado.'
  if (score < 0.25) return 'Separación débil; los grupos pueden solaparse.'
  if (score < 0.5) return 'Separación limitada; conviene revisar los perfiles.'
  if (score < 0.7) return 'Separación razonable para explorar los perfiles.'
  return 'Grupos bien separados en las variables evaluadas.'
}

function scoreLabel(score: number) {
  if (score < 0) return 'Revisar agrupación'
  if (score < 0.25) return 'Separación débil'
  if (score < 0.5) return 'Separación limitada'
  if (score < 0.7) return 'Separación razonable'
  return 'Separación marcada'
}

function useEvaluation(customers: Customer[]) {
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      setError('')
      setEvaluation(evaluateKMeans(customers))
    } catch (cause) {
      setEvaluation(null)
      setError(cause instanceof Error ? cause.message : 'No se pudo evaluar el modelo.')
    }
  }, [customers])

  return { evaluation, error }
}

function RecommendationCard({ evaluation }: { evaluation: ModelEvaluation }) {
  const selected = evaluation.rows.find((row) => row.k === evaluation.recommendedK)
  return (
    <section className="evaluation-recommendation">
      <div className="evaluation-recommendation-icon"><BadgeCheck size={20} /></div>
      <div className="evaluation-recommendation-copy">
        <span className="eyebrow">RECOMENDACIÓN ESTADÍSTICA</span>
        <h3>{evaluation.recommendedK === null ? 'Aún no hay suficientes valores de K para comparar' : `Explorar K = ${evaluation.recommendedK}`}</h3>
        <p>{evaluation.recommendationReason}</p>
      </div>
      {selected && <div className="recommended-score"><strong>{selected.silhouetteScore.toFixed(3)}</strong><span>Silhouette Score</span></div>}
    </section>
  )
}

export default function ModelEvaluation({ customers }: ModelEvaluationProps) {
  const { evaluation, error } = useEvaluation(customers)

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="eyebrow">DIAGNÓSTICO DE CLUSTERING</span><h2>Evaluación del modelo</h2><p>Compara K con inercia y Silhouette antes de elegir el nivel de segmentación.</p></div>
        <span className="quiet-tag"><Activity size={14} /> Análisis automático · K = 2–8</span>
      </div>

      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!evaluation ? (
        <section className="panel evaluation-empty"><span className="spinner spinner-dark" /><p>Evaluando configuraciones de K…</p></section>
      ) : evaluation.rows.length === 0 ? (
        <section className="panel evaluation-empty"><div className="empty-icon"><ChartNoAxesColumnIncreasing size={20} /></div><h3>No hay suficientes registros válidos</h3><p>Agrega al menos tres clientes con gasto, visitas y antigüedad válidos para evaluar Silhouette.</p></section>
      ) : (
        <>
          <RecommendationCard evaluation={evaluation} />
          <section className="evaluation-stat-grid">
            <article className="evaluation-stat"><span>Clientes evaluados</span><strong>{evaluation.evaluatedClients}</strong><small>Registros válidos</small></article>
            <article className="evaluation-stat"><span>Configuraciones</span><strong>{evaluation.rows.length}</strong><small>K entre {evaluation.rows[0].k} y {evaluation.rows.at(-1)?.k}</small></article>
            <article className="evaluation-stat"><span>Codo estimado</span><strong>{evaluation.elbowK === null ? 'No definido' : `K = ${evaluation.elbowK}`}</strong><small>Por desviación de la curva de inercia</small></article>
          </section>

          <section className="evaluation-chart-grid">
            <article className="panel evaluation-chart-panel">
              <div className="evaluation-panel-heading"><div><span className="eyebrow">MÉTODO DEL CODO</span><h3>Inercia por cantidad de grupos</h3></div><span className="chart-legend legend-green"><i /> Inercia</span></div>
              <p className="evaluation-chart-description">La inercia siempre tiende a bajar al aumentar K. Busca el punto donde la mejora empieza a ser menor.</p>
              <div className="evaluation-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={evaluation.rows} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#e9eee9" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="k" tick={{ fill: '#77847e', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#dce4dd' }} label={{ value: 'Número de grupos (K)', position: 'insideBottom', offset: -1, fill: '#89958e', fontSize: 9 }} />
                <YAxis tick={{ fill: '#77847e', fontSize: 9 }} tickLine={false} axisLine={false} width={47} />
                <Tooltip formatter={(value) => [number.format(Number(value)), 'Inercia']} labelFormatter={(label) => `K = ${label}`} />
                {evaluation.elbowK !== null && <ReferenceLine x={evaluation.elbowK} stroke="#cf795e" strokeDasharray="4 4" label={{ value: 'Codo', fill: '#b26b52', fontSize: 9, position: 'insideTopRight' }} />}
                <Line type="monotone" dataKey="inertia" stroke="#28745e" strokeWidth={2.5} dot={{ r: 3.5, fill: '#28745e', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart></ResponsiveContainer></div>
            </article>

            <article className="panel evaluation-chart-panel">
              <div className="evaluation-panel-heading"><div><span className="eyebrow">COHESIÓN Y SEPARACIÓN</span><h3>Silhouette por cantidad de grupos</h3></div><span className="chart-legend legend-coral"><i /> Silhouette</span></div>
              <p className="evaluation-chart-description">Más cerca de 1 suele indicar grupos compactos y separados; valores negativos sugieren asignaciones dudosas.</p>
              <div className="evaluation-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={evaluation.rows} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#e9eee9" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="k" tick={{ fill: '#77847e', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#dce4dd' }} label={{ value: 'Número de grupos (K)', position: 'insideBottom', offset: -1, fill: '#89958e', fontSize: 9 }} />
                <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fill: '#77847e', fontSize: 9 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(value) => [Number(value).toFixed(3), 'Silhouette']} labelFormatter={(label) => `K = ${label}`} />
                <ReferenceLine y={0} stroke="#cdd6cf" />
                {evaluation.recommendedK !== null && <ReferenceLine x={evaluation.recommendedK} stroke="#cf795e" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey="silhouetteScore" stroke="#d17a5c" strokeWidth={2.5} dot={{ r: 3.5, fill: '#d17a5c', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart></ResponsiveContainer></div>
            </article>
          </section>

          <section className="panel evaluation-quality">
            <div className="quality-icon"><Info size={18} /></div>
            <div><span className="eyebrow">LECTURA DE CALIDAD</span><h3>{evaluation.recommendedK === null ? 'La comparación es limitada' : scoreLabel(evaluation.rows.find((row) => row.k === evaluation.recommendedK)!.silhouetteScore)}</h3><p>{evaluation.recommendedK === null ? evaluation.recommendationReason : describeSilhouette(evaluation.rows.find((row) => row.k === evaluation.recommendedK)!.silhouetteScore)}</p></div>
            <span className="quality-disclaimer">Orientativo, no concluyente</span>
          </section>

          <section className="panel table-panel evaluation-table-panel">
            <div className="evaluation-table-heading"><div><span className="eyebrow">COMPARACIÓN DE CONFIGURACIONES</span><h3>Métricas por K</h3></div>{evaluation.silhouetteSampled && <span className="quiet-tag">Silhouette estimado por muestreo</span>}</div>
            <div className="table-scroll"><table><thead><tr><th>K</th><th>Inercia ↓</th><th>Silhouette Score ↑</th><th>Clientes</th><th>Lectura</th></tr></thead><tbody>
              {evaluation.rows.map((row) => <tr className={row.k === evaluation.recommendedK ? 'recommended-row' : ''} key={row.k}><td><strong>K = {row.k}</strong>{row.k === evaluation.recommendedK && <span className="recommendation-marker">Sugerido</span>}</td><td>{number.format(row.inertia)}</td><td>{row.silhouetteScore.toFixed(3)}</td><td>{row.clientes}</td><td>{scoreLabel(row.silhouetteScore)}</td></tr>)}
            </tbody></table></div>
            <div className="table-footer">La recomendación prioriza el Silhouette Score; el codo aporta una señal complementaria. La elección final depende también del uso comercial.</div>
          </section>

          <section className="evaluation-formulas"><strong>Cómo se calculan</strong><p><b>Inercia:</b> suma de $||xᵢ − μₖ||²$ entre cada cliente estandarizado y el centroide de su grupo. Menor es mejor para el mismo K, pero siempre disminuye al agregar grupos.</p><p><b>Silhouette:</b> $s(i) = (b(i) − a(i)) / max(a(i), b(i))$, donde $a(i)$ es la distancia media al propio grupo y $b(i)$ la menor distancia media a otro grupo. El promedio está entre −1 y 1.</p>{evaluation.silhouetteSampled && <p>Para esta base, el score se estima con una muestra determinista de hasta 600 clientes y se compara cada muestra contra todos los registros.</p>}</section>
          <section className="evaluation-caveat">La recomendación es una guía estadística, no una verdad absoluta. Revisa los perfiles, el tamaño de los grupos y si las variables elegidas sirven al objetivo comercial antes de decidir.</section>
        </>
      )}
    </div>
  )
}