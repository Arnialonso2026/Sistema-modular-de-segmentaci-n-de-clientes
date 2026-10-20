import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ClusteringFeature, SegmentGroup } from '../../../types'

interface SegmentComparisonTableProps {
  groups: SegmentGroup[]
  selectedGroup: number | null
  onSelectGroup: (id: number) => void
}

type SortKey = 'id' | 'profile' | 'cantidad' | ClusteringFeature | `diff-${ClusteringFeature}`

const columns: { key: SortKey; label: string; kind: 'text' | 'number' | 'money' | 'percent' }[] = [
  { key: 'id', label: 'Segmento', kind: 'number' },
  { key: 'profile', label: 'Perfil', kind: 'text' },
  { key: 'cantidad', label: 'Clientes', kind: 'number' },
  { key: 'gastoAcumulado', label: 'Gasto', kind: 'money' },
  { key: 'diff-gastoAcumulado', label: 'vs media', kind: 'percent' },
  { key: 'visitas6Meses', label: 'Visitas', kind: 'number' },
  { key: 'diff-visitas6Meses', label: 'vs media', kind: 'percent' },
  { key: 'antiguedadMeses', label: 'Antigüedad', kind: 'number' },
  { key: 'diff-antiguedadMeses', label: 'vs media', kind: 'percent' },
]

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

function valueFor(group: SegmentGroup, key: SortKey): string | number {
  if (key === 'id' || key === 'profile' || key === 'cantidad') return group[key]
  if (key.startsWith('diff-')) return group.differences[key.slice(5) as ClusteringFeature] ?? Number.NEGATIVE_INFINITY
  return group.centroid[key as ClusteringFeature]
}

function formatValue(group: SegmentGroup, key: SortKey, kind: typeof columns[number]['kind']) {
  if (kind === 'text') return String(valueFor(group, key))
  const value = valueFor(group, key)
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'No aplica'
  if (kind === 'money') return money.format(value)
  if (kind === 'percent') return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  return value.toFixed(key === 'cantidad' || key === 'id' ? 0 : 1)
}

export default function SegmentComparisonTable({ groups, selectedGroup, onSelectGroup }: SegmentComparisonTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' })
  const sortedGroups = useMemo(() => [...groups].sort((left, right) => {
    const leftValue = valueFor(left, sort.key)
    const rightValue = valueFor(right, sort.key)
    const comparison = typeof leftValue === 'string' && typeof rightValue === 'string'
      ? leftValue.localeCompare(rightValue, 'es')
      : Number(leftValue) - Number(rightValue)
    return sort.direction === 'asc' ? comparison : -comparison
  }), [groups, sort])

  function toggleSort(key: SortKey) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  }

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sort.key !== columnKey) return <ArrowUpDown size={12} />
    return sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  return (
    <section className="panel table-panel segment-comparison-panel">
      <div className="segment-table-heading"><div><span className="eyebrow">COMPARACIÓN CON LA BASE</span><h3>¿Qué distingue a cada segmento?</h3></div><span className="quiet-tag">Selecciona una fila para ver el detalle</span></div>
      <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}><button className="sort-button" onClick={() => toggleSort(column.key)}>{column.label}<SortIcon columnKey={column.key} /></button></th>)}</tr></thead><tbody>
        {sortedGroups.map((group) => <tr className={selectedGroup === group.id ? 'selected-segment-row' : ''} key={group.id} onClick={() => onSelectGroup(group.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectGroup(group.id) }}>
          {columns.map((column) => <td key={column.key}>{column.key === 'id' ? <strong>Grupo {group.id + 1}</strong> : column.key === 'profile' ? <span className="segment-profile-name">{group.profile}</span> : <span className={column.kind === 'percent' ? group.differences[column.key.slice(5) as ClusteringFeature] === null ? 'difference-neutral' : group.differences[column.key.slice(5) as ClusteringFeature]! >= 0 ? 'difference-positive' : 'difference-negative' : ''}>{formatValue(group, column.key, column.kind)}</span>}</td>)}
        </tr>)}
      </tbody></table></div>
      <p className="segment-table-note">Los porcentajes comparan cada media del segmento con la media global. Diferencias relativas no implican importancia comercial por sí solas.</p>
    </section>
  )
}