import { describe, expect, it } from 'vitest'
import { projectPca2D } from './pcaService'

describe('projectPca2D', () => {
  it('projects customers and centroids deterministically and reports explained variance', () => {
    const points = [[-2, -1, 0], [-1, -1, 0], [1, 1, 0], [2, 1, 0]]
    const labels = [0, 0, 1, 1]
    const centroids = [[-1.5, -1, 0], [1.5, 1, 0]]
    const ids = ['A', 'B', 'C', 'D']
    const first = projectPca2D(points, labels, centroids, ids)
    const second = projectPca2D(points, labels, centroids, ids)

    expect(first).toEqual(second)
    expect(first.coordinates).toHaveLength(points.length)
    expect(first.centroids).toHaveLength(centroids.length)
    expect(first.explainedVariance[0]).toBeGreaterThan(90)
    expect(first.explainedVariance[0] + first.explainedVariance[1]).toBeCloseTo(100)
    expect(first.informative).toBe(true)
  })

  it('marks constant data as uninformative and reports zero explained variance', () => {
    const result = projectPca2D([[1, 1], [1, 1]], [0, 1], [[1, 1], [1, 1]], ['A', 'B'])

    expect(result.explainedVariance).toEqual([0, 0])
    expect(result.informative).toBe(false)
    expect(result.coordinates.every((point) => point.pc1 === 0 && point.pc2 === 0)).toBe(true)
  })

  it('rejects inconsistent point, label and dimension inputs', () => {
    expect(() => projectPca2D([[1, 2]], [0, 1], [[1, 2]], ['A'])).toThrow('Cada punto debe tener')
    expect(() => projectPca2D([[1, 2], [3]], [0, 1], [[1, 2]], ['A', 'B'])).toThrow('dimensiones válidas')
  })
})