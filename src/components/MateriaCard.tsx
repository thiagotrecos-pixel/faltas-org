import React from 'react'
import { Link } from 'react-router-dom'
import { MateriaStats } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Plus,
  ArrowRight,
  BookOpen,
} from 'lucide-react'

interface MateriaCardProps {
  stats: MateriaStats
  onLancarAula: (materiaId: string) => void
  onEditarMateria: (materia: MateriaStats['materia']) => void
}

export const MateriaCard: React.FC<MateriaCardProps> = ({
  stats,
  onLancarAula,
  onEditarMateria,
}) => {
  const { materia } = stats
  const cor = materia.cor || '#6366f1'

  // Percentual consumido da cota de faltas (0 a 100%+)
  const pctLimite = Math.min(100, Math.round(stats.percentualLimiteConsumido))
  // Percentual de faltas sobre a carga horária total
  const pctCarga = stats.percentualFaltasCarga

  const isReprovado = stats.isEstourado
  const isAlerta = stats.isAlerta

  let statusBadge = {
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: CheckCircle2,
    text: 'Situação Segura',
  }

  if (isReprovado) {
    statusBadge = {
      bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse',
      icon: AlertOctagon,
      text: 'Limite Ultrapassado',
    }
  } else if (isAlerta) {
    statusBadge = {
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      icon: AlertTriangle,
      text: 'Atenção: Perto do Limite',
    }
  }

  const StatusIcon = statusBadge.icon

  return (
    <Card className="tech-card border tech-border relative overflow-hidden group hover:border-zinc-700/80 transition-all duration-300 rounded-2xl">
      {/* Top accent glow strip with custom color */}
      <div
        className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
        style={{
          background: `linear-gradient(90deg, ${cor} 0%, ${cor}88 100%)`,
        }}
      />

      <CardContent className="p-5 space-y-4">
        {/* Header: Name, Code and Status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cor }}
              />
              <h3 className="font-bold text-base text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                {materia.nome}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {materia.codigo && (
                <span className="font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 border tech-border text-zinc-300 text-[11px]">
                  {materia.codigo}
                </span>
              )}
              {materia.professor && (
                <span className="truncate max-w-[180px]">{materia.professor}</span>
              )}
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium shrink-0 ${statusBadge.bg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{statusBadge.text}</span>
          </div>
        </div>

        {/* Big Percentage Progress Bar & Indicators */}
        <div className="space-y-2 pt-1">
          <div className="flex items-end justify-between text-xs">
            <div>
              <span className="text-zinc-400">Percentual de faltas: </span>
              <span
                className={`font-bold font-mono text-sm ${
                  isReprovado ? 'text-rose-400' : isAlerta ? 'text-amber-400' : 'text-zinc-200'
                }`}
              >
                {pctCarga.toFixed(1)}%
              </span>
              <span className="text-[11px] text-zinc-500"> / máx 25%</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-zinc-400">
                {stats.horasFaltas}h de {materia.limite_faltas}h limite
              </span>
            </div>
          </div>

          {/* Dual bar: shows consumed limit */}
          <div className="w-full h-2.5 bg-zinc-800/90 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReprovado
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : isAlerta
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-sm shadow-amber-500/50'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{
                width: `${Math.min(100, (stats.horasFaltas / materia.limite_faltas) * 100)}%`,
              }}
            />
          </div>

          {/* Limit threshold warning pill */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
            <span>
              Carga total: <strong className="text-zinc-300">{materia.carga_horaria}h</strong>
            </span>
            <span
              className={`font-medium ${
                stats.faltasRestantesHoras === 0
                  ? 'text-rose-400 font-bold'
                  : stats.faltasRestantesHoras <= 4
                    ? 'text-amber-400'
                    : 'text-zinc-400'
              }`}
            >
              {isReprovado
                ? '0h restantes (reprovado por faltas)'
                : `${stats.faltasRestantesHoras}h restantes (~${stats.aulasRestantesPossiveis} aulas)`}
            </span>
          </div>
        </div>

        {/* Quick summary metrics */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y tech-border text-center text-xs">
          <div className="p-2 rounded-xl bg-zinc-900/60">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Aulas Realizadas</p>
            <p className="text-sm font-bold text-zinc-200 mt-0.5">{stats.totalAulas}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <p className="text-[10px] uppercase font-mono text-emerald-400/80">Presenças</p>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">{stats.totalPresencas}</p>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              isReprovado
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                : isAlerta
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
            }`}
          >
            <p className="text-[10px] uppercase font-mono text-zinc-400">Faltas</p>
            <p className="text-sm font-bold mt-0.5">{stats.totalFaltas}</p>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => onLancarAula(materia.id)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold h-8 shadow-md shadow-indigo-600/20 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançar Aula</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditarMateria(materia)}
            className="rounded-xl border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs h-8 px-3"
          >
            Editar
          </Button>

          <Link to={`/aulas?materia=${materia.id}`}>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs h-8 px-2"
              title="Ver histórico de aulas"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
