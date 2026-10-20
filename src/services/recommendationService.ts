import type { SegmentGroup } from '../types'

export interface RecommendationAverages {
  spend: number
  visits: number
  age: number
}

type RecommendationGroup = Pick<
  SegmentGroup,
  'id' | 'cantidad' | 'gastoPromedio' | 'visitasPromedio' | 'antiguedadPromedio'
> & Pick<SegmentGroup, 'attributes'>

const money = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
})

const quantity = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

function compareToAverage(value: number, average: number): string {
  if (average === 0) return value === 0 ? 'en el promedio' : 'por encima del promedio'
  const difference = ((value - average) / average) * 100
  if (Math.abs(difference) < 5) return 'cerca del promedio'
  return `${Math.round(Math.abs(difference))}% ${difference > 0 ? 'por encima' : 'por debajo'} del promedio`
}

export function buildGroupRecommendation(group: RecommendationGroup, averages: RecommendationAverages) {
  const groupName = `Grupo ${group.id + 1}`
  const spendComparison = compareToAverage(group.gastoPromedio, averages.spend)
  const visitsComparison = compareToAverage(group.visitasPromedio, averages.visits)
  const ageComparison = compareToAverage(group.antiguedadPromedio, averages.age)
  const signal = `${group.cantidad} clientes; gasto medio ${money.format(group.gastoPromedio)} (${spendComparison}), ${quantity.format(group.visitasPromedio)} visitas en 6 meses (${visitsComparison}) y ${quantity.format(group.antiguedadPromedio)} meses de antigüedad (${ageComparison}).`

  const highSpend = group.attributes.gastoAcumulado === 'alto'
  const frequent = group.attributes.visitas6Meses === 'alto'
  const established = group.attributes.antiguedadMeses === 'alto'

  if (highSpend && frequent) return {
    profile: 'Clientes de alto valor y actividad',
    signal,
    recommendation: `En ${groupName}, el gasto y las visitas superan claramente la media. Prioriza retención y reconocimiento, no descuentos generales.`,
    proposal: `Prueba durante dos semanas un beneficio de fidelidad para ${groupName} (${group.cantidad} clientes) y mide cuántos repiten compra en los siguientes 30 días.`,
  }

  if (frequent && !highSpend) return {
    profile: 'Clientes frecuentes con oportunidad de ampliar su compra',
    signal,
    recommendation: `En ${groupName}, la frecuencia (${quantity.format(group.visitasPromedio)} visitas) destaca frente al gasto medio (${money.format(group.gastoPromedio)}). Busca aumentar el valor por visita con complementos relevantes.`,
    proposal: `Ensaya para ${groupName} (${group.cantidad} clientes) una recomendación de producto complementario y un umbral de compra de ${money.format(group.gastoPromedio * 1.1)}; compara el ticket con el actual.`,
  }

  if (highSpend) return {
    profile: 'Alto gasto con oportunidad de recompra',
    signal,
    recommendation: `En ${groupName}, el gasto medio es alto pero la frecuencia no acompaña. Enfoca la acción en acortar el tiempo hasta la próxima visita.`,
    proposal: `Envía a ${groupName} (${group.cantidad} clientes) un recordatorio de recompra con una selección de productos de la tienda y mide las visitas recuperadas en 30 días.`,
  }

  if (established && !frequent) return {
    profile: 'Clientes antiguos con menor actividad reciente',
    signal,
    recommendation: `En ${groupName}, la relación es más larga (${quantity.format(group.antiguedadPromedio)} meses), pero las visitas están ${visitsComparison}. Prioriza reactivación y reconocimiento de antigüedad.`,
    proposal: `Prueba para ${groupName} (${group.cantidad} clientes) una invitación de regreso con un beneficio de una sola vez y mide la tasa de retorno durante el próximo mes.`,
  }

  return {
    profile: 'Clientes con actividad por desarrollar',
    signal,
    recommendation: `En ${groupName}, el gasto y la frecuencia ofrecen margen de crecimiento. Empieza con un incentivo pequeño y medible, ajustado al tamaño del grupo.`,
    proposal: `Envía a ${groupName} (${group.cantidad} clientes) una oferta de primera recompra y compara su conversión con el gasto medio actual de ${money.format(group.gastoPromedio)} antes de ampliar la campaña.`,
  }
}