import { describe, expect, it } from 'vitest'
import { sampleCustomers } from '../data/sampleCustomers'
import { createCustomer, validateCustomer } from './customerService'

describe('customerService', () => {
  it('valida campos obligatorios, valores no negativos y códigos únicos', () => {
    expect(validateCustomer({ id: '', nombre: '', gastoAcumulado: 0, visitas6Meses: 0, antiguedadMeses: 0 }, sampleCustomers)).toContain('Completa')
    expect(validateCustomer({ id: 'C013', nombre: 'Eva', gastoAcumulado: -1, visitas6Meses: 0, antiguedadMeses: 0 }, sampleCustomers)).toContain('no negativos')
    expect(validateCustomer({ id: 'c001', nombre: 'Eva', gastoAcumulado: 10, visitas6Meses: 1, antiguedadMeses: 1 }, sampleCustomers)).toContain('ya está asignado')
  })

  it('normaliza el código y agrega registros válidos', () => {
    const next = createCustomer({ id: 'c013', nombre: ' Eva Mar', gastoAcumulado: 300, visitas6Meses: 2, antiguedadMeses: 3 }, sampleCustomers)

    expect(next).toHaveLength(sampleCustomers.length + 1)
    expect(next.at(-1)).toMatchObject({ id: 'C013', nombre: 'Eva Mar' })
  })
})