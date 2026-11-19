import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { MateriaCard } from '@/components/MateriaCard'
import { AlertaBanner } from '@/components/AlertaBanner'
import { GraficoFaltasMateria } from '@/components/GraficoFaltasMateria'
import { ModalMateria } from '@/components/ModalMateria'
import { ModalAula } from '@/components/ModalAula'
import { ModalLancarNota } from '@/components/ModalLancarNota'
import { GraficoPontosMateria } from '@/components/GraficoPontosMateria'
import { Materia, Aula, MateriaStats } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas } from '@/services/aulas'
import { calcularStatsMateria, PERCENTUAL_REPROVACAO_PADRAO } from '@/services/calculations'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { useConfigPontos } from '@/hooks/use-config-pontos'
import { useAvaliacoes } from '@/hooks/use-avaliacoes'
import { usePeriodos } from '@/hooks/use-periodos'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { FILTRO_TODOS, filtroValido, pertencePeriodo } from '@/services/periodos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth()
  const { percentualAviso, faltasRestantesAviso } = useConfiguracaoAviso()
  const { config: configPontos } = useConfigPontos()
  const { avaliacoesPorMateria } = useAvaliacoes()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { periodos, recarregar: recarregarPeriodos } = usePeriodos()
  const [filtroPeriodo, setFiltroPeriodo] = useState(FILTRO_TODOS)
  const filtroAtivo = filtroValido(filtroPeriodo, periodos)

  // Modais
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)
  const [materiaParaEditar, setMateriaParaEditar] = useState<Materia | null>(null)
  const [modalAulaAberto, setModalAulaAberto] = useState(false)
  const [materiaPreSelecionadaAula, setMateriaPreSelecionadaAula] = useState<string | undefined>()
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [materiaPreSelecionadaNota, setMateriaPreSelecionadaNota] = useState<string | undefined>()

  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const [mats, als] = await Promise.all([listarMaterias(), listarAulas()])
      setMaterias(mats)
      setAulas(als)
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Calcula estatísticas para cada matéria
  const statsPorMateria: MateriaStats[] = materias.map((mat) => {
    const aulasDessa = aulas.filter((a) => a.materia_id === mat.id)
    return calcularStatsMateria(mat, aulasDessa, percentualAviso, faltasRestantesAviso)
  })

  // Recorte pelo período selecionado: matérias e TODAS as estatísticas consideram só esse filtro
  const statsFiltradas = statsPorMateria.filter((s) => pertencePeriodo(s.materia, filtroAtivo))

  // Totais do recorte atual
  const totalCargaHoraria = statsFiltradas.reduce(
    (acc, s) => acc + (s.materia.carga_horaria || 0),
    0,
  )
  const totalLimiteFaltasHoras = statsFiltradas.reduce(
    (acc, s) => acc + (s.materia.limite_faltas || 0),
    0,
  )
  const totalHorasFaltas = statsFiltradas.reduce((acc, s) => acc + s.horasFaltas, 0)
  const totalAulasRealizadas = statsFiltradas.reduce((acc, s) => acc + s.totalAulas, 0)
  const totalPresencas = statsFiltradas.reduce((acc, s) => acc + s.totalPresencas, 0)

  const taxaPresencaGeral =
    totalAulasRealizadas > 0 ? Math.round((totalPresencas / totalAulasRealizadas) * 100) : 100

  const materiasEmAlerta = statsFiltradas.filter((s) => s.isAlerta || s.isEstourado)

  const handleAbrirNovaMateria = () => {
    setMateriaParaEditar(null)
    setModalMateriaAberto(true)
  }

  const handleEditarMateria = (materia: Materia) => {
    setMateriaParaEditar(materia)
    setModalMateriaAberto(true)
  }

  const handleLancarAula = (materiaId?: string) => {
    setMateriaPreSelecionadaAula(materiaId || statsFiltradas[0]?.materia.id || materias[0]?.id)
    setModalAulaAberto(true)
  }

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

  const recarregarTudo = async () => {
    await carregarDados()
    await recarregarPeriodos()
  }

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={handleAbrirNovaMateria} totalAlertas={materiasEmAlerta.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold">
                Semestre Letivo Atual
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Painel Geral de Faltas
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Acompanhe o limite de faltas de cada matéria e mantenha sua frequência segura.
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={carregarDados}
              disabled={isLoading}
              className="rounded-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs h-9 px-3 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => handleLancarAula()}
                disabled={materias.length === 0}
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-indigo-600/30 gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Marcar Aula</span>
              </Button>

              <Button
                size="sm"
                onClick={() => handleLancarNota()}
                disabled={materias.length === 0}
                variant="outline"
                className="rounded-full border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 text-xs font-semibold h-9 px-4 shadow-md shadow-cyan-600/20 gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Lançar Nota</span>
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleAbrirNovaMateria}
              className="rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-cyan-600/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Matéria</span>
            </Button>
          </div>
        </div>

        {/* Global Alert Notification Banner */}
        <AlertaBanner
          statsMaterias={statsFiltradas}
          percentualAviso={percentualAviso}
          faltasRestantesAviso={faltasRestantesAviso}
        />

        {/* Key Metrics Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-zinc-400">
                  Matérias Cursadas
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-white">{materias.length}</p>
              <p className="text-[11px] text-zinc-500">{totalCargaHoraria}h de carga total</p>
            </CardContent>
          </Card>

          <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-zinc-400">
                  Presença Geral
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400">{taxaPresencaGeral}%</p>
              <p className="text-[11px] text-zinc-500">
                {totalPresencas} presenças em {totalAulasRealizadas} aulas
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-zinc-400">
                  Faltas Acumuladas
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-zinc-100">{totalHorasFaltas}h</p>
              <p className="text-[11px] text-zinc-500">
                Teto total permitido: {totalLimiteFaltasHoras}h
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-zinc-400">
                  Em Alerta / Risco
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400">{materiasEmAlerta.length}</p>
              <p className="text-[11px] text-zinc-500">
                {materiasEmAlerta.length === 0
                  ? 'Todas dentro da margem'
                  : `${materiasEmAlerta.length} disciplina(s) em atenção`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de faltas por matéria (respeita o filtro de período) */}
        <GraficoFaltasMateria statsMaterias={statsFiltradas} />

        {/* Gráfico de pontuação por matéria (respeita o filtro de período) */}
        <GraficoPontosMateria
          statsMaterias={statsFiltradas}
          avaliacoesPorMateria={avaliacoesPorMateria}
          config={configPontos}
        />

        {/* Section: Suas Matérias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Matérias e Percentual de Faltas</span>
                <span className="text-xs font-normal text-zinc-500">
                  (limite padrão de {PERCENTUAL_REPROVACAO_PADRAO}% da carga horária)
                </span>
              </h2>
            </div>
            <Link
              to="/materias"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Ver todas em lista &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Carregando matérias e cálculos de presença...</p>
            </div>
          ) : statsFiltradas.length === 0 ? (
            <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <BookOpen className="w-7 h-7" />
              </div>
              {materias.length === 0 ? (
                <>
                  <h3 className="text-base font-bold text-white">
                    Nenhuma matéria cadastrada ainda
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
                    Comece adicionando as matérias que você está cursando neste semestre com a
                    respectiva carga horária.
                  </p>
                  <Button
                    onClick={handleAbrirNovaMateria}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold px-5 h-9 shadow-lg shadow-indigo-600/30 gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Primeira Matéria</span>
                  </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {statsFiltradas.map((stats) => (
                <MateriaCard
                  key={stats.materia.id}
                  stats={stats}
                  onLancarAula={handleLancarAula}
                  onLancarNota={handleLancarNota}
                  onEditarMateria={handleEditarMateria}
                  avaliacoes={avaliacoesPorMateria[stats.materia.id] || []}
                  configPontos={configPontos}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section: Explicação didática da regra dos 25% (percentual padrão) */}
        <div className="p-4 rounded-2xl bg-[#0f1424] border tech-border flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-zinc-200">Como funciona o cálculo de faltas?</h4>
            <p className="text-zinc-400 leading-relaxed text-[12px]">
              Pela Lei de Diretrizes e Bases da Educação (LDB) e regimento da maioria das
              universidades brasileiras, o aluno precisa de no mínimo{' '}
              <strong className="text-zinc-200">75% de frequência</strong> para aprovação, podendo
              faltar no máximo{' '}
              <strong className="text-indigo-300">
                {PERCENTUAL_REPROVACAO_PADRAO}% da carga horária
              </strong>{' '}
              (padrão; cada matéria pode ter um percentual próprio no cadastro). Nosso sistema
              calcula o teto de horas exatas e avisa com destaque quando você consome{' '}
              <strong className="text-amber-300">{percentualAviso}% ou mais do seu limite</strong>,
              permitindo que você reaja antes de reprovar.
            </p>
          </div>
        </div>
      </main>

      {/* Modais */}
      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={recarregarTudo}
        materiaParaEditar={materiaParaEditar}
      />

      <ModalAula
        isOpen={modalAulaAberto}
        onClose={() => setModalAulaAberto(false)}
        onSuccess={carregarDados}
        materias={materias}
        materiaPreSelecionadaId={materiaPreSelecionadaAula}
      />

      <ModalLancarNota
        isOpen={modalNotaAberto}
        onClose={() => setModalNotaAberto(false)}
        onSuccess={recarregarTudo}
        materias={materias}
        materiaPreSelecionadaId={materiaPreSelecionadaNota}
      />
    </div>
  )
}
