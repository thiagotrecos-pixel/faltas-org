import React from 'react'
import { Link } from 'react-router-dom'
import { Edit2, Trash2, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Materia, MateriaStats, Avaliacao } from '@/types'
import { AvatarMateria } from '@/components/AvatarMateria'
import { PilulaPontos } from '@/components/PilulaPontos'

interface MateriaCardGradeProps {
  item: MateriaStats
  onEditar: (materia: Materia) => void
  onExcluir: (materia: Materia) => void
  onLancarNota?: (materiaId: string) => void
  avaliacoes: Avaliacao[]
  configPontos: { pontosAprovacao: number; totalSemestre: number }
}

/** Card de matéria usado na grade da aba Matérias (extraído do MateriasPage). */
export const MateriaCardGrade: React.FC<MateriaCardGradeProps> = ({
  item,
  onEditar,
  onExcluir,
  onLancarNota,
  avaliacoes,
  configPontos,
}) => {
  const { materia } = item
  const cor = materia.cor || '#6366f1'
  const pctLimite = Math.round(item.percentualLimiteConsumido)

  return (
    <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden flex flex-col justify-between">
      <div className="h-1.5 w-full" style={{ backgroundColor: cor }} />
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            {/* Imagem ao lado do nome (mesma linha) */}
            <div className="flex items-center gap-3 min-w-0">
              <AvatarMateria materia={materia} sizeClass="w-11 h-11" textoClass="text-base" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">{materia.nome}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                  {materia.codigo && (
                    <span className="font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]">
                      {materia.codigo}
                    </span>
                  )}
                  {materia.professor && (
                    <span className="truncate max-w-[140px]">{materia.professor}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Status pill */}
            {item.isEstourado ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Reprovado
              </span>
            ) : item.isAlerta ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {item.motivoAlerta === 'faltas_restantes'
                  ? `Faltam ${item.gatilhoFaltasRestantes} aula(s)`
                  : item.motivoAlerta === 'ambos'
                    ? `Alerta ${item.percentualAviso}% • faltam ${item.gatilhoFaltasRestantes}`
                    : `Alerta ${item.percentualAviso}%`}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Regular
              </span>
            )}
          </div>

          {/* Dados principais em grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                Carga Horária
              </span>
              <span className="text-sm font-bold text-zinc-200">{materia.carga_horaria}h</span>
              <span className="text-[10px] text-zinc-400 block">
                ~{Math.round(materia.carga_horaria / (materia.horas_por_aula || 2))} aulas
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
              <span className="text-[10px] uppercase font-mono text-indigo-400 block">
                Limite {item.percentualReprovacao}% Faltas
              </span>
              <span className="text-sm font-bold text-indigo-300">{materia.limite_faltas}h</span>
              <span className="text-[10px] text-zinc-400 block">
                ~{Math.floor(materia.limite_faltas / (materia.horas_por_aula || 2))} aulas
                permitidas
              </span>
            </div>
          </div>

          {/* Progresso de faltas */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">
                Faltas consumidas: <strong className="text-zinc-200">{item.horasFaltas}h</strong>
              </span>
              <span
                className={`font-semibold ${
                  item.isEstourado
                    ? 'text-rose-400'
                    : item.isAlerta
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {pctLimite}% da cota
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  item.isEstourado
                    ? 'bg-rose-500'
                    : item.isAlerta
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pctLimite)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 text-right">
              Restam: <strong className="text-zinc-300">{item.faltasRestantesHoras}h</strong>
            </p>
          </div>
        </div>

        {/* Pílula de aprovação por pontos */}
        <div className="flex items-center">
          <PilulaPontos materia={materia} avaliacoes={avaliacoes} config={configPontos} />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-3 border-t tech-border">
          <Link to={`/aulas?materia=${materia.id}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs h-8"
            >
              Ver Aulas ({item.totalAulas})
            </Button>
          </Link>

          {onLancarNota && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onLancarNota(materia.id)}
              className="w-8 h-8 rounded-xl text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/30"
              title="Lançar nota"
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEditar(materia)}
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
            title="Editar matéria"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onExcluir(materia)}
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
            title="Excluir matéria"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
