import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleCustomers } from '../data/sampleCustomers'
import { runSegmentation } from './segmentationService'

function apiResult(customers = sampleCustomers, k = 3) {
  const average = (feature: 'gastoAcumulado' | 'visitas6Meses' | 'antiguedadMeses') =>
    customers.reduce((sum, customer) => sum + customer[feature], 0) / customers.length
  const labels = customers.map((customer, index) => ({ id: customer.id, segmento: index % k }))
  const standardizedFeatures = customers.map((customer, index) => ({
    id: customer.id,
    values: [index, index * 2, index * 3],
  }))
  const distances = customers.map((customer, index) => ({ id: customer.id, distance: index / 10 }))
  const groups = Array.from({ length: k }, (_, id) => {
    const members = customers.filter((_, index) => index % k === id)
    const centroid = {
      gastoAcumulado: members.reduce((sum, customer) => sum + customer.gastoAcumulado, 0) / members.length,
      visitas6Meses: members.reduce((sum, customer) => sum + customer.visitas6Meses, 0) / members.length,
      antiguedadMeses: members.reduce((sum, customer) => sum + customer.antiguedadMeses, 0) / members.length,
    }
    return {
      id,
      cantidad: members.length,
      gastoPromedio: centroid.gastoAcumulado,
      visitasPromedio: centroid.visitas6Meses,
      antiguedadPromedio: centroid.antiguedadMeses,
      centroid,
      standardizedCentroid: [id, id, id],
      averageDistance: 0.1,
      inertia: 0.2,
    }
  })

  return {
    k,
    fechaEjecucion: '2026-10-20T00:00:00Z',
    cantidadProcesada: customers.length,
    inertia: 0.6,
    globalAverage: {
      gastoAcumulado: average('gastoAcumulado'),
      visitas6Meses: average('visitas6Meses'),
      antiguedadMeses: average('antiguedadMeses'),
    },
    labels,
    standardizedFeatures,
    distances,
    groups,
  }
}

function stubApi(result = apiResult()) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => result,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('runSegmentation', () => {
  it('envía los datos a la API y completa perfiles y PCA', async () => {
    const fetchMock = stubApi()
    const result = await runSegmentation(sampleCustomers, 3)

    expect(fetchMock).toHaveBeenCalledWith('/api/segmentation/run', expect.objectContaining({ method: 'POST' }))
    expect(result.customers).toHaveLength(sampleCustomers.length)
    expect(result.summary.grupos).toHaveLength(3)
    expect(result.summary.grupos.reduce((total, group) => total + group.cantidad, 0)).toBe(sampleCustomers.length)
    expect(result.customers.every((customer) => Number.isInteger(customer.segmento))).toBe(true)
    expect(result.summary.cantidadProcesada).toBe(sampleCustomers.length)
    expect(result.summary.inertia).toBeGreaterThanOrEqual(0)
    expect(result.summary.grupos.every((group) => group.standardizedCentroid.length === 3)).toBe(true)
    expect(result.summary.grupos.every((group) => Number.isFinite(group.centroid.gastoAcumulado))).toBe(true)
    expect(result.customers.every((customer) => Number.isFinite(customer.distanceToCentroid))).toBe(true)
    expect(result.customers.every((customer) => Number.isFinite(customer.distancePercentile))).toBe(true)
    expect(result.summary.pca?.coordinates).toHaveLength(sampleCustomers.length)
  })

  it('rechaza K inválido o insuficientes clientes antes de llamar a la API', async () => {
    const fetchMock = stubApi()

    await expect(runSegmentation(sampleCustomers, 1)).rejects.toThrow('Selecciona entre 2 y 5 segmentos.')
    await expect(runSegmentation(sampleCustomers.slice(0, 2), 3)).rejects.toThrow('Se necesitan al menos 3 clientes válidos')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envía solo clientes válidos y conserva los inválidos sin asignación', async () => {
    const customers = [...sampleCustomers.slice(0, 5), { ...sampleCustomers[5], gastoAcumulado: -1 }]
    const fetchMock = stubApi(apiResult(customers.slice(0, 5), 2))
    const result = await runSegmentation(customers, 2)

    expect(result.summary.cantidadProcesada).toBe(5)
    expect(result.customers.find((customer) => customer.id === 'C006')?.segmento).toBeUndefined()
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { customers: unknown[] }
    expect(request.customers).toHaveLength(5)
  })

  it('expone errores de la API y avisa si no está disponible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Datos inválidos.' }),
    }))
    await expect(runSegmentation(sampleCustomers, 3)).rejects.toThrow('Datos inválidos.')

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(runSegmentation(sampleCustomers, 3)).rejects.toThrow('Inicia el backend Python')
  })
})