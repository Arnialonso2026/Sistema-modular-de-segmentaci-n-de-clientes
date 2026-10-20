
import { BrainCircuit } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

export function SegmentationPage() {
  return (
    <>
      <PageHeader
        eyebrow="MACHINE LEARNING"
        title="Segmentación de clientes"
        description="Agrupa clientes según similitudes en gasto acumulado, frecuencia de visitas y antigüedad."
      />

      <section className="panel">
        <div className="panel__heading">
          <div>
            <h2>Configuración del modelo</h2>
            <p>El selector K y la ejecución se habilitarán en las fases 4 y 5.</p>
          </div>

          <span className="status-pill">Pendiente</span>
        </div>

        <EmptyState
          icon={BrainCircuit}
          title="Motor analítico no configurado"
          description="Esta pantalla se conectará al servicio Python para ejecutar K-Means y obtener los resultados reales."
        />
      </section>
    </>
  );
}
