import React from 'react'
import { Link } from 'react-router-dom'
import { MateriaStats } from '@/types'
import { AlertTriangle, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react'

interface AlertaBannerProps {
  statsMaterias: MateriaStats[]
  /** Percentual global configurado para o aviso preventivo (padrão 75). */
  percentualAviso?: number
  /** Gatilho global por faltas restantes (0 = desativado). */
  faltasRestantesAviso?: number
}

export const AlertaBanner: React.FC<AlertaBannerProps> = ({
  statsMaterias,
  percentualAviso = 75,
  faltasRestantesAviso = 0,
}) => {
  const criticas = statsMaterias.filter((s) => s.isEstourado)
  const emAlerta = statsMaterias.filter((s) => s.isAlerta)

  if (criticas.length === 0 && emAlerta.length === 0) {
    return (
      <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-200">
              Frequência em dia em todas as matérias!
            </p>
            <p className="text-[11px] text-emerald-300/70">
              Nenhuma matéria atingiu os gatilhos de aviso ({percentualAviso}% da cota
              {faltasRestantesAviso > 0
                ? ` ou ${faltasRestantesAviso} faltável(is) para o limite`
                : ''}
              ).
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {criticas.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg shadow-rose-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-200 text-sm">
                Atenção Crítica: Limite de faltas ultrapassado em {criticas.length} matéria(s)!
              </p>
              <p className="text-[11px] text-rose-300/80">
                {criticas
                  .map(
                    (c) => `${c.materia.nome} (${c.horasFaltas}h de ${c.materia.limite_faltas}h)`,
                  )
                  .join(' • ')}
              </p>
            </div>
          </div>
          <Link
            to="/alertas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-semibold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {emAlerta.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-950/35 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-200">
                Alerta de Proximidade: {emAlerta.length} matéria(s) a {percentualAviso}
                %+ do limite de faltas
              </p>
              <p className="text-[11px] text-amber-300/80">
                {emAlerta
                  .map((a) =>
                    a.motivoAlerta === 'faltas_restantes'
                      ? `${a.materia.nome} (faltável(is): ${a.aulasRestantesPossiveis})`
                      : `${a.materia.nome} (restam apenas ${a.faltasRestantesHoras}h de folga)`,
                  )
                  .join(' • ')}
              </p>
            </div>
          </div>
          <Link
            to="/alertas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            <span>Gerenciar faltas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
