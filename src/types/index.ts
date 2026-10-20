export interface Customer {
  id: string
  nombre: string
  gastoAcumulado: number
  visitas6Meses: number
  antiguedadMeses: number
  segmento?: number
  distanceToCentroid?: number
  distancePercentile?: number
  potentialOutlier?: boolean
}

export const clusteringFeatures = ['gastoAcumulado', 'visitas6Meses', 'antiguedadMeses'] as const
export type ClusteringFeature = typeof clusteringFeatures[number]
export type CustomerFeatureValues = Record<ClusteringFeature, number>

export interface PcaCoordinate {
  customerId: string
  pc1: number
  pc2: number
  segmento: number
}

export interface PcaCentroidCoordinate {
  segmento: number
  pc1: number
  pc2: number
}

export interface PcaProjection {
  coordinates: PcaCoordinate[]
  centroids: PcaCentroidCoordinate[]
  explainedVariance: [number, number]
  informative: boolean
}

export interface SegmentGroup {
  id: number
  cantidad: number
  gastoPromedio: number
  visitasPromedio: number
  antiguedadPromedio: number
  centroid: CustomerFeatureValues
  standardizedCentroid: number[]
  averageDistance: number
  inertia: number
  profile: SegmentProfile
  differences: Record<ClusteringFeature, number | null>
  attributes: Record<ClusteringFeature, 'alto' | 'medio' | 'bajo'>
  distanceThreshold: number | null
}

export type SegmentProfile =
  | 'Alto valor frecuente'
  | 'Frecuente de gasto moderado'
  | 'Cliente consolidado'
  | 'Actividad ocasional'
  | 'Actividad por desarrollar'

export interface SegmentationSummary {
  k: number
  fechaEjecucion: string
  cantidadProcesada: number
  grupos: SegmentGroup[]
  inertia: number
  globalAverage: CustomerFeatureValues
  pca?: PcaProjection
}

export type AppView = 'dashboard' | 'customers' | 'segmentation' | 'evaluation' | 'segment-explorer' | 'recommendations'

export type CustomerInput = Omit<Customer, 'segmento'>