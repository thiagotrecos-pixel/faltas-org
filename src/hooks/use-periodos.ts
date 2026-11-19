import { useCallback, useEffect, useState } from 'react'
import { Periodo } from '@/types'
import { listarPeriodos } from '@/services/periodos'

export function usePeriodos() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    try {
      setPeriodos(await listarPeriodos())
    } catch (e) {
      console.error('Erro ao carregar períodos:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { periodos, isLoading, recarregar }
}
