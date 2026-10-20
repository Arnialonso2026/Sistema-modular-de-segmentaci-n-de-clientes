export type NumericVector = number[]

export interface KMeansResult {
  labels: number[]
  centroids: NumericVector[]
  inertia: number
}

export function standardizePoints(points: NumericVector[]): NumericVector[] {
  if (points.length === 0) return []
  const dimensions = points[0].length
  const means = Array.from({ length: dimensions }, (_, axis) =>
    points.reduce((sum, point) => sum + point[axis], 0) / points.length,
  )
  const deviations = Array.from({ length: dimensions }, (_, axis) => Math.sqrt(
    points.reduce((sum, point) => sum + (point[axis] - means[axis]) ** 2, 0) / points.length,
  ))
  return points.map((point) => point.map((value, axis) => (value - means[axis]) / (deviations[axis] || 1)))
}

export function euclideanDistance(left: NumericVector, right: NumericVector): number {
  return Math.sqrt(left.reduce((sum, value, axis) => sum + (value - right[axis]) ** 2, 0))
}

function squaredDistance(left: NumericVector, right: NumericVector): number {
  return left.reduce((sum, value, axis) => sum + (value - right[axis]) ** 2, 0)
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function initializePlusPlus(points: NumericVector[], k: number, random: () => number): NumericVector[] {
  const centroids = [points[Math.floor(random() * points.length)]]
  while (centroids.length < k) {
    const distances = points.map((point) => Math.min(...centroids.map((center) => squaredDistance(point, center))))
    const total = distances.reduce((sum, value) => sum + value, 0)
    if (total === 0) {
      centroids.push(points.find((point) => !centroids.includes(point)) ?? points[centroids.length % points.length])
      continue
    }
    let target = random() * total
    let selected = points[points.length - 1]
    for (let index = 0; index < points.length; index += 1) {
      target -= distances[index]
      if (target <= 0) {
        selected = points[index]
        break
      }
    }
    centroids.push(selected)
  }
  return centroids.map((point) => [...point])
}

export function fitKMeans(points: NumericVector[], k: number, seed: number, maxIterations = 300): KMeansResult {
  const random = seededRandom(seed)
  let centroids = initializePlusPlus(points, k, random)
  let labels = points.map(() => -1)

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const nextLabels = points.map((point) => {
      let nearest = 0
      let nearestDistance = squaredDistance(point, centroids[0])
      for (let index = 1; index < centroids.length; index += 1) {
        const distance = squaredDistance(point, centroids[index])
        if (distance < nearestDistance) {
          nearest = index
          nearestDistance = distance
        }
      }
      return nearest
    })

    const nextCentroids = centroids.map((_, group) => {
      const members = points.filter((_, index) => nextLabels[index] === group)
      if (members.length === 0) {
        const farthestIndex = points.reduce((best, point, index) => {
          const current = squaredDistance(point, centroids[nextLabels[index]])
          return current > best.distance ? { index, distance: current } : best
        }, { index: 0, distance: -1 }).index
        return [...points[farthestIndex]]
      }
      return Array.from({ length: points[0].length }, (_, axis) =>
        members.reduce((sum, point) => sum + point[axis], 0) / members.length,
      )
    })
    const converged = nextLabels.every((label, index) => label === labels[index])
      && nextCentroids.every((center, index) => squaredDistance(center, centroids[index]) < 1e-12)
    labels = nextLabels
    centroids = nextCentroids
    if (converged) break
  }

  const inertia = points.reduce((sum, point, index) => sum + squaredDistance(point, centroids[labels[index]]), 0)
  return { labels, centroids, inertia }
}