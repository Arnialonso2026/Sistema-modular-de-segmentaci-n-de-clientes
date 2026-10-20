import type { PcaCentroidCoordinate, PcaCoordinate, PcaProjection } from '../types'
import type { NumericVector } from './clusteringCore'

interface EigenSystem {
  values: number[]
  vectors: NumericVector[]
}

function jacobiEigenSystem(matrix: number[][]): EigenSystem {
  const dimensions = matrix.length
  const values = matrix.map((row) => [...row])
  const vectors = Array.from({ length: dimensions }, (_, row) =>
    Array.from({ length: dimensions }, (_, column) => Number(row === column)),
  )

  for (let iteration = 0; iteration < dimensions * dimensions * 50; iteration += 1) {
    let p = 0
    let q = 0
    let largest = 0
    for (let row = 0; row < dimensions; row += 1) {
      for (let column = row + 1; column < dimensions; column += 1) {
        if (Math.abs(values[row][column]) > largest) {
          p = row
          q = column
          largest = Math.abs(values[row][column])
        }
      }
    }
    if (largest < 1e-12) break

    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p])
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const diagonalP = values[p][p]
    const diagonalQ = values[q][q]
    const offDiagonal = values[p][q]

    for (let index = 0; index < dimensions; index += 1) {
      if (index === p || index === q) continue
      const valueP = values[index][p]
      const valueQ = values[index][q]
      values[index][p] = cosine * valueP - sine * valueQ
      values[p][index] = values[index][p]
      values[index][q] = sine * valueP + cosine * valueQ
      values[q][index] = values[index][q]
    }
    values[p][p] = cosine ** 2 * diagonalP - 2 * sine * cosine * offDiagonal + sine ** 2 * diagonalQ
    values[q][q] = sine ** 2 * diagonalP + 2 * sine * cosine * offDiagonal + cosine ** 2 * diagonalQ
    values[p][q] = 0
    values[q][p] = 0

    for (let row = 0; row < dimensions; row += 1) {
      const vectorP = vectors[row][p]
      const vectorQ = vectors[row][q]
      vectors[row][p] = cosine * vectorP - sine * vectorQ
      vectors[row][q] = sine * vectorP + cosine * vectorQ
    }
  }

  const order = Array.from({ length: dimensions }, (_, index) => index)
    .sort((left, right) => values[right][right] - values[left][left])
  const eigenvalues = order.map((index) => Math.max(0, values[index][index]))
  const eigenvectors = order.map((index) => {
    const vector = vectors.map((row) => row[index])
    const largestIndex = vector.reduce((best, value, candidate) =>
      Math.abs(value) > Math.abs(vector[best]) ? candidate : best, 0)
    return vector[largestIndex] < 0 ? vector.map((value) => -value) : vector
  })
  return { values: eigenvalues, vectors: eigenvectors }
}

export function projectPca2D(
  points: NumericVector[],
  labels: number[],
  centroids: NumericVector[],
  customerIds: string[],
): PcaProjection {
  if (points.length !== labels.length || points.length !== customerIds.length) {
    throw new Error('Cada punto debe tener un cliente y una etiqueta de grupo.')
  }
  if (points.length === 0) {
    return { coordinates: [], centroids: [], explainedVariance: [0, 0], informative: false }
  }
  const dimensions = points[0].length
  if (dimensions === 0 || points.some((point) => point.length !== dimensions || point.some((value) => !Number.isFinite(value)))) {
    throw new Error('Los puntos PCA deben tener dimensiones válidas y consistentes.')
  }
  if (centroids.some((centroid) => centroid.length !== dimensions || centroid.some((value) => !Number.isFinite(value)))) {
    throw new Error('Los centroides deben tener las mismas dimensiones válidas que los puntos.')
  }

  const means = Array.from({ length: dimensions }, (_, axis) =>
    points.reduce((sum, point) => sum + point[axis], 0) / points.length,
  )
  const centered = points.map((point) => point.map((value, axis) => value - means[axis]))
  const covariance = Array.from({ length: dimensions }, (_, row) =>
    Array.from({ length: dimensions }, (_, column) =>
      centered.reduce((sum, point) => sum + point[row] * point[column], 0) / points.length,
    ),
  )
  const eigenSystem = jacobiEigenSystem(covariance)
  const totalVariance = eigenSystem.values.reduce((sum, value) => sum + value, 0)
  const componentCount = Math.min(2, dimensions)
  const components = [0, 1].map((index) => eigenSystem.vectors[index] ?? Array.from({ length: dimensions }, () => 0))
  const explainedVariance = [0, 1].map((index) =>
    index < componentCount && totalVariance > 0 ? (eigenSystem.values[index] / totalVariance) * 100 : 0,
  ) as [number, number]
  const project = (point: NumericVector) => components.map((component) =>
    point.reduce((sum, value, axis) => sum + (value - means[axis]) * component[axis], 0),
  )

  const coordinates: PcaCoordinate[] = points.map((point, index) => {
    const [pc1, pc2] = project(point)
    return { customerId: customerIds[index], pc1, pc2, segmento: labels[index] }
  })
  const projectedCentroids: PcaCentroidCoordinate[] = centroids.map((centroid, segmento) => {
    const [pc1, pc2] = project(centroid)
    return { segmento, pc1, pc2 }
  })

  return {
    coordinates,
    centroids: projectedCentroids,
    explainedVariance,
    informative: totalVariance > 1e-12 && explainedVariance.some((variance) => variance > 1e-8),
  }
}