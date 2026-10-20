import type { Customer, SegmentationSummary, SegmentGroup } from '../types'
import { fitKMeans, standardizePoints, type KMeansResult } from './clusteringCore'

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