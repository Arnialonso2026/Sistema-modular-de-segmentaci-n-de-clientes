import type { Customer, SegmentationSummary, SegmentGroup } from '../types'
import { clusteringFeatures, type CustomerFeatureValues } from '../types'
import { euclideanDistance, fitKMeans, standardizePoints, type KMeansResult } from './clusteringCore'
import { profileDistances } from './outlierService'
import { profileSegments, type SegmentGroupDraft } from './segmentProfileService'
import { projectPca2D } from './pcaService'

type Point = [number, number, number]

const features = (customer: Customer): Point => [
  customer.gastoAcumulado,
  customer.visitas6Meses,
  customer.antiguedadMeses,
]

export function runSegmentation(customers: Customer[], k: number): { customers: Customer[]; summary: SegmentationSummary } {
  const valid = customers.filter((customer) =>
    [customer.gastoAcumulado, customer.visitas6Meses, customer.antiguedadMeses]
      .every((value) => Number.isFinite(value) && value >= 0),
  )
  if (!Number.isInteger(k) || k < 2 || k > 5) throw new Error('Selecciona entre 2 y 5 segmentos.')
  if (valid.length < k) throw new Error(`Se necesitan al menos ${k} clientes válidos para ejecutar la segmentación.`)

  const scaled = standardizePoints(valid.map(features))
  let best: KMeansResult | undefined
  for (let restart = 0; restart < 10; restart += 1) {
    const result = fitKMeans(scaled, k, 42 + restart)
    if (!best || result.inertia < best.inertia) best = result
  }
  if (!best) throw new Error('No fue posible calcular la segmentación.')

  const assignments = new Map(valid.map((customer, index) => [customer.id, best!.labels[index]]))
  const pca = projectPca2D(scaled, best.labels, best.centroids, valid.map((customer) => customer.id))
  const distances = valid.map((_, index) => euclideanDistance(scaled[index], best!.centroids[best!.labels[index]]))
  const distanceProfiles = Array.from({ length: k }, (_, id) => {
    const groupDistances = valid.flatMap((_, index) => best!.labels[index] === id ? [distances[index]] : [])
    return profileDistances(groupDistances)
  })
  const distanceById = new Map(valid.map((customer, index) => [customer.id, {
    distance: distances[index],
    percentile: distanceProfiles[best!.labels[index]].percentiles[
      valid.slice(0, index).filter((_, priorIndex) => best!.labels[priorIndex] === best!.labels[index]).length
    ],
    potentialOutlier: distanceProfiles[best!.labels[index]].outliers[
      valid.slice(0, index).filter((_, priorIndex) => best!.labels[priorIndex] === best!.labels[index]).length
    ],
  }]))
  const globalAverage = Object.fromEntries(clusteringFeatures.map((feature) => [
    feature,
    valid.reduce((sum, customer) => sum + customer[feature], 0) / valid.length,
  ])) as CustomerFeatureValues
  const drafts: SegmentGroupDraft[] = Array.from({ length: k }, (_, id) => {
    const memberIndexes = valid.flatMap((_, index) => best!.labels[index] === id ? [index] : [])
    const members = memberIndexes.map((index) => valid[index])
    const mean = (feature: keyof CustomerFeatureValues) => members.length
      ? members.reduce((sum, customer) => sum + customer[feature], 0) / members.length
      : 0
    const centroid = {
      gastoAcumulado: mean('gastoAcumulado'),
      visitas6Meses: mean('visitas6Meses'),
      antiguedadMeses: mean('antiguedadMeses'),
    }
    const groupDistances = memberIndexes.map((index) => distances[index])
    return {
      id,
      cantidad: members.length,
      gastoPromedio: centroid.gastoAcumulado,
      visitasPromedio: centroid.visitas6Meses,
      antiguedadPromedio: centroid.antiguedadMeses,
      centroid,
      standardizedCentroid: best!.centroids[id],
      averageDistance: groupDistances.length ? groupDistances.reduce((sum, distance) => sum + distance, 0) / groupDistances.length : 0,
      inertia: groupDistances.reduce((sum, distance) => sum + distance ** 2, 0),
      distanceThreshold: distanceProfiles[id].threshold,
    }
  })
  const groups: SegmentGroup[] = profileSegments(drafts, globalAverage)
  const segmented = customers.map((customer) => {
    const distance = distanceById.get(customer.id)
    return {
      ...customer,
      segmento: assignments.get(customer.id),
      distanceToCentroid: distance?.distance,
      distancePercentile: distance?.percentile,
      potentialOutlier: distance?.potentialOutlier,
    }
  })

  return {
    customers: segmented,
    summary: {
      k,
      fechaEjecucion: new Date().toISOString(),
      cantidadProcesada: valid.length,
      grupos: groups,
      inertia: best.inertia,
      globalAverage,
      pca,
    },
  }
}