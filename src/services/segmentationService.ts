import type { Customer, SegmentationSummary, SegmentGroup } from '../types'
import type { CustomerFeatureValues } from '../types'
import { profileDistances } from './outlierService'
import { profileSegments, type SegmentGroupDraft } from './segmentProfileService'
import { projectPca2D } from './pcaService'

interface SegmentationApiResponse {
  k: number
  fechaEjecucion: string
  cantidadProcesada: number
  inertia: number
  globalAverage: CustomerFeatureValues
  labels: { id: string; segmento: number }[]
  standardizedFeatures: { id: string; values: number[] }[]
  distances: { id: string; distance: number }[]
  groups: (Omit<SegmentGroupDraft, 'distanceThreshold'>)[]
}

async function apiError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null) as { detail?: unknown } | null
  const detail = body?.detail
  if (typeof detail === 'string') return new Error(detail)
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) =>
      typeof item === 'object' && item !== null && 'msg' in item && typeof item.msg === 'string'
        ? [item.msg]
        : [],
    )
    if (messages.length) return new Error(messages.join(' '))
  }
  return new Error(`La API de segmentación respondió con el estado ${response.status}.`)
}

export async function runSegmentation(customers: Customer[], k: number): Promise<{ customers: Customer[]; summary: SegmentationSummary }> {
  const valid = customers.filter((customer) =>
    [customer.gastoAcumulado, customer.visitas6Meses, customer.antiguedadMeses]
      .every((value) => Number.isFinite(value) && value >= 0),
  )
  if (!Number.isInteger(k) || k < 2 || k > 5) throw new Error('Selecciona entre 2 y 5 segmentos.')
  if (valid.length < k) throw new Error(`Se necesitan al menos ${k} clientes válidos para ejecutar la segmentación.`)

  let response: Response
  try {
    response = await fetch('/api/segmentation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        k,
        customers: valid.map(({ id, nombre, gastoAcumulado, visitas6Meses, antiguedadMeses }) => ({
          id,
          nombre,
          gastoAcumulado,
          visitas6Meses,
          antiguedadMeses,
        })),
      }),
    })
  } catch {
    throw new Error('No se pudo conectar con la API. Inicia el backend Python y vuelve a intentarlo.')
  }
  if (!response.ok) throw await apiError(response)

  const result = await response.json() as SegmentationApiResponse
  const labelsById = new Map(result.labels.map(({ id, segmento }) => [id, segmento]))
  const distancesById = new Map(result.distances.map(({ id, distance }) => [id, distance]))
  const standardizedById = new Map(result.standardizedFeatures.map(({ id, values }) => [id, values]))
  if (valid.some((customer) => !labelsById.has(customer.id) || !distancesById.has(customer.id) || !standardizedById.has(customer.id))) {
    throw new Error('La API devolvió una respuesta incompleta para los clientes enviados.')
  }

  const labels = valid.map((customer) => labelsById.get(customer.id)!)
  const distances = valid.map((customer) => distancesById.get(customer.id)!)
  const standardized = valid.map((customer) => standardizedById.get(customer.id)!)
  const memberIndexesByGroup = Array.from({ length: k }, (_, groupId) =>
    labels.flatMap((label, index) => label === groupId ? [index] : []),
  )
  const distanceProfiles = memberIndexesByGroup.map((indexes) => profileDistances(indexes.map((index) => distances[index])))
  const groupIndexByCustomerIndex = new Map<number, number>()
  memberIndexesByGroup.forEach((indexes) => indexes.forEach((customerIndex, groupIndex) => {
    groupIndexByCustomerIndex.set(customerIndex, groupIndex)
  }))
  const distanceById = new Map(valid.map((customer, index) => {
    const groupId = labels[index]
    const groupIndex = groupIndexByCustomerIndex.get(index) ?? 0
    return [customer.id, {
      distance: distances[index],
      percentile: distanceProfiles[groupId].percentiles[groupIndex],
      potentialOutlier: distanceProfiles[groupId].outliers[groupIndex],
    }]
  }))
  const drafts: SegmentGroupDraft[] = result.groups.map((group) => ({
    ...group,
    distanceThreshold: distanceProfiles[group.id]?.threshold ?? null,
  }))
  const groups: SegmentGroup[] = profileSegments(drafts, result.globalAverage)
  const pca = projectPca2D(standardized, labels, drafts.map((group) => group.standardizedCentroid), valid.map((customer) => customer.id))
  const segmented = customers.map((customer) => {
    const distance = distanceById.get(customer.id)
    return {
      ...customer,
      segmento: labelsById.get(customer.id),
      distanceToCentroid: distance?.distance,
      distancePercentile: distance?.percentile,
      potentialOutlier: distance?.potentialOutlier,
    }
  })

  return {
    customers: segmented,
    summary: {
      k,
      fechaEjecucion: result.fechaEjecucion,
      cantidadProcesada: result.cantidadProcesada,
      grupos: groups,
      inertia: result.inertia,
      globalAverage: result.globalAverage,
      pca,
    },
  }
}