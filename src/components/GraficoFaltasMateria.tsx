import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { MateriaStats } from '@/types'
import { limiteFaltasMateria } from '@/services/calculations'

interface GraficoFaltasMateriaProps {
  /** Estatísticas já recortadas pelo período selecionado no Painel. */
  statsMaterias: MateriaStats[]
}

const corBarra = (stats: MateriaStats): string => {
  if (stats.statusAlerta === 'reprovado') return 'from-rose-600 to-rose-400 shadow-rose-500/30'
  if (stats.statusAlerta === 'alerta') return 'from-amber-600 to-amber-400 shadow-amber-500/30'
  return 'from-indigo-600 to-cyan-400 shadow-indigo-500/30'
}

const formatarHoras = (valor: number): string =>
  `${Number.isInteger(valor) ? valor : valor.toFixed(1).replace('.', ',')}h`

export const GraficoFaltasMateria: React.FC<GraficoFaltasMateriaProps> = ({ statsMaterias }) => {
  const itens = statsMaterias.map((stats) => ({
    stats,
    faltasHoras: stats.horasFaltas,
    limiteHoras: limiteFaltasMateria(stats.materia),
  }))

  // Escala comum: o maior valor entre faltas e limite do recorte (mínimo 1h para evitar divisão por zero)
  const escala = Math.max(1, ...itens.map((i) => Math.max(i.faltasHoras, i.limiteHoras)))
  const pct = (valor: number) => Math.min(100, Math.max(0, (valor / escala) * 100))

  return (
    <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-5 space-y-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Faltas por Matéria
            </h2>
            <p className="text-[11px] text-zinc-500">
              Horas de falta de cada matéria no recorte atual, comparadas ao limite permitido.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400" />
              Faltas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3.5 bg-zinc-200" />
              Limite
            </span>
          </div>
        </div>

        {itens.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            Nenhuma matéria no recorte atual.
          </p>
        ) : (
          <ul className="space-y-3">
            {itens.map(({ stats, faltasHoras, limiteHoras }) => {
              const qtdFaltas = stats.totalFaltas
              return (
                <li key={stats.materia.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-zinc-200 truncate">
                      {stats.materia.nome}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                      <span className="text-zinc-100">{formatarHoras(faltasHoras)}</span>
                      {' / '}
                      {formatarHoras(limiteHoras)}
                      <span className="text-zinc-500">
                        {' '}
                        · {qtdFaltas} {qtdFaltas === 1 ? 'falta' : 'faltas'}
                      </span>
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-zinc-900 border tech-border overflow-visible">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r shadow-md transition-all duration-500 ${corBarra(stats)}`}
                      style={{ width: `${pct(faltasHoras)}%` }}
                      role="img"
                      aria-label={`${stats.materia.nome}: ${formatarHoras(faltasHoras)} de falta, limite ${formatarHoras(limiteHoras)}`}
                    />
                    <span
                      className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-zinc-200 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                      style={{ left: `calc(${pct(limiteHoras)}% - 1px)` }}
                      title={`Limite: ${formatarHoras(limiteHoras)}`}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
