import React from 'react'
import { Target, AlertOctagon } from 'lucide-react'
import { Materia, Avaliacao } from '@/types'
import { calcularNotaNecessaria, formatarPontos, isPendente } from '@/services/avaliacoes'
import { cn } from '@/lib/utils'

/**
 * Linha discreta "tech" exibida abaixo da pílula de pontos nos cards de
 * matéria (Painel e Matérias): quanto o aluno ainda precisa tirar nas
 * avaliações pendentes (sem nota lançada) para atingir a média de aprovação.
 *
 * Regras:
 * - Aprovado por pontos ou sem pendentes → não mostra nada.
 * - Matematicamente impossível (máx. das pendentes < necessário) → alerta
 *   "Sem chance" em vermelho.
 */
export const LinhaNotaNecessaria: React.FC<{
  materia: Materia
  avaliacoes: Avaliacao[]
  config: { pontosAprovacao: number; totalSemestre: number }
  className?: string
}> = ({ materia, avaliacoes, config, className }) => {
  const n = calcularNotaNecessaria(materia, avaliacoes, config)

  // Nada a mostrar: aprovado, sem pendentes ou já atingiu a média.
  const pendentesReais = avaliacoes.filter(isPendente)
  if (pendentesReais.length === 0 || n.quantidadePendentes === 0 || n.pontosNecessarios <= 0) {
    return null
  }

  if (n.impossivel) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-rose-500/15 border border-rose-400/40 text-rose-300 w-fit',
          className,
        )}
        title={`Faltam ${formatarPontos(n.pontosNecessarios)} pts, mas as ${n.quantidadePendentes} avaliação(ões) pendente(s) já não alcançam a média, mesmo com nota máxima.`}
      >
        <AlertOctagon className="w-3 h-3 shrink-0" />
        <span>Sem chance · faltam {formatarPontos(n.pontosNecessarios)} pts</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 w-fit',
        className,
      )}
      title={`Faltam ${formatarPontos(n.pontosNecessarios)} pts para a média de ${config.pontosAprovacao} — distribuídos nas ${n.quantidadePendentes} avaliação(ões) pendente(s).`}
    >
      <Target className="w-3 h-3 shrink-0" />
      <span>
        faltam {formatarPontos(n.pontosNecessarios)} pts · precisa de{' '}
        {formatarPontos(n.pontosPorAvaliacao)} em {n.quantidadePendentes}
      </span>
    </div>
  )
}

export default LinhaNotaNecessaria
