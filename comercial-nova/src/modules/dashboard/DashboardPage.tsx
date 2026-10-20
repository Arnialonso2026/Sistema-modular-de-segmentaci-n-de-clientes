
import {
  Users,
  Wallet,
  Repeat2,
  BrainCircuit,
  ArrowUpRight,
  ChartNoAxesCombined,
} from "lucide-react";

import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";

const demoMetrics = [
  {
    label: "Clientes registrados",
    value: "12",
    description: "Datos de prueba de la práctica",
    icon: Users,
  },
  {
    label: "Gasto promedio",
    value: "S/ 1,083",
    description: "Valor ilustrativo del conjunto",
    icon: Wallet,
  },
  {
    label: "Visitas promedio",
    value: "7.6",
    description: "Visitas durante seis meses",
    icon: Repeat2,
  },
  {
    label: "Segmentos detectados",
    value: "—",
    description: "Pendiente de ejecutar K-Means",
    icon: BrainCircuit,
  },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="VISIÓN GENERAL"
        title="Dashboard"
        description="Una visión centralizada de los datos y del comportamiento de tus clientes."
      />

      <section className="demo-notice" role="note">
        <div className="demo-notice__icon">
          <ChartNoAxesCombined size={19} />
        </div>
        <div>
          <strong>Entorno de demostración</strong>
          <p>
            Los indicadores ilustrativos se reemplazarán por métricas
            calculadas a partir de los registros en la Fase 3.
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Indicadores generales">
        {demoMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__heading">
            <div>
              <h2>Distribución de clientes</h2>
              <p>Resumen de la actividad de segmentación</p>
            </div>
            <span className="status-pill">En preparación</span>
          </div>

          <EmptyState
            icon={BrainCircuit}
            title="Aún no hay segmentos"
            description="Cuando se implemente K-Means, aquí se mostrará la distribución de clientes por grupo."
          />
        </article>

        <article className="panel">
          <div className="panel__heading">
            <div>
              <h2>Accesos rápidos</h2>
              <p>Continúa con las operaciones del sistema</p>
            </div>
          </div>

          <div className="quick-links">
            <a href="/clientes" className="quick-link">
              <span className="quick-link__icon">
                <Users size={19} />
              </span>
              <span className="quick-link__copy">
                <strong>Gestión de clientes</strong>
                <small>Preparar registros y datos</small>
              </span>
              <ArrowUpRight size={18} />
            </a>

            <a href="/segmentacion" className="quick-link">
              <span className="quick-link__icon">
                <BrainCircuit size={19} />
              </span>
              <span className="quick-link__copy">
                <strong>Segmentación</strong>
                <small>Consultar el módulo analítico</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
          </div>
        </article>
      </section>
    </>
  );
}
