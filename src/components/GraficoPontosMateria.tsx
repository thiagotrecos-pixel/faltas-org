import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Award } from 'lucide-react'
import { MateriaStats, Avaliacao } from '@/types'
import { calcularSituacaoPontos, SituacaoPontos } from '@/services/avaliacoes'

interface GraficoPontosMateriaProps {
  /** Estatísticas já recortadas pelo período selecionado no Painel. */
  statsMaterias: MateriaStats[]
  /** Avaliações agrupadas por materia_id (useAvaliacoes). */
  avaliacoesPorMateria: Record<string, Avaliacao[]>
  config: { pontosAprovacao: number; totalSemestre: number }
}

const corBarra = (situacao: SituacaoPontos['situacao']): string => {
  switch (situacao) {
    case 'aprovado_por_pontos':
      return 'from-emerald-600 to-emerald-400 shadow-emerald-500/30'
    case 'abaixo_da_media':
      return 'from-rose-600 to-rose-400 shadow-rose-500/30'
    case 'sem_lancamentos':
      return 'from-zinc-700 to-zinc-600 shadow-zinc-500/20'
    default: // 'recuperacao' = em andamento
      return 'from-indigo-600 to-cyan-400 shadow-indigo-500/30'
  }
}

const formatarPontos = (valor: number): string =>
  `${Number.isInteger(valor) ? valor : valor.toFixed(1).replace('.', ',')}`

export const GraficoPontosMateria: React.FC<GraficoPontosMateriaProps> = ({
  statsMaterias,
  avaliacoesPorMateria,
  config,
}) => {
  const itens = statsMaterias.map((stats) => ({
    stats,
    situacao: calcularSituacaoPontos(
      stats.materia,
      avaliacoesPorMateria[stats.materia.id] || [],
      config,
    ),
  }))

  // Escala comum: o maior total do semestre do recorte (mínimo 1 para evitar divisão por zero)
  const escala = Math.max(
    1,
    ...itens.map((i) => Math.max(i.situacao.totalSemestre, i.situacao.pontosAcumulados)),
  )
  const pct = (valor: number) => Math.min(100, Math.max(0, (valor / escala) * 100))

  return (
    <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-5 space-y-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Pontuação por Matéria
            </h2>
            <p className="text-[11px] text-zinc-500">
              Pontos acumulados de cada matéria comparados ao valor total do semestre.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              Aprovado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400" />
              Em andamento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-400" />
              Sem chance
            </span>
          </div>
        </div>

        {itens.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            Nenhuma matéria no recorte atual.
          </p>
        ) : (
          <ul className="space-y-3">
            {itens.map(({ stats, situacao }) => (
              <li key={stats.materia.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-zinc-200 truncate">{stats.materia.nome}</span>
                  <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                    <span className="text-zinc-100">
                      {formatarPontos(situacao.pontosAcumulados)}
                    </span>
                    {' / '}
                    {formatarPontos(situacao.totalSemestre)} pts
                    <span className="text-zinc-500"> · {situacao.media} p/ aprovar</span>
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-zinc-900 border tech-border overflow-visible">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r shadow-md transition-all duration-500 ${corBarra(
                      situacao.situacao,
                    )}`}
                    style={{ width: `${pct(situacao.pontosAcumulados)}%` }}
                    role="img"
                    aria-label={`${stats.materia.nome}: ${formatarPontos(
                      situacao.pontosAcumulados,
                    )} de ${formatarPontos(situacao.totalSemestre)} pontos, média ${formatarPontos(
                      situacao.media,
                    )}`}
                  />
                  <span
                    className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-zinc-200 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    style={{ left: `calc(${pct(situacao.media)}% - 1px)` }}
                    title={`Média de aprovação: ${formatarPontos(situacao.media)} pts`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
