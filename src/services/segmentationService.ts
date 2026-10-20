import type { Customer, SegmentationSummary, SegmentGroup } from '../types'

type Point = [number, number, number]

interface KMeansResult {
  labels: number[]
  centroids: Point[]
  inertia: number
}

const features = (customer: Customer): Point => [
  customer.gastoAcumulado,
  customer.visitas6Meses,
  customer.antiguedadMeses,
]

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

function standardize(points: Point[]): Point[] {
  const means = [0, 1, 2].map((axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length)
  const deviations = [0, 1, 2].map((axis) => Math.sqrt(
    points.reduce((sum, point) => sum + (point[axis] - means[axis]) ** 2, 0) / points.length,
  ))
  return points.map((point) => point.map((value, axis) =>
    (value - means[axis]) / (deviations[axis] || 1)) as Point)
}

const squaredDistance = (left: Point, right: Point) =>
  left.reduce((sum, value, axis) => sum + (value - right[axis]) ** 2, 0)

function initializePlusPlus(points: Point[], k: number, random: () => number): Point[] {
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
  return centroids.map((point) => [...point] as Point)
}

function runKMeans(points: Point[], k: number, seed: number): KMeansResult {
  const random = seededRandom(seed)
  let centroids = initializePlusPlus(points, k, random)
  let labels = points.map(() => -1)

  for (let iteration = 0; iteration < 300; iteration += 1) {
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
        return [...points[farthestIndex]] as Point
      }
      return [0, 1, 2].map((axis) => members.reduce((sum, point) => sum + point[axis], 0) / members.length) as Point
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

export function runSegmentation(customers: Customer[], k: number): { customers: Customer[]; summary: SegmentationSummary } {
  const valid = customers.filter((customer) =>
    [customer.gastoAcumulado, customer.visitas6Meses, customer.antiguedadMeses]
      .every((value) => Number.isFinite(value) && value >= 0),
  )
  if (!Number.isInteger(k) || k < 2 || k > 5) throw new Error('Selecciona entre 2 y 5 segmentos.')
  if (valid.length < k) throw new Error(`Se necesitan al menos ${k} clientes válidos para ejecutar la segmentación.`)

  const scaled = standardize(valid.map(features))
  let best: KMeansResult | undefined
  for (let restart = 0; restart < 10; restart += 1) {
    const result = runKMeans(scaled, k, 42 + restart)
    if (!best || result.inertia < best.inertia) best = result
  }
  if (!best) throw new Error('No fue posible calcular la segmentación.')

  const assignments = new Map(valid.map((customer, index) => [customer.id, best!.labels[index]]))
  const segmented = customers.map((customer) => ({ ...customer, segmento: assignments.get(customer.id) }))
  const groups: SegmentGroup[] = Array.from({ length: k }, (_, id) => {
    const members = valid.filter((_, index) => best!.labels[index] === id)
    const mean = (pick: (customer: Customer) => number) => members.length
      ? members.reduce((sum, customer) => sum + pick(customer), 0) / members.length
      : 0
    return {
      id,
      cantidad: members.length,
      gastoPromedio: mean((customer) => customer.gastoAcumulado),
      visitasPromedio: mean((customer) => customer.visitas6Meses),
      antiguedadPromedio: mean((customer) => customer.antiguedadMeses),
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
    },
  }
}