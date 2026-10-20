
import { Lightbulb } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

export function RecommendationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="INTELIGENCIA COMERCIAL"
        title="Recomendaciones"
        description="Prepara propuestas comerciales orientativas a partir de los perfiles identificados en los datos."
      />

      <section className="panel">
        <div className="panel__heading">
          <div>
            <h2>Estrategias por segmento</h2>
            <p>La interpretación se desarrollará en la Fase 6.</p>
          </div>

          <span className="status-pill">Pendiente</span>
        </div>

        <EmptyState
          icon={Lightbulb}
          title="Todavía no hay perfiles comerciales"
          description="Las propuestas se generarán después de ejecutar el agrupamiento y analizar los promedios de cada segmento."
        />
      </section>
    </>
  );
}
