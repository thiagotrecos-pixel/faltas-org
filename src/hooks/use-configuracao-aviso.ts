import { useEffect, useState, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import { useRealtime } from '@/hooks/use-realtime'
import { Configuracao } from '@/types'

/** Configuracao estendida com os metadados do PocketBase (RecordModel). */
export type ConfiguracaoRecord = Configuracao & RecordModel

import {
  PERCENTUAL_AVISO_PADRAO,
  obterConfiguracao,
  salvarPercentualAviso,
} from '@/services/configuracoes'

interface UseConfiguracaoAvisoResultado {
  /** Percentual global de aviso preventivo (padrão 75). */
  percentualAviso: number
  configId: string | null
  isLoading: boolean
  salvar: (valor: number) => Promise<void>
  isSalvando: boolean
}

/**
 * Carrega a configuração global de aviso preventivo do usuário e mantém
 * o valor em tempo real (subscrição na coleção `configuracoes`): quando o
 * percentual muda em qualquer tela, todos os alertas recalculam na hora.
 */
export function useConfiguracaoAviso(): UseConfiguracaoAvisoResultado {
  const [config, setConfig] = useState<ConfiguracaoRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSalvando, setIsSalvando] = useState(false)

  useEffect(() => {
    let cancelled = false
    obterConfiguracao()
      .then((res) => {
        if (!cancelled) setConfig(res.config as ConfiguracaoRecord | null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useRealtime<ConfiguracaoRecord>('configuracoes', (e) => {
    setConfig((prev) => {
      if (e.action === 'delete') {
        return prev && prev.id === e.record.id ? null : prev
      }
      if (prev && prev.id !== e.record.id) return prev
      return e.record
    })
  })

  const salvar = useCallback(async (valor: number) => {
    setIsSalvando(true)
    try {
      const registro = await salvarPercentualAviso(valor)
      setConfig(registro as ConfiguracaoRecord)
    } finally {
      setIsSalvando(false)
    }
  }, [])

  const percentualAviso = config?.valor ?? PERCENTUAL_AVISO_PADRAO

  return { percentualAviso, configId: config?.id ?? null, isLoading, salvar, isSalvando }
}

export default useConfiguracaoAviso
