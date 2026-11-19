import { useCallback, useEffect, useState } from 'react'
import { Avaliacao } from '@/types'
import { listarAvaliacoes } from '@/services/avaliacoes'
import { useRealtime } from '@/hooks/use-realtime'

/**
 * Carrega todas as avaliações do usuário e escuta realtime, expondo um
 * mapa por matéria para as pílulas de pontos dos cards.
 */
export function useAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const recarregar = useCallback(async () => {
    try {
      setAvaliacoes(await listarAvaliacoes())
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  useRealtime('avaliacoes', () => {
    recarregar()
  })

  /** Agrupa as avaliações por materia_id. */
  const avaliacoesPorMateria: Record<string, Avaliacao[]> = {}
  for (const av of avaliacoes) {
    ;(avaliacoesPorMateria[av.materia_id] ||= []).push(av)
  }

  return { avaliacoes, avaliacoesPorMateria, isLoading, recarregar }
}
