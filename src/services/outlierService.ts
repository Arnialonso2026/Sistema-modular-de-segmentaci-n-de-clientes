export interface DistanceProfile {
  percentiles: number[]
  threshold: number | null
  outliers: boolean[]
}

export function profileDistances(distances: number[], minimumGroupSize = 5, percentile = 95): DistanceProfile {
  if (percentile <= 0 || percentile >= 100) throw new Error('El percentil debe estar entre 0 y 100.')
  const sorted = distances.filter(Number.isFinite).sort((left, right) => left - right)
  const position = (percentile / 100) * Math.max(sorted.length - 1, 0)
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const quantileThreshold = sorted[lowerIndex] === undefined
    ? null
    : sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * (position - lowerIndex)
  const threshold = sorted.length >= minimumGroupSize ? quantileThreshold : null
  const denominator = Math.max(sorted.length - 1, 1)
  const percentiles = distances.map((distance) => {
    const less = sorted.filter((value) => value < distance).length
    const equal = sorted.filter((value) => value === distance).length
    return sorted.length <= 1 ? 0 : ((less + (equal - 1) / 2) / denominator) * 100
  })
  const outliers = distances.map((distance, index) =>
    threshold !== null && distance >= threshold && percentiles[index] > percentile,
  )
  return { percentiles, threshold, outliers }
}