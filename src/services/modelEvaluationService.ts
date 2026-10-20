import type { Customer } from '../types'
import type { EvaluationRow, ModelEvaluation } from '../types/evaluation'
import { euclideanDistance, fitKMeans, standardizePoints, type NumericVector } from './clusteringCore'

const MAX_SILHOUETTE_SAMPLE = 600

function getFeatures(customer: Customer): NumericVector {
  return [customer.gastoAcumulado, customer.visitas6Meses, customer.antiguedadMeses]
}

export function calculateSilhouette(points: NumericVector[], labels: number[]): { score: number; sampled: boolean } {
  if (points.length !== labels.length) throw new Error('Cada punto debe tener una etiqueta de grupo.')
  if (points.length < 3 || new Set(labels).size < 2) return { score: 0, sampled: false }

  const sampleCount = Math.min(points.length, MAX_SILHOUETTE_SAMPLE)
  const sampled = sampleCount < points.length
  let scoreSum = 0

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const pointIndex = sampled ? Math.floor(sampleIndex * points.length / sampleCount) : sampleIndex
    const ownLabel = labels[pointIndex]
    const distanceSums = new Map<number, number>()
    const memberCounts = new Map<number, number>()

    for (let otherIndex = 0; otherIndex < points.length; otherIndex += 1) {
      if (otherIndex === pointIndex) continue
      const label = labels[otherIndex]
      distanceSums.set(label, (distanceSums.get(label) ?? 0) + euclideanDistance(points[pointIndex], points[otherIndex]))
      memberCounts.set(label, (memberCounts.get(label) ?? 0) + 1)
    }

    const ownCount = (memberCounts.get(ownLabel) ?? 0)
    if (ownCount === 0) continue
    const withinMean = (distanceSums.get(ownLabel) ?? 0) / ownCount
    let nearestOtherMean = Number.POSITIVE_INFINITY
    for (const [label, count] of memberCounts) {
      if (label === ownLabel || count === 0) continue
      nearestOtherMean = Math.min(nearestOtherMean, (distanceSums.get(label) ?? 0) / count)
    }
    if (!Number.isFinite(nearestOtherMean)) continue
    const denominator = Math.max(withinMean, nearestOtherMean)
    scoreSum += denominator === 0 ? 0 : (nearestOtherMean - withinMean) / denominator
  }

  return { score: scoreSum / sampleCount, sampled }
}

export function findElbowK(rows: EvaluationRow[]): number | null {
  if (rows.length < 3) return null
  const minInertia = Math.min(...rows.map((row) => row.inertia))
  const maxInertia = Math.max(...rows.map((row) => row.inertia))
  if (maxInertia === minInertia) return null

  const first = rows[0]
  const last = rows[rows.length - 1]
  const xSpan = last.k - first.k
  let bestK: number | null = null
  let maxDeviation = 0

  for (let index = 1; index < rows.length - 1; index += 1) {
    const row = rows[index]
    const x = (row.k - first.k) / xSpan
    const y = 1 - (row.inertia - minInertia) / (maxInertia - minInertia)
    const deviation = Math.abs(y - x) / Math.SQRT2
    if (deviation > maxDeviation) {
      maxDeviation = deviation
      bestK = row.k
    }
  }

  return maxDeviation >= 0.025 ? bestK : null
}

function getRecommendationReason(recommendedK: number | null, elbowK: number | null, rows: EvaluationRow[]): string {
  if (rows.length === 0) return 'Se necesitan al menos tres clientes válidos para evaluar Silhouette.'
  if (rows.length === 1) return 'Solo hay un valor de K evaluable; se muestra su puntuación, pero no es posible comparar ni recomendar un K.'
  if (recommendedK === null) return 'No se pudo obtener una recomendación estadística con estos datos.'
  if (elbowK === null) return `K = ${recommendedK} obtuvo el Silhouette Score más alto. La curva de inercia no muestra un codo suficientemente definido.`
  if (elbowK === recommendedK) return `K = ${recommendedK} obtuvo el Silhouette Score más alto y coincide con el codo estimado de la inercia.`
  return `Silhouette favorece K = ${recommendedK}, mientras que el codo de inercia sugiere K = ${elbowK}. Compara ambos resultados antes de decidir.`
}

export function evaluateKMeans(customers: Customer[]): ModelEvaluation {
  const validCustomers = customers.filter((customer) =>
    getFeatures(customer).every((value) => Number.isFinite(value) && value >= 0),
  )
  const evaluatedClients = validCustomers.length
  const maxK = Math.min(8, evaluatedClients - 1)

  if (maxK < 2) {
    return {
      rows: [],
      recommendedK: null,
      elbowK: null,
      evaluatedClients,
      silhouetteSampled: false,
      recommendationReason: 'Se necesitan al menos tres clientes válidos para evaluar Silhouette.',
    }
  }

  const points = standardizePoints(validCustomers.map(getFeatures))
  const rows: EvaluationRow[] = []
  let silhouetteSampled = false

  for (let k = 2; k <= maxK; k += 1) {
    let best = fitKMeans(points, k, 42)
    for (let restart = 1; restart < 10; restart += 1) {
      const result = fitKMeans(points, k, 42 + restart)
      if (result.inertia < best.inertia) best = result
    }
    const silhouette = calculateSilhouette(points, best.labels)
    silhouetteSampled ||= silhouette.sampled
    rows.push({ k, inertia: best.inertia, silhouetteScore: silhouette.score, clientes: evaluatedClients })
  }

  const bestSilhouette = rows.reduce((best, row) => row.silhouetteScore > best.silhouetteScore ? row : best)
  const recommendedK = rows.length > 1 ? bestSilhouette.k : null
  const elbowK = findElbowK(rows)

  return {
    rows,
    recommendedK,
    elbowK,
    evaluatedClients,
    silhouetteSampled,
    recommendationReason: getRecommendationReason(recommendedK, elbowK, rows),
  }
}