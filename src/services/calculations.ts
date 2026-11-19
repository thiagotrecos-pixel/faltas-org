import { Materia, Aula, MateriaStats } from '@/types'
import { PERCENTUAL_AVISO_PADRAO } from './configuracoes'

/**
 * Premissas do projeto:
 * - Limite de faltas = 25% da carga horária da matéria (ex: 60h -> 15h),
 *   a menos que a matéria tenha um percentual de reprovação próprio.
 * - Alerta dispara quando a matéria atinge o gatilho por PERCENTUAL da cota
 *   (padrão 75%, editável globalmente e por matéria) OU o gatilho por FALTAS
 *   RESTANTES (número global e/ou próprio da matéria) — o que ocorrer primeiro.
 */

/** Percentual de reprovação padrão do app (25% da carga horária). */
export const PERCENTUAL_REPROVACAO_PADRAO = 25

export function calcularLimiteFaltas(
  cargaHoraria: number,
  percentualReprovacao: number = PERCENTUAL_REPROVACAO_PADRAO,
): number {
  if (!cargaHoraria || cargaHoraria <= 0) return 0
  const pct =
    percentualReprovacao > 0
      ? Math.min(99, Math.max(1, percentualReprovacao))
      : PERCENTUAL_REPROVACAO_PADRAO
  return Math.round(cargaHoraria * (pct / 100) * 10) / 10
}

/**
 * Percentual de reprovação da matéria: o valor específico quando preenchido
 * (1–99), senão o padrão do app (25% da carga horária).
 */
export function percentualReprovacaoMateria(materia: Materia): number {
  const especifico = materia.percentual_reprovacao
  if (especifico && especifico > 0) {
    return Math.min(99, Math.max(1, especifico))
  }
  return PERCENTUAL_REPROVACAO_PADRAO
}

/** Limite de faltas da matéria respeitando o percentual de reprovação próprio. */
export function limiteFaltasMateria(materia: Materia): number {
  if (materia.limite_faltas > 0) return materia.limite_faltas
  const percentual = percentualReprovacaoMateria(materia) / 100
  return Math.round(materia.carga_horaria * percentual * 10) / 10
}

/**
 * Percentual de aviso da matéria: o valor específico da matéria quando
 * preenchido (1–99), senão o percentual global configurado.
 */
export function percentualAvisoMateria(
  materia: Materia,
  percentualGlobal: number = PERCENTUAL_AVISO_PADRAO,
): number {
  const especifico = materia.percentual_aviso
  if (especifico && especifico > 0) {
    return Math.min(99, Math.max(1, especifico))
  }
  const global = percentualGlobal > 0 ? percentualGlobal : PERCENTUAL_AVISO_PADRAO
  return Math.min(99, Math.max(1, global))
}

/**
 * Gatilho por faltas restantes da matéria: o menor valor entre o próprio
 * da matéria e o global (o que ocorrer primeiro). Null = gatilho desativado.
 */
export function gatilhoFaltasRestantesMateria(
  materia: Materia,
  faltasRestantesGlobal: number = 0,
): number | null {
  const proprio = materia.faltas_restantes_aviso
  const proprioValido = proprio != null && proprio > 0 ? Math.floor(proprio) : null
  const globalValido = faltasRestantesGlobal > 0 ? Math.floor(faltasRestantesGlobal) : null

  if (proprioValido != null && globalValido != null) return Math.min(proprioValido, globalValido)
  return proprioValido ?? globalValido
}

export function calcularStatsMateria(
  materia: Materia,
  aulasDaMateria: Aula[],
  percentualAvisoGlobal: number = PERCENTUAL_AVISO_PADRAO,
  faltasRestantesGlobal: number = 0,
): MateriaStats {
  const percentualAviso = percentualAvisoMateria(materia, percentualAvisoGlobal)
  const percentualReprovacao = percentualReprovacaoMateria(materia)
  const gatilhoFaltasRestantes = gatilhoFaltasRestantesMateria(materia, faltasRestantesGlobal)

  const horasPadraoAula =
    materia.horas_por_aula && materia.horas_por_aula > 0 ? materia.horas_por_aula : 2
  const limiteFaltas =
    materia.limite_faltas > 0 ? materia.limite_faltas : limiteFaltasMateria(materia)

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

  // Gatilho 1: percentual da cota configurado
  const isAlertaPercentual = !isEstourado && percentualLimiteConsumido >= percentualAviso
  // Gatilho 2: faltas restantes (em aulas) chegou ao número configurado
  const isAlertaFaltasRestantes =
    !isEstourado &&
    gatilhoFaltasRestantes != null &&
    aulasRestantesPossiveis <= gatilhoFaltasRestantes
  // O aviso dispara no gatilho que ocorrer primeiro (OU)
  const isAlerta = isAlertaPercentual || isAlertaFaltasRestantes

  const motivoAlerta: MateriaStats['motivoAlerta'] = !isAlerta
    ? null
    : isAlertaPercentual && isAlertaFaltasRestantes
      ? 'ambos'
      : isAlertaPercentual
        ? 'percentual'
        : 'faltas_restantes'

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
    percentualAviso,
    gatilhoFaltasRestantes,
    motivoAlerta,
    isAlertaPercentual,
    isAlertaFaltasRestantes,
    percentualReprovacao,
    statusAlerta,
  }
}
