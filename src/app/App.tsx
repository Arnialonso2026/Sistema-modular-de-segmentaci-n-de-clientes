import { useEffect, useState } from 'react'
import { BarChart3, ChevronDown, LayoutDashboard, Lightbulb, Orbit, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Customers from '../modules/customers/Customers'
import Dashboard from '../modules/dashboard/Dashboard'
import Recommendations from '../modules/recommendations/Recommendations'
import Segmentation from '../modules/segmentation/Segmentation'
import { getCustomers, saveCustomers } from '../services/customerService'
import { runSegmentation } from '../services/segmentationService'
import type { AppView, Customer, SegmentationSummary } from '../types'

const SUMMARY_KEY = 'nova-segmentation-v1'

interface Notice {
  message: string
  kind: 'success' | 'error'
}

interface NavigationItem {
  id: AppView
  label: string
  icon: LucideIcon
}

const navigation: { heading: string; items: NavigationItem[] }[] = [
  { heading: 'ESPACIO DE TRABAJO', items: [
    { id: 'dashboard', label: 'Panel principal', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
  ] },
  { heading: 'INTELIGENCIA', items: [
    { id: 'segmentation', label: 'Segmentación', icon: Orbit },
    { id: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
  ] },
]

const pageTitles: Record<AppView, string> = {
  dashboard: 'Panel principal',
  customers: 'Clientes',
  segmentation: 'Segmentación',
  recommendations: 'Recomendaciones',
}

function readSummary(): SegmentationSummary | null {
  try {
    const stored = localStorage.getItem(SUMMARY_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as SegmentationSummary
    return Array.isArray(parsed.grupos) ? parsed : null
  } catch {
    return null
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [customers, setCustomers] = useState<Customer[]>(getCustomers)
  const [summary, setSummary] = useState<SegmentationSummary | null>(readSummary)
  const [k, setK] = useState(3)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => saveCustomers(customers), [customers])

  function announce(message: string, kind: Notice['kind'] = 'success') {
    setNotice({ message, kind })
  }

  function changeCustomers(next: Customer[]) {
    setCustomers(next.map((customer) => ({ ...customer, segmento: undefined })))
    setSummary(null)
    localStorage.removeItem(SUMMARY_KEY)
  }

  async function analyze() {
    setRunning(true)
    setNotice(null)
    await new Promise((resolve) => window.setTimeout(resolve, 100))
    try {
      const result = runSegmentation(customers, k)
      setCustomers(result.customers)
      setSummary(result.summary)
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(result.summary))
      announce(`Segmentación completada: ${result.summary.cantidadProcesada} clientes en ${k} grupos.`)
    } catch (error) {
      announce(error instanceof Error ? error.message : 'No se pudo completar la segmentación.', 'error')
    } finally {
      setRunning(false)
    }
  }

  function renderPage() {
    if (view === 'customers') return <Customers customers={customers} onChange={changeCustomers} onNotice={announce} />
    if (view === 'segmentation') return <Segmentation customers={customers} summary={summary} k={k} running={running} onKChange={setK} onRun={analyze} />
    if (view === 'recommendations') return <Recommendations summary={summary} onAnalyze={() => setView('segmentation')} />
    return <Dashboard customers={customers} summary={summary} onNavigate={setView} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" onClick={() => setView('dashboard')} aria-label="Nova, ir al panel principal">
          <span className="brand-mark"><Orbit size={22} strokeWidth={2.4} /></span>
          <span><strong>nova</strong><small>COMERCIAL NOVA</small></span>
        </button>
        <div className="workspace-switch"><span className="workspace-avatar">CN</span><span><strong>Comercial Nova</strong><small>Espacio de trabajo</small></span><ChevronDown size={15} /></div>
        <nav className="main-navigation" aria-label="Navegación principal">
          {navigation.map((group) => <div className="nav-group" key={group.heading}>
            <span className="nav-heading">{group.heading}</span>
            {group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? 'active' : ''}`} onClick={() => { setView(id); setNotice(null) }} aria-current={view === id ? 'page' : undefined}><Icon size={18} /><span>{label}</span>{id === 'customers' && <small>{customers.length}</small>}</button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom"><div className="side-note-mark"><BarChart3 size={17} /></div><p><strong>Datos al día</strong><span>Guardados en este navegador</span></p><span className="online-dot" /></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><span>Comercial Nova</span><span>/</span><strong>{pageTitles[view]}</strong></div><div className="topbar-meta"><span className="sync-indicator"><i /> Guardado local</span><span className="user-avatar" aria-label="Usuario">NV</span></div></header>
        <div className="content-area">
          {notice && <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}<button onClick={() => setNotice(null)} aria-label="Cerrar notificación">×</button></div>}
          {renderPage()}
          <footer className="app-footer"><span>Nova · Inteligencia comercial</span><span>Los segmentos ayudan a explorar patrones, no definen a las personas.</span></footer>
        </div>
      </main>
    </div>
  )
}