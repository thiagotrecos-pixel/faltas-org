import pb from '@/lib/pocketbase/client'
import { Avaliacao, Materia, Configuracao } from '@/types'

/**
 * Sistema de aprovação por pontos:
 * - O semestre vale um total de pontos (padrão 100), configurável globalmente
 *   e por matéria (override).
 * - A média de aprovação é uma quantidade de pontos (padrão 60), também
 *   configurável globalmente e por matéria.
 * - As avaliações (P1, P2, trabalhos...) lançam pontos sobre esse total.
 */

export const PONTOS_APROVACAO_PADRAO = 60
export const TOTAL_SEMESTRE_PADRAO = 100

const CHAVE_PONTOS_APROVACAO = 'pontos_aprovacao'
const CHAVE_TOTAL_SEMESTRE = 'total_semestre'

export interface AvaliacaoInput {
  materia_id: string
  nome: string
  valor_maximo: number
  nota_obtida: number | null
  /** true quando a nota já foi lançada (campos number do PB nunca são null). */
  nota_lancada: boolean
  data?: string
}

/** Uma avaliação é pendente quando a nota ainda NÃO foi lançada. */
export function isPendente(av: Avaliacao): boolean {
  return !av.nota_lancada
}

function userId(): string {
  const id = pb.authStore.model?.id
  if (!id) throw new Error('Usuário não autenticado')
  return id
}

export async function listarAvaliacoes(): Promise<Avaliacao[]> {
  return await pb.collection('avaliacoes').getFullList<Avaliacao>({
    sort: '-created',
  })
}

export async function listarAvaliacoesDaMateria(materiaId: string): Promise<Avaliacao[]> {
  return await pb.collection('avaliacoes').getFullList<Avaliacao>({
    filter: `materia_id = "${materiaId}"`,
    sort: '-created',
  })
}

export async function criarAvaliacao(dados: AvaliacaoInput): Promise<Avaliacao> {
  return await pb.collection('avaliacoes').create<Avaliacao>({
    user_id: userId(),
    materia_id: dados.materia_id,
    nome: dados.nome.trim(),
    valor_maximo: Number(dados.valor_maximo),
    nota_obtida: dados.nota_obtida == null ? null : Number(dados.nota_obtida),
    nota_lancada: dados.nota_lancada,
    data: dados.data || '',
  })
}

export async function atualizarAvaliacao(
  id: string,
  dados: Partial<AvaliacaoInput>,
): Promise<Avaliacao> {
  const payload: Record<string, unknown> = {}
  if (dados.nome !== undefined) payload.nome = dados.nome.trim()
  if (dados.valor_maximo !== undefined) payload.valor_maximo = Number(dados.valor_maximo)
  if (dados.nota_obtida !== undefined) {
    payload.nota_obtida = dados.nota_obtida == null ? null : Number(dados.nota_obtida)
  }
  if (dados.nota_lancada !== undefined) payload.nota_lancada = dados.nota_lancada
  if (dados.data !== undefined) payload.data = dados.data || ''
  return await pb.collection('avaliacoes').update<Avaliacao>(id, payload)
}

export async function excluirAvaliacao(id: string): Promise<boolean> {
  return await pb.collection('avaliacoes').delete(id)
}

/* ------------------------------------------------------------------ */
/* Configurações globais de pontos (coleção `configuracoes`)           */
/* ------------------------------------------------------------------ */

async function obterOuCriarConfigPontos(
  chave: string,
  padrao: number,
): Promise<Configuracao | null> {
  try {
    const config = await pb
      .collection('configuracoes')
      .getFirstListItem<Configuracao>(`user_id = "${pb.authStore.model?.id}" && chave = "${chave}"`)
    return config
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status !== 404) {
      console.error('Erro ao carregar configuração de pontos:', err)
      return null
    }
    try {
      return await pb.collection('configuracoes').create<Configuracao>({
        user_id: pb.authStore.model?.id,
        chave,
        valor: padrao,
      })
    } catch (createErr) {
      console.error('Erro ao criar configuração de pontos:', createErr)
      return null
    }
  }
}

export interface ConfigPontos {
  pontosAprovacao: number
  totalSemestre: number
  configAprovacaoId: string | null
  configTotalId: string | null
}

/** Carrega (criando com padrão quando ausente) as duas configurações globais de pontos. */
export async function obterConfigPontos(): Promise<ConfigPontos> {
  const [aprov, total] = await Promise.all([
    obterOuCriarConfigPontos(CHAVE_PONTOS_APROVACAO, PONTOS_APROVACAO_PADRAO),
    obterOuCriarConfigPontos(CHAVE_TOTAL_SEMESTRE, TOTAL_SEMESTRE_PADRAO),
  ])
  return {
    pontosAprovacao: aprov?.valor ?? PONTOS_APROVACAO_PADRAO,
    totalSemestre: total?.valor ?? TOTAL_SEMESTRE_PADRAO,
    configAprovacaoId: aprov?.id ?? null,
    configTotalId: total?.id ?? null,
  }
}

export async function salvarPontosAprovacaoGlobal(valor: number): Promise<Configuracao | null> {
  const limpo = clampPontos(valor, PONTOS_APROVACAO_PADRAO, 1)
  const atual = await obterOuCriarConfigPontos(CHAVE_PONTOS_APROVACAO, PONTOS_APROVACAO_PADRAO)
  if (!atual) throw new Error('Não foi possível salvar a configuração de aprovação')
  return await pb.collection('configuracoes').update<Configuracao>(atual.id, { valor: limpo })
}

export async function salvarTotalSemestreGlobal(valor: number): Promise<Configuracao | null> {
  const limpo = clampPontos(valor, TOTAL_SEMESTRE_PADRAO, 1)
  const atual = await obterOuCriarConfigPontos(CHAVE_TOTAL_SEMESTRE, TOTAL_SEMESTRE_PADRAO)
  if (!atual) throw new Error('Não foi possível salvar a configuração do semestre')
  return await pb.collection('configuracoes').update<Configuracao>(atual.id, { valor: limpo })
}

function clampPontos(valor: number, padrao: number, min: number): number {
  if (!Number.isFinite(valor)) return padrao
  return Math.min(10000, Math.max(min, Math.round(valor * 10) / 10))
}

/* ------------------------------------------------------------------ */
/* Cálculo da situação de aprovação por pontos                         */
/* ------------------------------------------------------------------ */

export interface SituacaoPontos {
  pontosAcumulados: number
  pontosLancados: number // pontos já distribuídos em avaliações com nota
  pontosPendentes: number // pontos de avaliações sem nota lançada
  /** Somatório dos valores máximos das avaliações pendentes (sem nota). */
  pendentesMaximos: number
  pontosRestantesSemestre: number // total − soma de todos os valores máximos
  media: number
  totalSemestre: number
  /** Média proporcional: quantos pontos faltam considerando o semestre inteiro. */
  pontosFaltantesParaMedia: number
  /** Situação considerando apenas o que já foi lançado. */
  situacao: 'aprovado_por_pontos' | 'abaixo_da_media' | 'recuperacao' | 'sem_lancamentos'
  /** Texto curto para a pílula, ex.: "72/100 pts" */
  resumoCurto: string
}

function pontosDaMateria(materia: Materia | null, global: number, padrao: number): number {
  return global > 0 ? global : padrao
}

/**
 * Calcula a situação de aprovação por pontos de uma matéria.
 * Usa o override da matéria (pontos_media / pontos_semestre) quando
 * preenchido; senão usa os valores globais.
 */
export function calcularSituacaoPontos(
  materia: Materia,
  avaliacoes: Avaliacao[],
  config: { pontosAprovacao: number; totalSemestre: number },
): SituacaoPontos {
  const totalSemestre =
    materia.pontos_semestre && materia.pontos_semestre > 0
      ? materia.pontos_semestre
      : config.totalSemestre
  const media =
    materia.pontos_media && materia.pontos_media > 0 ? materia.pontos_media : config.pontosAprovacao

  let pontosAcumulados = 0
  let pontosPendentes = 0
  let pendentesMaximos = 0
  let somaValoresMaximos = 0

  for (const av of avaliacoes) {
    const max = Number(av.valor_maximo) || 0
    somaValoresMaximos += max
    if (isPendente(av)) {
      pontosPendentes += max
      pendentesMaximos += max
    } else {
      pontosAcumulados += Number(av.nota_obtida)
    }
  }

  const pontosRestantesSemestre = Math.max(0, totalSemestre - somaValoresMaximos)
  const pontosFaltantesParaMedia = Math.max(0, media - pontosAcumulados)
  const pontosLancados = pontosAcumulados + pontosPendentes

  let situacao: SituacaoPontos['situacao'] = 'sem_lancamentos'
  if (pontosAcumulados > 0 || pontosLancados > 0) {
    if (pontosAcumulados >= media) {
      situacao = 'aprovado_por_pontos'
    } else if (pontosAcumulados + pontosPendentes + pontosRestantesSemestre < media) {
      situacao = 'abaixo_da_media'
    } else {
      situacao = 'recuperacao'
    }
  }

  return {
    pontosAcumulados,
    pontosLancados,
    pontosPendentes,
    pendentesMaximos,
    pontosRestantesSemestre,
    media,
    totalSemestre,
    pontosFaltantesParaMedia,
    situacao,
    resumoCurto: `${arredondar(pontosAcumulados)}/${totalSemestre} pts`,
  }
}

function arredondar(n: number): number {
  return Math.round(n * 10) / 10
}

/** Avaliação pendente (valor máximo preenchido, nota ainda não lançada). */
export interface NotaNecessaria {
  /** Quantos pontos ainda faltam para atingir a média de aprovação. */
  pontosNecessarios: number
  /** Quantas avaliações pendentes existem (com valor máximo preenchido). */
  quantidadePendentes: number
  /** Pontos a tirar em cada avaliação pendente, distribuídos igualmente. */
  pontosPorAvaliacao: number
  /** true quando somatório dos máximos das pendentes < pontos necessários. */
  impossivel: boolean
  /** Sobras de pontos para o resto do semestre (avaliações ainda não criadas). */
  pontosRestantesSemestre: number
}

/**
 * Calcula a nota necessária nas avaliações pendentes (sem nota lançada) de
 * uma matéria para atingir a média de aprovação. Distribui os pontos
 * necessários igualmente entre as pendentes, quando possível.
 */
export function calcularNotaNecessaria(
  materia: Materia,
  avaliacoes: Avaliacao[],
  config: { pontosAprovacao: number; totalSemestre: number },
): NotaNecessaria {
  const s = calcularSituacaoPontos(materia, avaliacoes, config)

  const pendentes = avaliacoes.filter((av) => (Number(av.valor_maximo) || 0) > 0 && isPendente(av))
  const quantidadePendentes = pendentes.length

  if (s.situacao === 'sem_lancamentos' && quantidadePendentes === 0) {
    return {
      pontosNecessarios: 0,
      quantidadePendentes: 0,
      pontosPorAvaliacao: 0,
      impossivel: false,
      pontosRestantesSemestre: s.pontosRestantesSemestre,
    }
  }

  const pontosNecessarios = Math.max(0, arredondar(s.media - s.pontosAcumulados))
  const impossivel = s.situacao !== 'aprovado_por_pontos' && s.pendentesMaximos < pontosNecessarios
  const pontosPorAvaliacao =
    quantidadePendentes > 0 && pontosNecessarios > 0
      ? arredondar(pontosNecessarios / quantidadePendentes)
      : 0

  return {
    pontosNecessarios,
    quantidadePendentes,
    pontosPorAvaliacao,
    impossivel,
    pontosRestantesSemestre: s.pontosRestantesSemestre,
  }
}

/** Formata pontos de forma compacta: inteiro quando possível, senão 1 decimal. */
export function formatarPontos(n: number): string {
  const limpo = arredondar(n)
  return Number.isInteger(limpo) ? String(limpo) : limpo.toFixed(1)
}

/** Rótulo amigável da situação, no tema do app. */
export function rotuloSituacaoPontos(s: SituacaoPontos): string {
  switch (s.situacao) {
    case 'aprovado_por_pontos':
      return 'Aprovado por pontos'
    case 'abaixo_da_media':
      return 'Abaixo da média'
    case 'recuperacao':
      return `Faltam ${arredondar(s.pontosFaltantesParaMedia)} pts`
    default:
      return 'Sem lançamentos'
  }
}

export { pontosDaMateria }
