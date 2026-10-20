import { describe, expect, it } from 'vitest'
import { profileDistances } from './outlierService'

describe('profileDistances', () => {
  it('marks only upper-tail distances in sufficiently large groups', () => {
    const result = profileDistances([0.1, 0.2, 0.3, 0.4, 0.5, 1.7], 5, 80)

    expect(result.threshold).toBeCloseTo(0.5)
    expect(result.outliers).toEqual([false, false, false, false, false, true])
    expect(result.percentiles[5]).toBe(100)
  })

  it('leaves small groups without an outlier threshold', () => {
    const result = profileDistances([0.1, 0.2, 2])

    expect(result.threshold).toBeNull()
    expect(result.outliers).toEqual([false, false, false])
  })

  it('can flag the upper tail when a segment has the minimum supported size', () => {
    const result = profileDistances([0.1, 0.2, 0.3, 0.4, 1.5])

    expect(result.threshold).toBeLessThan(1.5)
    expect(result.outliers).toEqual([false, false, false, false, true])
  })
})