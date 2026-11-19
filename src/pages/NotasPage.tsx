import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { CardNotasMateria } from '@/components/CardNotasMateria'
import { ModalLancarNota } from '@/components/ModalLancarNota'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { Materia, Aula, MateriaStats, Avaliacao } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas } from '@/services/aulas'
import { calcularStatsMateria } from '@/services/calculations'
import { calcularSituacaoPontos, formatarPontos } from '@/services/avaliacoes'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { useConfigPontos } from '@/hooks/use-config-pontos'
import { useAvaliacoes } from '@/hooks/use-avaliacoes'
import { usePeriodos } from '@/hooks/use-periodos'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, Plus, RefreshCw, Award, Target, AlertOctagon, BookOpen } from 'lucide-react'
import { FILTRO_TODOS, filtroValido, pertencePeriodo } from '@/services/periodos'

/**
 * Tela "Notas": centraliza a aprovação por pontos — matérias do período com
 * suas avaliações, pontos acumulados, nota necessária e lançamento/edição.
 * Reutiliza SecaoAvaliacoes (mesma do ModalMateria) e o ModalLancarNota.
 */
export const NotasPage: React.FC = () => {
  const { percentualAviso, faltasRestantesAviso } = useConfiguracaoAviso()
  const { config: configPontos } = useConfigPontos()
  const { avaliacoes, avaliacoesPorMateria, recarregar: recarregarAvaliacoes } = useAvaliacoes()
  const { toast } = useToast()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { periodos } = usePeriodos()
  const [filtroPeriodo, setFiltroPeriodo] = useState(FILTRO_TODOS)
  const filtroAtivo = filtroValido(filtroPeriodo, periodos)

  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [materiaPreSelecionadaNota, setMateriaPreSelecionadaNota] = useState<string | undefined>()

  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const [mats, als] = await Promise.all([listarMaterias(), listarAulas()])
      setMaterias(mats)
      setAulas(als)
    } catch (e) {
      console.error('Erro ao carregar dados da tela Notas:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const statsPorMateria: MateriaStats[] = materias.map((mat) => {
    const aulasDessa = aulas.filter((a) => a.materia_id === mat.id)
    return calcularStatsMateria(mat, aulasDessa, percentualAviso, faltasRestantesAviso)
  })

  const statsFiltradas = statsPorMateria.filter((s) => pertencePeriodo(s.materia, filtroAtivo))

  // Resumo geral do período: pontos acumulados / média somadas por matéria
  const resumo = statsFiltradas.reduce(
    (acc, s) => {
      const avs: Avaliacao[] = avaliacoesPorMateria[s.materia.id] || []
      const sit = calcularSituacaoPontos(s.materia, avs, configPontos)
      acc.pontos += sit.pontosAcumulados
      acc.media += sit.media
      acc.total += sit.totalSemestre
      if (sit.situacao === 'aprovado_por_pontos') acc.aprovadas += 1
      if (sit.situacao === 'abaixo_da_media') acc.semChance += 1
      return acc
    },
    { pontos: 0, media: 0, total: 0, aprovadas: 0, semChance: 0 },
  )

  const handleLancarNota = (materiaId?: string) => {
    setMateriaPreSelecionadaNota(
      materiaId || statsFiltradas[0]?.materia.id || materias[0]?.id || undefined,
    )
    setModalNotaAberto(true)
  }

  const nomePeriodoAtivo =
    filtroAtivo === FILTRO_TODOS
      ? null
      : periodos.find((p) => p.id === filtroAtivo)?.nome || 'Sem período'

  const totalAvaliacoes = avaliacoes.length

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar totalAlertas={0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
              <span>Notas</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Lançe avaliações, acompanhe os pontos acumulados e a nota necessária para a aprovação
              por pontos.
            </p>
            {periodos.length > 0 && (
              <div className="mt-3">
                <FiltroPeriodo
                  periodos={periodos}
                  value={filtroAtivo}
                  onChange={setFiltroPeriodo}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await carregarDados()
                await recarregarAvaliacoes()
              }}
              disabled={isLoading}
              className="rounded-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs h-9 px-3 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleLancarNota()}
              disabled={materias.length === 0}
              className="rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-cyan-600/25 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Nota</span>
            </Button>
          </div>
        </div>

        {/* Resumo geral do período */}
        {statsFiltradas.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono text-zinc-400">
                    Pontos Acumulados
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-cyan-300">{formatarPontos(resumo.pontos)}</p>
                <p className="text-[11px] text-zinc-500">
                  média somada: {formatarPontos(resumo.media)} pts
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono text-zinc-400">
                    Avaliações Lançadas
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-zinc-100">{totalAvaliacoes}</p>
                <p className="text-[11px] text-zinc-500">
                  em {statsFiltradas.length} matéria(s) do período
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono text-zinc-400">
                    Aprovadas por Pontos
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-400">{resumo.aprovadas}</p>
                <p className="text-[11px] text-zinc-500">
                  {resumo.total > 0
                    ? `${formatarPontos(resumo.pontos)}/${formatarPontos(resumo.total)} pts no período`
                    : 'sem matérias avaliadas'}
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono text-zinc-400">Sem Chance</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertOctagon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-rose-400">{resumo.semChance}</p>
                <p className="text-[11px] text-zinc-500">
                  {resumo.semChance === 0
                    ? 'todas ainda alcançam a média'
                    : 'matéria(s) abaixo da média possível'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de matérias com avaliações */}
        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <p className="text-xs">Carregando matérias e avaliações...</p>
          </div>
        ) : statsFiltradas.length === 0 ? (
          <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <BookOpen className="w-7 h-7" />
            </div>
            {materias.length === 0 ? (
              <>
                <h3 className="text-base font-bold text-white">Nenhuma matéria cadastrada ainda</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                  Cadastre matérias para começar a lançar avaliações e acompanhar sua aprovação por
                  pontos.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-white">
                  Nenhuma matéria em {nomePeriodoAtivo}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                  Selecione outro período ou volte para &ldquo;Todos&rdquo; para ver todas as
                  matérias.
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {statsFiltradas.map((item) => (
              <CardNotasMateria
                key={item.materia.id}
                item={item}
                avaliacoes={avaliacoesPorMateria[item.materia.id] || []}
                configPontos={configPontos}
                onLancarNota={(id) => handleLancarNota(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal Lançar Nota (mesmo dos demais botões do app) */}
      <ModalLancarNota
        isOpen={modalNotaAberto}
        onClose={() => setModalNotaAberto(false)}
        onSuccess={() => {
          carregarDados()
          recarregarAvaliacoes()
          toast({
            title: 'Avaliação atualizada',
            description: 'As pílulas de pontos e a nota necessária já refletem a alteração.',
          })
        }}
        materias={materias}
        materiaPreSelecionadaId={materiaPreSelecionadaNota}
      />
    </div>
  )
}

export default NotasPage
