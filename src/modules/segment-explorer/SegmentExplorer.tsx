import { useEffect, useState } from 'react'
import { ArrowRight, Orbit } from 'lucide-react'
import CustomerDetailDialog from './components/CustomerDetailDialog'
import PcaScatterChart from './components/PcaScatterChart'
import PotentialOutliers from './components/PotentialOutliers'
import SegmentComparisonTable from './components/SegmentComparisonTable'
import SegmentProfileCard from './components/SegmentProfileCard'
import SegmentDetail from './SegmentDetail'
import type { Customer, SegmentationSummary } from '../../types'

interface SegmentExplorerProps {
  customers: Customer[]
  summary: SegmentationSummary | null
  onRunSegmentation: () => void
  onRecommendations: () => void
}

function canExplore(summary: SegmentationSummary | null) {
  return Boolean(summary?.pca && summary.grupos.every((group) => group.centroid && group.profile && group.differences))
}

export default function SegmentExplorer({ customers, summary, onRunSegmentation, onRecommendations }: SegmentExplorerProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(summary?.grupos[0]?.id ?? null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const explorerReady = canExplore(summary)

  useEffect(() => {
    if (summary && !summary.grupos.some((group) => group.id === selectedGroup)) setSelectedGroup(summary.grupos[0]?.id ?? null)
  }, [summary, selectedGroup])

  if (!explorerReady || !summary?.pca) {
    return (
      <div className="page-stack">
        <div className="page-heading-row"><div><span className="eyebrow">INTERPRETACIÓN DE RESULTADOS</span><h2>Explorador de segmentos</h2><p>Visualiza la posición relativa de los clientes y entiende qué caracteriza a cada grupo.</p></div></div>
        <section className="panel explorer-empty"><div className="empty-icon"><Orbit size={20} /></div><h3>{summary ? 'Este análisis necesita actualizarse' : 'Ejecuta una segmentación para explorar los grupos'}</h3><p>{summary ? 'Los resultados guardados no incluyen PCA o distancias. Vuelve a ejecutar K-Means para producir las coordenadas y perfiles; no se generan datos derivados ficticios.' : 'El explorador utiliza los centroides y asignaciones de una ejecución real de K-Means.'}</p><button className="button button-primary" onClick={onRunSegmentation}>Ir a Segmentación <ArrowRight size={15} /></button></section>
      </div>
    )
  }

  const activeGroup = summary.grupos.find((group) => group.id === selectedGroup) ?? summary.grupos[0]
  const groupCustomers = customers.filter((customer) => customer.segmento === activeGroup.id)

  return (
    <div className="page-stack segment-explorer-page">
      <div className="page-heading-row"><div><span className="eyebrow">INTERPRETACIÓN DE RESULTADOS</span><h2>Explorador de segmentos</h2><p>Compara perfiles, revisa clientes y explora su distribución en dos componentes PCA.</p></div><span className="quiet-tag">Análisis K = {summary.k} · {summary.cantidadProcesada} clientes</span></div>

      <section className="segment-profile-grid">{summary.grupos.map((group, index) => <SegmentProfileCard key={group.id} group={group} totalCustomers={summary.cantidadProcesada} colorIndex={index} selected={selectedGroup === group.id} onSelect={() => setSelectedGroup(group.id)} onRecommendations={onRecommendations} />)}</section>

      <PcaScatterChart projection={summary.pca} groups={summary.grupos} customers={customers} selectedGroup={selectedGroup} onSelectCustomer={setSelectedCustomer} />

      <SegmentComparisonTable groups={summary.grupos} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />

      {activeGroup && <SegmentDetail group={activeGroup} customers={groupCustomers} totalCustomers={summary.cantidadProcesada} onRecommendations={onRecommendations} onSelectCustomer={setSelectedCustomer} />}

      <PotentialOutliers customers={customers} groups={summary.grupos} onSelectCustomer={setSelectedCustomer} />

      <section className="explorer-method-note"><strong>Cómo leer esta vista</strong><span>El algoritmo agrupa en el espacio estandarizado original. PCA proyecta esos datos a 2D para visualizarlos; puede distorsionar distancias y no sustituye las métricas de K-Means. Los perfiles describen medias del segmento, no a cada persona.</span></section>
      <CustomerDetailDialog customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </div>
  )
}