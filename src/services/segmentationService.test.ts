import { describe, expect, it } from 'vitest'
import { sampleCustomers } from '../data/sampleCustomers'
import { runSegmentation } from './segmentationService'

describe('runSegmentation', () => {
  it('asigna todos los clientes a K grupos y resume promedios', () => {
    const result = runSegmentation(sampleCustomers, 3)

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
  })

  it('produce asignaciones reproducibles', () => {
    const first = runSegmentation(sampleCustomers, 3)
    const second = runSegmentation(sampleCustomers, 3)

    expect(first.customers.map((customer) => customer.segmento)).toEqual(second.customers.map((customer) => customer.segmento))
    expect(first.summary.inertia).toBe(second.summary.inertia)
  })

  it('rechaza K fuera del rango permitido o más clientes de los disponibles', () => {
    expect(() => runSegmentation(sampleCustomers, 1)).toThrow('Selecciona entre 2 y 5 segmentos.')
    expect(() => runSegmentation(sampleCustomers.slice(0, 2), 3)).toThrow('Se necesitan al menos 3 clientes válidos')
  })

  it('omite datos incompletos o negativos del cálculo', () => {
    const customers = [...sampleCustomers.slice(0, 5), { ...sampleCustomers[5], gastoAcumulado: -1 }]
    const result = runSegmentation(customers, 2)

    expect(result.summary.cantidadProcesada).toBe(5)
    expect(result.customers.find((customer) => customer.id === 'C006')?.segmento).toBeUndefined()
  })
})