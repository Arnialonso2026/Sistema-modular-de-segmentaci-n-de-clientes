export interface Customer {
  id: string
  nombre: string
  gastoAcumulado: number
  visitas6Meses: number
  antiguedadMeses: number
  segmento?: number
}

export interface SegmentGroup {
  id: number
  cantidad: number
  gastoPromedio: number
  visitasPromedio: number
  antiguedadPromedio: number
}

export interface SegmentationSummary {
  k: number
  fechaEjecucion: string
  cantidadProcesada: number
  grupos: SegmentGroup[]
  inertia: number
}

export type AppView = 'dashboard' | 'customers' | 'segmentation' | 'evaluation' | 'recommendations'

export type CustomerInput = Omit<Customer, 'segmento'>