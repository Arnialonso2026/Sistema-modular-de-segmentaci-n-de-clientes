
export interface SegmentGroup {
  id: number;
  cantidad: number;
  gastoPromedio: number;
  visitasPromedio: number;
  antiguedadPromedio: number;
}

export interface SegmentationSummary {
  k: number;
  fechaEjecucion: string;
  cantidadProcesada: number;
  grupos: SegmentGroup[];
}

export interface SegmentationRequest {
  k: number;
  customers: Array<{
    id: string;
    gastoAcumulado: number;
    visitas6Meses: number;
    antiguedadMeses: number;
  }>;
}

export interface CustomerSegmentLabel {
  id: string;
  segmento: number;
}

export interface SegmentationResponse {
  k: number;
  labels: CustomerSegmentLabel[];
  groups: SegmentGroup[];
  centroides?: number[][];
  fechaEjecucion: string;
  cantidadProcesada: number;
}
