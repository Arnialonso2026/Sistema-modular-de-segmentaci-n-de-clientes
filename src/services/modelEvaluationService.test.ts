import { describe, expect, it } from 'vitest'
import { sampleCustomers } from '../data/sampleCustomers'
import { calculateSilhouette, evaluateKMeans, findElbowK } from './modelEvaluationService'

describe('calculateSilhouette', () => {
  it('scores compact, well-separated groups close to one', () => {
    const result = calculateSilhouette([[0], [0.1], [10], [10.1]], [0, 0, 1, 1])

    expect(result.score).toBeGreaterThan(0.95)
    expect(result.sampled).toBe(false)
  })

  it('returns zero for singleton clusters and validates label counts', () => {
    expect(calculateSilhouette([[0], [2], [8]], [0, 1, 1]).score).toBeGreaterThanOrEqual(-1)
    expect(() => calculateSilhouette([[0], [1]], [0])).toThrow('Cada punto debe tener una etiqueta')
  })
})

describe('evaluateKMeans', () => {
  it('evaluates every K from 2 to min(8, valid clients - 1)', () => {
    const evaluation = evaluateKMeans(sampleCustomers)

    expect(evaluation.rows.map((row) => row.k)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(evaluation.rows.every((row) => row.clientes === sampleCustomers.length)).toBe(true)
    expect(evaluation.recommendedK).toBeGreaterThanOrEqual(2)
    expect(evaluation.recommendedK).toBeLessThanOrEqual(8)
    expect(evaluation.rows.every((row) => row.silhouetteScore >= -1 && row.silhouetteScore <= 1)).toBe(true)
  })

  it('does not recommend K when there is only one evaluable candidate', () => {
    const result = evaluateKMeans(sampleCustomers.slice(0, 3))

    expect(result.rows).toHaveLength(1)
    expect(result.recommendedK).toBeNull()
    expect(result.elbowK).toBeNull()
  })

  it('ignores invalid feature rows when defining the K range', () => {
    const result = evaluateKMeans([...sampleCustomers.slice(0, 4), { ...sampleCustomers[4], visitas6Meses: Number.NaN }])

    expect(result.evaluatedClients).toBe(4)
    expect(result.rows.map((row) => row.k)).toEqual([2, 3])
  })
})

describe('findElbowK', () => {
  it('finds a strong bend and ignores linear or insufficient curves', () => {
    expect(findElbowK([
      { k: 2, inertia: 100, silhouetteScore: 0, clientes: 10 },
      { k: 3, inertia: 50, silhouetteScore: 0, clientes: 10 },
      { k: 4, inertia: 45, silhouetteScore: 0, clientes: 10 },
      { k: 5, inertia: 42, silhouetteScore: 0, clientes: 10 },
    ])).toBe(3)
    expect(findElbowK([
      { k: 2, inertia: 90, silhouetteScore: 0, clientes: 10 },
      { k: 3, inertia: 60, silhouetteScore: 0, clientes: 10 },
      { k: 4, inertia: 30, silhouetteScore: 0, clientes: 10 },
    ])).toBeNull()
    expect(findElbowK([])).toBeNull()
  })
})