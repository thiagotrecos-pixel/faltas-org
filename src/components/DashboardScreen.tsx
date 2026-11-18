import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { MateriaCard } from '@/components/MateriaCard'
import { AlertaBanner } from '@/components/AlertaBanner'
import { ModalMateria } from '@/components/ModalMateria'
import { ModalAula } from '@/components/ModalAula'
import { Materia, Aula, MateriaStats } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas } from '@/services/aulas'
import { calcularStatsMateria } from '@/services/calculations'
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
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modais
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)
  const [materiaParaEditar, setMateriaParaEditar] = useState<Materia | null>(null)
  const [modalAulaAberto, setModalAulaAberto] = useState(false)
  const [materiaPreSelecionadaAula, setMateriaPreSelecionadaAula] = useState<string | undefined>()

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
    return calcularStatsMateria(mat, aulasDessa)
  })

  // Totais globais
  const totalCargaHoraria = materias.reduce((acc, m) => acc + (m.carga_horaria || 0), 0)
  const totalLimiteFaltasHoras = materias.reduce((acc, m) => acc + (m.limite_faltas || 0), 0)
  const totalHorasFaltas = statsPorMateria.reduce((acc, s) => acc + s.horasFaltas, 0)
  const totalAulasRealizadas = statsPorMateria.reduce((acc, s) => acc + s.totalAulas, 0)
  const totalPresencas = statsPorMateria.reduce((acc, s) => acc + s.totalPresencas, 0)

  const taxaPresencaGeral =
    totalAulasRealizadas > 0 ? Math.round((totalPresencas / totalAulasRealizadas) * 100) : 100

  const materiasEmAlerta = statsPorMateria.filter((s) => s.isAlerta || s.isEstourado)

  const handleAbrirNovaMateria = () => {
    setMateriaParaEditar(null)
    setModalMateriaAberto(true)
  }

  const handleEditarMateria = (materia: Materia) => {
    setMateriaParaEditar(materia)
    setModalMateriaAberto(true)
  }

  const handleLancarAula = (materiaId?: string) => {
    setMateriaPreSelecionadaAula(materiaId || materias[0]?.id)
    setModalAulaAberto(true)
  }

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={handleAbrirNovaMateria} totalAlertas={materiasEmAlerta.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              Acompanhe seu teto de 25% de faltas em cada matéria e mantenha sua frequência segura.
            </p>
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
              onClick={handleAbrirNovaMateria}
              className="rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-cyan-600/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Matéria</span>
            </Button>
          </div>
        </div>

        {/* Global Alert Notification Banner */}
        <AlertaBanner statsMaterias={statsPorMateria} />

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

        {/* Section: Suas Matérias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Matérias e Percentual de Faltas</span>
                <span className="text-xs font-normal text-zinc-500">
                  (limite de 25% da carga horária)
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
          ) : materias.length === 0 ? (
            <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhuma matéria cadastrada ainda</h3>
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
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {statsPorMateria.map((stats) => (
                <MateriaCard
                  key={stats.materia.id}
                  stats={stats}
                  onLancarAula={handleLancarAula}
                  onEditarMateria={handleEditarMateria}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section: Explicação didática da regra dos 25% */}
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
              faltar no máximo <strong className="text-indigo-300">25% da carga horária</strong>.
              Nosso sistema calcula o teto de horas exatas e avisa com destaque quando você consome{' '}
              <strong className="text-amber-300">75% ou mais do seu limite</strong>, permitindo que
              você reaja antes de reprovar.
            </p>
          </div>
        </div>
      </main>

      {/* Modais */}
      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={carregarDados}
        materiaParaEditar={materiaParaEditar}
      />

      <ModalAula
        isOpen={modalAulaAberto}
        onClose={() => setModalAulaAberto(false)}
        onSuccess={carregarDados}
        materias={materias}
        materiaPreSelecionadaId={materiaPreSelecionadaAula}
      />
    </div>
  )
}
