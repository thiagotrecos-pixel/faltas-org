import { useCallback, useEffect, useState } from 'react'
import {
  ConfigPontos,
  obterConfigPontos,
  salvarPontosAprovacaoGlobal,
  salvarTotalSemestreGlobal,
  PONTOS_APROVACAO_PADRAO,
  TOTAL_SEMESTRE_PADRAO,
} from '@/services/avaliacoes'
import { useRealtime } from '@/hooks/use-realtime'

/**
 * Carrega as configurações globais de pontos ("Pontos necessários para
 * aprovação" e "Valor total do semestre") do usuário, criando-as com os
 * padrões (60 / 100) quando ainda não existem. Recarrega em tempo real.
 */
export function useConfigPontos() {
  const [config, setConfig] = useState<ConfigPontos>({
    pontosAprovacao: PONTOS_APROVACAO_PADRAO,
    totalSemestre: TOTAL_SEMESTRE_PADRAO,
    configAprovacaoId: null,
    configTotalId: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSalvando, setIsSalvando] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      const c = await obterConfigPontos()
      setConfig(c)
    } catch (err) {
      console.error('Erro ao carregar configurações de pontos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  useRealtime('configuracoes', () => {
    recarregar()
  })

  const salvar = useCallback(
    async (pontosAprovacao: number, totalSemestre: number) => {
      setIsSalvando(true)
      try {
        await salvarPontosAprovacaoGlobal(pontosAprovacao)
        await salvarTotalSemestreGlobal(totalSemestre)
        await recarregar()
        return true
      } catch (err: unknown) {
        console.error('Erro ao salvar configurações de pontos:', err)
        return false
      } finally {
        setIsSalvando(false)
      }
    },
    [recarregar],
  )

  return { config, isLoading, isSalvando, salvar, recarregar }
}
