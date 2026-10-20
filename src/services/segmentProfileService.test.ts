import { describe, expect, it } from 'vitest'
import { percentageDifference, profileSegments, type SegmentGroupDraft } from './segmentProfileService'

const baseGroup: SegmentGroupDraft = {
  id: 1,
  cantidad: 8,
  gastoPromedio: 1500,
  visitasPromedio: 14,
  antiguedadPromedio: 18,
  centroid: { gastoAcumulado: 1500, visitas6Meses: 14, antiguedadMeses: 18 },
  standardizedCentroid: [1, 1, 1],
  averageDistance: 0.4,
  inertia: 2,
  distanceThreshold: 0.8,
}

describe('segmentProfileService', () => {
  it('computes percentage differences and avoids division by zero', () => {
    expect(percentageDifference(150, 100)).toBe(50)
    expect(percentageDifference(10, 0)).toBeNull()
  })

  it('creates relative attributes and descriptive non-technical profile names', () => {
    const [profiled] = profileSegments([baseGroup], { gastoAcumulado: 1000, visitas6Meses: 10, antiguedadMeses: 12 })

    expect(profiled.profile).toBe('Alto valor frecuente')
    expect(profiled.attributes).toEqual({ gastoAcumulado: 'alto', visitas6Meses: 'alto', antiguedadMeses: 'alto' })
    expect(profiled.differences.gastoAcumulado).toBeCloseTo(50)
    expect(profiled.differences.visitas6Meses).toBeCloseTo(40)
    expect(profiled.differences.antiguedadMeses).toBeCloseTo(50)
    expect(profiled.id).toBe(1)
  })
})