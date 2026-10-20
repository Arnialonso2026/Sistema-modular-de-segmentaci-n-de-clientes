import { describe, expect, it } from 'vitest'
import { buildGroupRecommendation } from './recommendationService'

const averages = { spend: 1000, visits: 8, age: 12 }

describe('buildGroupRecommendation', () => {
  it('personaliza señales y acciones para el perfil de cada grupo', () => {
    const highValue = buildGroupRecommendation({
      id: 0,
      cantidad: 4,
      gastoPromedio: 2400,
      visitasPromedio: 16,
      antiguedadPromedio: 30,
    }, averages)
    const established = buildGroupRecommendation({
      id: 1,
      cantidad: 7,
      gastoPromedio: 750,
      visitasPromedio: 3,
      antiguedadPromedio: 24,
    }, averages)

    expect(highValue.profile).toContain('alto valor')
    expect(established.profile).toContain('antiguos')
    expect(highValue.recommendation).not.toBe(established.recommendation)
    expect(highValue.proposal).not.toBe(established.proposal)
    expect(highValue.signal).toContain('4 clientes')
    expect(established.signal).toContain('7 clientes')
    expect(highValue.proposal).toContain('Grupo 1')
    expect(established.proposal).toContain('Grupo 2')
  })

  it('incluye gasto observado en la acción para elevar el ticket', () => {
    const recommendation = buildGroupRecommendation({
      id: 2,
      cantidad: 5,
      gastoPromedio: 800,
      visitasPromedio: 14,
      antiguedadPromedio: 9,
    }, averages)

    expect(recommendation.profile).toContain('frecuentes')
    expect(recommendation.proposal.replace(/\u00a0/g, ' ')).toContain('S/ 880')
    expect(recommendation.signal).toContain('75% por encima del promedio')
  })
})