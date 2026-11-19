import { useEffect, useState, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import { useRealtime } from '@/hooks/use-realtime'
import { Configuracao } from '@/types'

/** Configuracao estendida com os metadados do PocketBase (RecordModel). */
export type ConfiguracaoRecord = Configuracao & RecordModel

import {
  PERCENTUAL_AVISO_PADRAO,
  obterConfiguracao,
  obterConfiguracaoFaltasRestantes,
  salvarPercentualAviso,
  salvarFaltasRestantesAviso,
} from '@/services/configuracoes'

interface UseConfiguracaoAvisoResultado {
  /** Percentual global de aviso preventivo (padrão 75). */
  percentualAviso: number
  /** Gatilho global por faltas restantes (0 = desativado, só percentual). */
  faltasRestantesAviso: number
  configId: string | null
  isLoading: boolean
  salvar: (valor: number) => Promise<void>
  salvarFaltasRestantes: (valor: number | null) => Promise<void>
  isSalvando: boolean
}

/**
 * Carrega as configurações globais de aviso (percentual e faltas restantes)
 * e mantém os valores em tempo real (subscrição na coleção `configuracoes`):
 * quando muda em qualquer tela, todos os alertas recalculam na hora.
 */
export function useConfiguracaoAviso(): UseConfiguracaoAvisoResultado {
  const [config, setConfig] = useState<ConfiguracaoRecord | null>(null)
  const [configRestantes, setConfigRestantes] = useState<ConfiguracaoRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSalvando, setIsSalvando] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([obterConfiguracao(), obterConfiguracaoFaltasRestantes()])
      .then(([resPercentual, resRestantes]) => {
        if (cancelled) return
        setConfig(resPercentual.config as ConfiguracaoRecord | null)
        setConfigRestantes(resRestantes.config as ConfiguracaoRecord | null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useRealtime<ConfiguracaoRecord>('configuracoes', (e) => {
    const chave = (e.record as ConfiguracaoRecord).chave
    if (chave === 'aviso_faltas_restantes') {
      setConfigRestantes((prev) => {
        if (e.action === 'delete') {
          return prev && prev.id === e.record.id ? null : prev
        }
        if (prev && prev.id !== e.record.id) return prev
        return e.record
      })
      return
    }
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

  const salvarFaltasRestantes = useCallback(async (valor: number | null) => {
    setIsSalvando(true)
    try {
      const registro = await salvarFaltasRestantesAviso(valor)
      setConfigRestantes(registro as ConfiguracaoRecord)
    } finally {
      setIsSalvando(false)
    }
  }, [])

  const percentualAviso = config?.valor ?? PERCENTUAL_AVISO_PADRAO
  const faltasRestantesAviso = configRestantes?.valor ?? 0

  return {
    percentualAviso,
    faltasRestantesAviso,
    configId: config?.id ?? null,
    isLoading,
    salvar,
    salvarFaltasRestantes,
    isSalvando,
  }
}

export default useConfiguracaoAviso
