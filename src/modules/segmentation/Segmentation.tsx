import { useState } from 'react'
import { Activity, ArrowDownWideNarrow, Play, SlidersHorizontal } from 'lucide-react'
import type { Customer, SegmentationSummary } from '../../types'

interface SegmentationProps {
  customers: Customer[]
  summary: SegmentationSummary | null
  k: number
  running: boolean
  onKChange: (k: number) => void
  onRun: () => void
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

export default function Segmentation({ customers, summary, k, running, onKChange, onRun }: SegmentationProps) {
  const [groupFilter, setGroupFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'gastoAcumulado' | 'visitas6Meses'>('gastoAcumulado')
  const filtered = customers
    .filter((customer) => groupFilter === 'all' || customer.segmento === Number(groupFilter))
    .sort((left, right) => right[sortBy] - left[sortBy])

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="eyebrow">APRENDIZAJE NO SUPERVISADO</span><h2>Segmentación</h2><p>K-Means encuentra grupos por similitud, sin etiquetas previas.</p></div>
        <div className="seg-controls">
          <label className="k-picker"><span>K</span><select value={k} onChange={(event) => onKChange(Number(event.target.value))} aria-label="Cantidad de segmentos">{[2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} grupos</option>)}</select></label>
          <button className="button button-primary" disabled={running} onClick={onRun}>{running ? <span className="spinner" /> : <Play size={16} fill="currentColor" />} {running ? 'Analizando' : 'Ejecutar K-Means'}</button>
        </div>
      </div>

      <section className="method-strip"><div className="method-icon"><Activity size={18} /></div><p><strong>Variables usadas:</strong> gasto acumulado, visitas en 6 meses y antigüedad. Se estandarizan para que una escala no domine la distancia; el nombre y el código quedan fuera del cálculo.</p></section>

      {summary ? (
        <>
          <section className="segment-summary-grid">
            {summary.grupos.map((group, index) => (
              <article className="segment-summary-card" key={group.id}>
                <div className="segment-card-top"><span className={`segment-swatch group-color-${index % 5}`} /><span>GRUPO {group.id + 1}</span><small>{group.cantidad} clientes</small></div>
                <strong>{money.format(group.gastoPromedio)}</strong><span className="segment-card-caption">Gasto acumulado promedio</span>
                <div className="segment-mini-stats"><span><b>{group.visitasPromedio.toFixed(1)}</b> visitas medias</span><span><b>{group.antiguedadPromedio.toFixed(1)}</b> meses cliente</span></div>
              </article>
            ))}
          </section>

          <section className="panel table-panel result-panel">
            <div className="table-toolbar result-toolbar">
              <div><span className="eyebrow">ASIGNACIÓN POR CLIENTE</span><h3>Resultados del análisis</h3><p>{summary.cantidadProcesada} registros procesados · {new Date(summary.fechaEjecucion).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
              <div className="result-filters"><label className="filter-select"><SlidersHorizontal size={15} /><select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} aria-label="Filtrar por grupo"><option value="all">Todos los grupos</option>{summary.grupos.map((group) => <option key={group.id} value={group.id}>Grupo {group.id + 1}</option>)}</select></label><label className="filter-select"><ArrowDownWideNarrow size={15} /><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Ordenar clientes"><option value="gastoAcumulado">Ordenar por gasto</option><option value="visitas6Meses">Ordenar por visitas</option></select></label></div>
            </div>
            <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Gasto</th><th>Visitas</th><th>Antigüedad</th><th>Grupo asignado</th></tr></thead><tbody>
              {filtered.map((customer) => <tr key={customer.id}><td><div className="customer-cell"><span className="avatar">{customer.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{customer.nombre}</strong><small>{customer.id}</small></span></div></td><td>{money.format(customer.gastoAcumulado)}</td><td>{customer.visitas6Meses}</td><td>{customer.antiguedadMeses} meses</td><td>{customer.segmento === undefined ? 'Sin asignar' : <span className={`segment-badge group-color-${customer.segmento % 5}`}>Grupo {customer.segmento + 1}</span>}</td></tr>)}
            </tbody></table>
            {filtered.length === 0 && <div className="empty-state table-empty"><strong>No hay clientes en este grupo.</strong></div>}
            </div>
            <div className="table-footer">La etiqueta de grupo es técnica. Interprétala con las estadísticas, no como una categoría absoluta.</div>
          </section>
        </>
      ) : (
        <section className="panel empty-analysis">
          <div className="empty-analysis-art"><span className="analysis-ring ring-one" /><span className="analysis-ring ring-two" /><i /><i /><i /><i /><i /></div>
          <span className="eyebrow">LISTO PARA ANALIZAR</span><h3>Encuentra patrones en tu base</h3>
          <p>Elige cuántos grupos explorar. K-Means asignará cada cliente al centroide más cercano y repetirá el cálculo hasta converger.</p>
          <button className="button button-primary" disabled={running} onClick={onRun}><Play size={16} fill="currentColor" /> Ejecutar con K = {k}</button>
          {customers.length < k && <small className="helper-warning">Hay {customers.length} clientes y K = {k}. Se requieren al menos K registros válidos.</small>}
        </section>
      )}
    </div>
  )
}