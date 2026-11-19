import pb from '@/lib/pocketbase/client'
import { Materia, Periodo } from '@/types'

/** Filtro especial: todas as matérias, com ou sem período. */
export const FILTRO_TODOS = 'todos'
/** Filtro especial: apenas matérias sem período (cadastros antigos). */
export const FILTRO_SEM_PERIODO = 'sem'

export async function listarPeriodos(): Promise<Periodo[]> {
  return await pb.collection('periodos').getFullList<Periodo>({ sort: '-nome' })
}

export async function criarPeriodo(nome: string): Promise<Periodo> {
  const userId = pb.authStore.model?.id
  if (!userId) {
    throw new Error('Usuário não autenticado')
  }
  return await pb.collection('periodos').create<Periodo>({ user_id: userId, nome: nome.trim() })
}

export async function renomearPeriodo(id: string, nome: string): Promise<Periodo> {
  return await pb.collection('periodos').update<Periodo>(id, { nome: nome.trim() })
}

/**
 * Exclui o período. As matérias vinculadas NÃO são apagadas: ficam "sem período".
 */
export async function excluirPeriodo(id: string): Promise<boolean> {
  const vinculadas = await pb
    .collection('materias')
    .getFullList<Materia>({ filter: pb.filter('periodo_id = {:id}', { id }) })
  for (const materia of vinculadas) {
    await pb.collection('materias').update(materia.id, { periodo_id: '' })
  }
  return await pb.collection('periodos').delete(id)
}

/** Garante que o filtro aponte para um período existente (senão volta para "todos"). */
export function filtroValido(filtro: string, periodos: Periodo[]): string {
  if (filtro === FILTRO_TODOS || filtro === FILTRO_SEM_PERIODO) return filtro
  return periodos.some((p) => p.id === filtro) ? filtro : FILTRO_TODOS
}

export function pertencePeriodo(materia: Pick<Materia, 'periodo_id'>, filtro: string): boolean {
  if (filtro === FILTRO_TODOS) return true
  if (filtro === FILTRO_SEM_PERIODO) return !materia.periodo_id
  return materia.periodo_id === filtro
}

export function filtrarPorPeriodo(materias: Materia[], filtro: string): Materia[] {
  return materias.filter((m) => pertencePeriodo(m, filtro))
}
