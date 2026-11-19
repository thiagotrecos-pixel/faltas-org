import React from 'react'
import { Materia, Avaliacao } from '@/types'
import { calcularSituacaoPontos, SituacaoPontos } from '@/services/avaliacoes'
import { cn } from '@/lib/utils'

/**
 * Pílula "tech" com o resumo de pontos da matéria: pontos obtidos vs. média
 * necessária para aprovação, colorida conforme a situação.
 */
export const PilulaPontos: React.FC<{
  materia: Materia
  avaliacoes: Avaliacao[]
  config: { pontosAprovacao: number; totalSemestre: number }
  className?: string
}> = ({ materia, avaliacoes, config, className }) => {
  const s: SituacaoPontos = calcularSituacaoPontos(materia, avaliacoes, config)

  if (s.situacao === 'sem_lancamentos') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800/60 border border-zinc-700/60 text-zinc-400',
          className,
        )}
      >
        Sem pontos lançados
      </span>
    )
  }

  const estilo =
    s.situacao === 'aprovado_por_pontos'
      ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-300'
      : s.situacao === 'abaixo_da_media'
        ? 'bg-rose-500/15 border border-rose-400/40 text-rose-300'
        : 'bg-amber-500/15 border border-amber-400/40 text-amber-300'

  const rotulo =
    s.situacao === 'aprovado_por_pontos'
      ? 'Aprovado'
      : s.situacao === 'abaixo_da_media'
        ? 'Sem chance'
        : 'Em andamento'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold',
        estilo,
        className,
      )}
      title={`${rotulo}: ${s.pontosAcumulados} pts de ${s.media} necessários (semestre vale ${s.totalSemestre})`}
    >
      <span>{s.resumoCurto}</span>
      <span className="opacity-70">·</span>
      <span>{rotulo}</span>
    </span>
  )
}

export default PilulaPontos
