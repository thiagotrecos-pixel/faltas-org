import { Materia, Aula, MateriaStats } from '@/types'

/**
 * Premissas do projeto:
 * - Limite de faltas = 25% da carga horária da matéria (ex: 60h -> 15h)
 * - Alerta dispara quando as faltas chegam a 75% do limite (ex: 15h * 0.75 = 11.25h)
 */

export function calcularLimiteFaltas(cargaHoraria: number): number {
  if (!cargaHoraria || cargaHoraria <= 0) return 0
  // 25% da carga horária
  return Math.round(cargaHoraria * 0.25 * 10) / 10
}

export function calcularStatsMateria(materia: Materia, aulasDaMateria: Aula[]): MateriaStats {
  const horasPadraoAula =
    materia.horas_por_aula && materia.horas_por_aula > 0 ? materia.horas_por_aula : 2
  const limiteFaltas =
    materia.limite_faltas > 0 ? materia.limite_faltas : calcularLimiteFaltas(materia.carga_horaria)

  let totalPresencas = 0
  let totalFaltas = 0
  let totalPrevistas = 0
  let horasFaltas = 0
  let horasPresencas = 0

  for (const aula of aulasDaMateria) {
    const duracao = aula.horas && aula.horas > 0 ? aula.horas : horasPadraoAula
    if (aula.status === 'presenca') {
      totalPresencas += 1
      horasPresencas += duracao
    } else if (aula.status === 'falta') {
      totalFaltas += 1
      horasFaltas += duracao
    } else if (aula.status === 'prevista') {
      totalPrevistas += 1
    }
  }

  const horasTotalRealizadas = horasPresencas + horasFaltas
  const percentualFaltasCarga =
    materia.carga_horaria > 0 ? Math.round((horasFaltas / materia.carga_horaria) * 1000) / 10 : 0

  const percentualLimiteConsumido =
    limiteFaltas > 0 ? Math.round((horasFaltas / limiteFaltas) * 1000) / 10 : 0

  const faltasRestantesHoras = Math.max(0, Math.round((limiteFaltas - horasFaltas) * 10) / 10)
  const aulasRestantesPossiveis = Math.max(0, Math.floor(faltasRestantesHoras / horasPadraoAula))

  const isEstourado = horasFaltas > limiteFaltas
  // Alerta quando as faltas chegam a 75% do limite
  const isAlerta = !isEstourado && percentualLimiteConsumido >= 75

  let statusAlerta: 'seguro' | 'alerta' | 'reprovado' = 'seguro'
  if (isEstourado) {
    statusAlerta = 'reprovado'
  } else if (isAlerta) {
    statusAlerta = 'alerta'
  }

  return {
    materia,
    totalAulas: aulasDaMateria.length,
    totalPresencas,
    totalFaltas,
    totalPrevistas,
    horasFaltas,
    horasPresencas,
    horasTotalRealizadas,
    percentualFaltasCarga,
    percentualLimiteConsumido,
    faltasRestantesHoras,
    aulasRestantesPossiveis,
    isAlerta,
    isEstourado,
    statusAlerta,
  }
}
