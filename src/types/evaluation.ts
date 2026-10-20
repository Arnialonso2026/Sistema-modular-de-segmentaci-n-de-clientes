export interface EvaluationRow {
  k: number
  inertia: number
  silhouetteScore: number
  clientes: number
}

export interface ModelEvaluation {
  rows: EvaluationRow[]
  recommendedK: number | null
  elbowK: number | null
  evaluatedClients: number
  silhouetteSampled: boolean
  recommendationReason: string
}