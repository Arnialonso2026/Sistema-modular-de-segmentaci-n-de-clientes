import { clusteringFeatures, type ClusteringFeature, type CustomerFeatureValues, type SegmentGroup, type SegmentProfile } from '../types'

export type SegmentGroupDraft = Omit<SegmentGroup, 'profile' | 'differences' | 'attributes'>

function classify(value: number, average: number): 'alto' | 'medio' | 'bajo' {
  if (average === 0) return value === 0 ? 'medio' : value > 0 ? 'alto' : 'bajo'
  if (value >= average * 1.15) return 'alto'
  if (value <= average * 0.85) return 'bajo'
  return 'medio'
}

function describe(attributes: Record<ClusteringFeature, 'alto' | 'medio' | 'bajo'>): SegmentProfile {
  const { gastoAcumulado, visitas6Meses, antiguedadMeses } = attributes
  if (gastoAcumulado === 'alto' && visitas6Meses === 'alto') return 'Alto valor frecuente'
  if (visitas6Meses === 'alto' && gastoAcumulado !== 'alto') return 'Frecuente de gasto moderado'
  if (antiguedadMeses === 'alto' && visitas6Meses !== 'alto') return 'Cliente consolidado'
  if (visitas6Meses === 'bajo' && gastoAcumulado === 'bajo') return 'Actividad ocasional'
  return 'Actividad por desarrollar'
}

export function percentageDifference(value: number, globalAverage: number): number | null {
  if (globalAverage === 0) return null
  return ((value / globalAverage) - 1) * 100
}

export function profileSegments(groups: SegmentGroupDraft[], globalAverage: CustomerFeatureValues): SegmentGroup[] {
  return groups.map((group) => {
    const attributes = Object.fromEntries(clusteringFeatures.map((feature) => [
      feature,
      classify(group.centroid[feature], globalAverage[feature]),
    ])) as Record<ClusteringFeature, 'alto' | 'medio' | 'bajo'>
    const differences = Object.fromEntries(clusteringFeatures.map((feature) => [
      feature,
      percentageDifference(group.centroid[feature], globalAverage[feature]),
    ])) as Record<ClusteringFeature, number | null>
    return { ...group, attributes, differences, profile: describe(attributes) }
  })
}