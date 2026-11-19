import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Loader2, X, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Materia, Avaliacao } from '@/types'
import {
  listarAvaliacoesDaMateria,
  SituacaoPontos,
  calcularSituacaoPontos,
} from '@/services/avaliacoes'
import { useSecaoAvaliacoes } from '@/hooks/use-secao-avaliacoes'
import { cn } from '@/lib/utils'

interface SecaoAvaliacoesProps {
  materia: Materia | null
  config: { pontosAprovacao: number; totalSemestre: number }
}

/**
 * Seção "Avaliações" do modal de matéria: lista as avaliações lançadas,
 * permite adicionar/editar/remover e mostra o resumo de aprovação por pontos.
 */
export function SecaoAvaliacoes({ materia, config }: SecaoAvaliacoesProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [isCarregando, setIsCarregando] = useState(false)
  const materiaId = materia?.id ?? null

  const { form, setForm, iniciarEdicao, cancelar, salvar, excluir, isSalvando, isExcluindo } =
    useSecaoAvaliacoes(materiaId, recarregar)

  async function recarregar() {
    if (!materiaId) {
      setAvaliacoes([])
      return
    }
    setIsCarregando(true)
    try {
      setAvaliacoes(await listarAvaliacoesDaMateria(materiaId))
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
    } finally {
      setIsCarregando(false)
    }
  }

  useEffect(() => {
    recarregar()
    cancelar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId])

  const situacao: SituacaoPontos | null = materia
    ? calcularSituacaoPontos(materia, avaliacoes, config)
    : null

  return (
    <div className="space-y-3">
      {/* Resumo de aprovação por pontos */}
      {situacao && situacao.pontosLancados > 0 && (
        <div className="p-3 rounded-xl bg-[#0d1122] border tech-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Pontos acumulados
            </span>
            <span className="font-mono text-zinc-100">
              {situacao.pontosAcumulados}/{situacao.totalSemestre}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              style={{
                width: `${Math.min(
                  100,
                  situacao.totalSemestre > 0
                    ? (situacao.pontosAcumulados / situacao.totalSemestre) * 100
                    : 0,
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Média de aprovação: {situacao.media} pts · Pendentes: {situacao.pontosPendentes} pts ·
            Sem lançamentos ainda: {situacao.pontosRestantesSemestre} pts
          </p>
        </div>
      )}

      {/* Lista de avaliações */}
      {isCarregando ? (
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Carregando avaliações...
        </div>
      ) : avaliacoes.length === 0 ? (
        <p className="text-[11px] text-zinc-500">
          Nenhuma avaliação lançada. Adicione P1, P2, trabalhos etc. para acompanhar a aprovação por
          pontos.
        </p>
      ) : (
        <div className="space-y-1.5">
          {avaliacoes.map((av) => (
            <div
              key={av.id}
              className="flex items-center gap-2 rounded-full bg-[#101426] border border-zinc-800/80 pl-3 pr-1.5 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{av.nome}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {av.nota_obtida == null
                    ? `máx. ${av.valor_maximo} pts · pendente`
                    : `${av.nota_obtida}/${av.valor_maximo} pts`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => iniciarEdicao(av)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                aria-label={`Editar ${av.nome}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => excluir(av.id)}
                disabled={isExcluindo}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                aria-label={`Excluir ${av.nome}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário inline (adicionar/editar) */}
      <div className="rounded-xl bg-[#0d1122] border tech-border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-zinc-400">Nome da avaliação</Label>
            <Input
              placeholder="Ex: P1, Trabalho final"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-zinc-400">Pontuação máxima</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="Ex: 25"
              value={form.valor_maximo}
              onChange={(e) => setForm({ ...form, valor_maximo: e.target.value })}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-zinc-400">Pontos obtidos (opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="Vazio = pendente"
              value={form.nota_obtida}
              onChange={(e) => setForm({ ...form, nota_obtida: e.target.value })}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8"
            />
          </div>
          <div className="flex items-end gap-1.5">
            <Button
              type="button"
              onClick={salvar}
              disabled={isSalvando || !form.nome.trim() || !form.valor_maximo}
              className="flex-1 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold gap-1.5"
            >
              {isSalvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {form.id ? 'Salvar alterações' : 'Adicionar'}
            </Button>
            {form.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelar}
                className="h-8 w-8 p-0 rounded-full text-zinc-400 hover:text-zinc-200"
                aria-label="Cancelar edição"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
