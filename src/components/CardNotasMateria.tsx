import React from 'react'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Materia, MateriaStats, Avaliacao } from '@/types'
import { AvatarMateria } from '@/components/AvatarMateria'
import { PilulaPontos } from '@/components/PilulaPontos'
import { LinhaNotaNecessaria } from '@/components/LinhaNotaNecessaria'
import { SecaoAvaliacoes } from '@/components/SecaoAvaliacoes'

interface CardNotasMateriaProps {
  item: MateriaStats
  avaliacoes: Avaliacao[]
  configPontos: { pontosAprovacao: number; totalSemestre: number }
  onLancarNota: (materiaId: string) => void
}

/**
 * Card da tela Notas: cabeçalho com pílula de pontos e linha de nota
 * necessária + seção de avaliações embutida (lançar/editar/excluir),
 * reaproveitando exatamente os componentes dos demais cards e do modal.
 */
export const CardNotasMateria: React.FC<CardNotasMateriaProps> = ({
  item,
  avaliacoes,
  configPontos,
  onLancarNota,
}) => {
  const { materia } = item
  const cor = materia.cor || '#6366f1'

  return (
    <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: cor }} />
      <CardContent className="p-5 space-y-4">
        {/* Cabeçalho: avatar + nome + status por pontos */}
        <div className="flex items-start justify-between gap-2">
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

          <PilulaPontos materia={materia} avaliacoes={avaliacoes} config={configPontos} />
        </div>

        {/* Nota necessária nas pendentes */}
        <LinhaNotaNecessaria materia={materia} avaliacoes={avaliacoes} config={configPontos} />

        {/* Avaliações: lista + formulário (lançar/editar/excluir) */}
        <SecaoAvaliacoes materia={materia} config={configPontos} />

        {/* Ação rápida: abre o modal com a matéria pré-selecionada */}
        <div className="pt-3 border-t tech-border">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLancarNota(materia.id)}
            className="w-full rounded-xl border-cyan-500/40 bg-transparent hover:bg-cyan-500/10 text-cyan-300 text-xs font-semibold h-8 gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Lançar nota nesta matéria</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CardNotasMateria
