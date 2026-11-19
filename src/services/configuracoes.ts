import pb from '@/lib/pocketbase/client'
import { Configuracao } from '@/types'

/** Percentual padrão de aviso preventivo (75% da cota de faltas). */
export const PERCENTUAL_AVISO_PADRAO = 75

const CHAVE_AVISO = 'aviso_preventivo' as const
/** Chave da configuração global de aviso por faltas restantes (migration 0006). */
export const CHAVE_AVISO_FALTAS_RESTANTES = 'aviso_faltas_restantes' as const

export interface ObterOuCriarResultado {
  config: Configuracao | null
  percentual: number
}

/**
 * Busca a configuração global de aviso preventivo do usuário.
 * Quando ainda não existe registro, cria um com o padrão (75%) para que
 * o mesmo documento possa ser atualizado e escutado em tempo real depois.
 */
export async function obterConfiguracao(): Promise<ObterOuCriarResultado> {
  const userId = pb.authStore.model?.id
  if (!userId) return { config: null, percentual: PERCENTUAL_AVISO_PADRAO }

  try {
    const config = await pb
      .collection('configuracoes')
      .getFirstListItem<Configuracao>(`user_id = "${userId}" && chave = "${CHAVE_AVISO}"`)
    return { config, percentual: config.valor ?? PERCENTUAL_AVISO_PADRAO }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status !== 404) {
      console.error('Erro ao carregar configuração de aviso:', err)
      return { config: null, percentual: PERCENTUAL_AVISO_PADRAO }
    }

    // Não existe ainda: cria com o padrão
    try {
      const config = await pb.collection('configuracoes').create<Configuracao>({
        user_id: userId,
        chave: CHAVE_AVISO,
        valor: PERCENTUAL_AVISO_PADRAO,
      })
      return { config, percentual: config.valor }
    } catch (createErr) {
      console.error('Erro ao criar configuração padrão de aviso:', createErr)
      return { config: null, percentual: PERCENTUAL_AVISO_PADRAO }
    }
  }
}

export async function salvarPercentualAviso(valor: number): Promise<Configuracao> {
  const userId = pb.authStore.model?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { config } = await obterOuCriarConfig(userId)

  const registro = await pb.collection('configuracoes').update<Configuracao>(config.id, {
    valor: clampPercentual(valor),
  })
  return registro
}

async function obterOuCriarConfig(userId: string): Promise<{ config: Configuracao }> {
  try {
    const config = await pb
      .collection('configuracoes')
      .getFirstListItem<Configuracao>(`user_id = "${userId}" && chave = "${CHAVE_AVISO}"`)
    return { config }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status !== 404) throw err
    const config = await pb.collection('configuracoes').create<Configuracao>({
      user_id: userId,
      chave: CHAVE_AVISO,
      valor: PERCENTUAL_AVISO_PADRAO,
    })
    return { config }
  }
}

function clampPercentual(valor: number): number {
  if (!Number.isFinite(valor)) return PERCENTUAL_AVISO_PADRAO
  return Math.min(99, Math.max(1, Math.round(valor)))
}

/**
 * Busca (ou cria) a configuração global de aviso por faltas restantes.
 * Valor 0 = não usar este gatilho (só o percentual dispara).
 */
export async function obterConfiguracaoFaltasRestantes(): Promise<{
  config: Configuracao | null
  faltasRestantes: number
}> {
  const userId = pb.authStore.model?.id
  if (!userId) return { config: null, faltasRestantes: 0 }

  try {
    const config = await pb
      .collection('configuracoes')
      .getFirstListItem<Configuracao>(
        `user_id = "${userId}" && chave = "${CHAVE_AVISO_FALTAS_RESTANTES}"`,
      )
    return { config, faltasRestantes: config.valor ?? 0 }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status !== 404) {
      console.error('Erro ao carregar configuração de faltas restantes:', err)
      return { config: null, faltasRestantes: 0 }
    }
    try {
      const config = await pb.collection('configuracoes').create<Configuracao>({
        user_id: userId,
        chave: CHAVE_AVISO_FALTAS_RESTATES,
        valor: 0,
      })
      return { config, faltasRestantes: config.valor }
    } catch (createErr) {
      console.error('Erro ao criar configuração padrão de faltas restantes:', createErr)
      return { config: null, faltasRestantes: 0 }
    }
  }
}

/**
 * Salva o gatilho global de faltas restantes. 0 ou vazio desativa o gatilho
 * (o aviso passa a disparar só pelo percentual).
 */
export async function salvarFaltasRestantesAviso(valor: number | null): Promise<Configuracao> {
  const userId = pb.authStore.model?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const valorFinal =
    valor == null || !Number.isFinite(valor) || valor <= 0
      ? 0
      : Math.min(999, Math.max(1, Math.round(valor)))

  const { config } = await obterOuCriarConfigFaltasRestantes(userId)
  return await pb.collection('configuracoes').update<Configuracao>(config.id, {
    valor: valorFinal,
  })
}

async function obterOuCriarConfigFaltasRestantes(
  userId: string,
): Promise<{ config: Configuracao }> {
  try {
    const config = await pb
      .collection('configuracoes')
      .getFirstListItem<Configuracao>(
        `user_id = "${userId}" && chave = "${CHAVE_AVISO_FALTAS_RESTANTES}"`,
      )
    return { config }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status !== 404) throw err
    const config = await pb.collection('configuracoes').create<Configuracao>({
      user_id: userId,
      chave: CHAVE_AVISO_FALTAS_RESTATES,
      valor: 0,
    })
    return { config }
  }
}
