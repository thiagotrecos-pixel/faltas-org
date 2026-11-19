import { useCallback, useEffect, useState } from 'react'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type EstadoInstalacao = 'indisponivel' | 'disponivel' | 'instalado'

/**
 * Detecta se o PWA pode ser instalado (beforeinstallprompt) ou já está
 * instalado (display-mode standalone), e expõe a função para disparar o
 * prompt de instalação nativo.
 */
export function useInstalacaoPWA() {
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoInstalacao | null>(null)
  const [estado, setEstado] = useState<EstadoInstalacao>('indisponivel')

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (standalone) {
      setEstado('instalado')
      return
    }

    const aoPedirInstalacao = (e: Event) => {
      e.preventDefault()
      setEventoInstalacao(e as BeforeInstallPromptEvent)
      setEstado('disponivel')
    }

    const aoInstalar = () => setEstado('instalado')

    window.addEventListener('beforeinstallprompt', aoPedirInstalacao)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPedirInstalacao)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!eventoInstalacao) return false
    await eventoInstalacao.prompt()
    const { outcome } = await eventoInstalacao.userChoice
    setEventoInstalacao(null)
    if (outcome === 'accepted') setEstado('instalado')
    return outcome === 'accepted'
  }, [eventoInstalacao])

  return { estado, instalar }
}
