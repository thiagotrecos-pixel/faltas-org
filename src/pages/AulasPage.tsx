import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ModalAula } from '@/components/ModalAula'
import { ModalMateria } from '@/components/ModalMateria'
import { Materia, Aula, MateriaStats } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas, alternarStatusAula, excluirAula } from '@/services/aulas'
import { calcularStatsMateria } from '@/services/calculations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Clock,
  Sparkles,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const AulasPage: React.FC = () => {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const filtroMateriaUrl = searchParams.get('materia') || 'todas'

  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filtroMateria, setFiltroMateria] = useState<string>(filtroMateriaUrl)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Modais
  const [modalAulaAberto, setModalAulaAberto] = useState(false)
  const [aulaParaEditar, setAulaParaEditar] = useState<Aula | null>(null)
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)
  const [aulaParaExcluir, setAulaParaExcluir] = useState<Aula | null>(null)
  const [isExcluindo, setIsExcluindo] = useState(false)

  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const [mats, als] = await Promise.all([listarMaterias(), listarAulas()])
      setMaterias(mats)
      setAulas(als)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useEffect(() => {
    if (filtroMateriaUrl !== filtroMateria) {
      setFiltroMateria(filtroMateriaUrl)
    }
  }, [filtroMateriaUrl])

  const handleSelectMateria = (val: string) => {
    setFiltroMateria(val)
    if (val === 'todas') {
      searchParams.delete('materia')
    } else {
      searchParams.set('materia', val)
    }
    setSearchParams(searchParams)
  }

  // Toggle rápido presença <-> falta no checklist
  const handleToggleStatus = async (aula: Aula) => {
    try {
      const novoStatus = aula.status === 'presenca' ? 'falta' : 'presenca'
      // Atualiza optimisticamente
      setAulas((prev) => prev.map((a) => (a.id === aula.id ? { ...a, status: novoStatus } : a)))
      await alternarStatusAula(aula.id, aula.status)
      toast({
        title: novoStatus === 'falta' ? 'Falta anotada!' : 'Presença confirmada!',
        description: `Status alterado para ${novoStatus}. O percentual foi recalculado.`,
      })
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao alternar presença/falta',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
      carregarDados()
    }
  }

  const handleExcluirAula = async () => {
    if (!aulaParaExcluir) return
    setIsExcluindo(true)
    try {
      await excluirAula(aulaParaExcluir.id)
      toast({
        title: 'Lançamento excluído',
        description: 'A aula foi removida e as estatísticas foram atualizadas.',
      })
      setAulaParaExcluir(null)
      carregarDados()
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao excluir aula',
        variant: 'destructive',
      })
    } finally {
      setIsExcluindo(false)
    }
  }

  // Filtragem
  const aulasFiltradas = aulas.filter((a) => {
    if (filtroMateria !== 'todas' && a.materia_id !== filtroMateria) return false
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
    return true
  })

  // Estatísticas da matéria selecionada se houver filtro específico
  const materiaSelecionadaObj = materias.find((m) => m.id === filtroMateria)
  const statsMateriaSelecionada = materiaSelecionadaObj
    ? calcularStatsMateria(
        materiaSelecionadaObj,
        aulas.filter((a) => a.materia_id === materiaSelecionadaObj.id),
      )
    : null

  const statsPorMateria: MateriaStats[] = materias.map((mat) => {
    const aulasDessa = aulas.filter((a) => a.materia_id === mat.id)
    return calcularStatsMateria(mat, aulasDessa)
  })
  const totalAlertas = statsPorMateria.filter((s) => s.isAlerta || s.isEstourado).length

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={() => setModalMateriaAberto(true)} totalAlertas={totalAlertas} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-400" />
              <span>Checklist de Aulas e Presenças</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Marque rapidamente presença ou falta com um clique a cada aula e acompanhe o
              percentual em tempo real.
            </p>
          </div>

          <Button
            onClick={() => {
              setAulaParaEditar(null)
              setModalAulaAberto(true)
            }}
            disabled={materias.length === 0}
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-indigo-600/30 gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Nova Aula</span>
          </Button>
        </div>

        {/* Resumo Dinâmico se matéria específica estiver selecionada */}
        {statsMateriaSelecionada && (
          <div className="p-4 rounded-2xl bg-[#0f1424] border tech-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
                style={{
                  backgroundColor: statsMateriaSelecionada.materia.cor || '#6366f1',
                }}
              >
                {statsMateriaSelecionada.materia.codigo || 'MAT'}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {statsMateriaSelecionada.materia.nome}
                </h3>
                <p className="text-xs text-zinc-400">
                  Carga total: {statsMateriaSelecionada.materia.carga_horaria}h • Limite:{' '}
                  {statsMateriaSelecionada.materia.limite_faltas}h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-zinc-400 text-[11px] block">Faltas acumuladas</span>
                <span
                  className={`text-base font-bold font-mono ${
                    statsMateriaSelecionada.isEstourado
                      ? 'text-rose-400'
                      : statsMateriaSelecionada.isAlerta
                        ? 'text-amber-400'
                        : 'text-zinc-200'
                  }`}
                >
                  {statsMateriaSelecionada.horasFaltas}h (
                  {statsMateriaSelecionada.percentualFaltasCarga}%)
                </span>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <span className="text-zinc-400 text-[11px] block">Ainda pode faltar</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {statsMateriaSelecionada.faltasRestantesHoras}h (~
                  {statsMateriaSelecionada.aulasRestantesPossiveis} aulas)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0d1020] p-3 rounded-2xl border tech-border">
          <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filtrar por:</span>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={filtroMateria} onValueChange={handleSelectMateria}>
              <SelectTrigger className="bg-[#14182e] border-zinc-700/60 text-xs h-8">
                <SelectValue placeholder="Todas as matérias" />
              </SelectTrigger>
              <SelectContent className="bg-[#14182e] border-zinc-700 text-zinc-200">
                <SelectItem value="todas">Todas as matérias</SelectItem>
                {materias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="bg-[#14182e] border-zinc-700/60 text-xs h-8">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-[#14182e] border-zinc-700 text-zinc-200">
                <SelectItem value="todos">Todos os lançamentos</SelectItem>
                <SelectItem value="presenca">Somente Presenças</SelectItem>
                <SelectItem value="falta">Somente Faltas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-zinc-500 shrink-0">
            {aulasFiltradas.length} registro(s)
          </span>
        </div>

        {/* Checklist de Aulas */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-500">Carregando aulas...</div>
        ) : aulasFiltradas.length === 0 ? (
          <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
            <CheckSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">Nenhuma aula encontrada</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              {filtroMateria !== 'todas' || filtroStatus !== 'todos'
                ? 'Nenhum lançamento corresponde aos filtros selecionados.'
                : 'Você ainda não registrou nenhuma aula neste semestre.'}
            </p>
            <Button
              size="sm"
              onClick={() => {
                setAulaParaEditar(null)
                setModalAulaAberto(true)
              }}
              disabled={materias.length === 0}
              className="bg-indigo-600 text-white text-xs rounded-full px-4"
            >
              Registrar Aula Agora
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {aulasFiltradas.map((aula) => {
              const materia = materias.find((m) => m.id === aula.materia_id)
              const cor = materia?.cor || '#6366f1'
              const isPresenca = aula.status === 'presenca'

              return (
                <div
                  key={aula.id}
                  className={`tech-card border rounded-2xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPresenca
                      ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-[#0d1222]/80'
                      : 'border-rose-500/30 hover:border-rose-500/50 bg-[#170e18]/80'
                  }`}
                >
                  {/* Left: Interactive Status toggle & Main Info */}
                  <div className="flex items-center gap-3">
                    {/* One-click toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(aula)}
                      title={`Clique para alternar para ${isPresenca ? 'FALTA' : 'PRESENÇA'}`}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shrink-0 ${
                        isPresenca
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                      }`}
                    >
                      {isPresenca ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cor }}
                        />
                        <span className="font-semibold text-xs text-white">
                          {materia?.nome || 'Matéria'}
                        </span>
                        {materia?.codigo && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {materia.codigo}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPresenca
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPresenca ? 'Presença' : 'Falta'}
                        </span>
                      </div>

                      {aula.conteudo ? (
                        <p className="text-xs text-zinc-300">{aula.conteudo}</p>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Sem anotação de conteúdo</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Date, duration and actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 tech-border text-xs text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {aula.data}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {aula.horas || 2}h
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setAulaParaEditar(aula)
                          setModalAulaAberto(true)
                        }}
                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                        title="Editar aula"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAulaParaExcluir(aula)}
                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir aula"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Lançar / Editar Aula */}
      <ModalAula
        isOpen={modalAulaAberto}
        onClose={() => setModalAulaAberto(false)}
        onSuccess={carregarDados}
        materias={materias}
        aulaParaEditar={aulaParaEditar}
        materiaPreSelecionadaId={filtroMateria !== 'todas' ? filtroMateria : undefined}
      />

      {/* Modal Nova Matéria */}
      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={carregarDados}
      />

      {/* Confirmação de Exclusão de Aula */}
      <AlertDialog
        open={!!aulaParaExcluir}
        onOpenChange={(open) => !open && setAulaParaExcluir(null)}
      >
        <AlertDialogContent className="bg-[#0f1424] border tech-border text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir lançamento de aula?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs">
              Tem certeza de que deseja excluir este registro de aula ({aulaParaExcluir?.data})? O
              total de presenças e faltas da matéria será recalculado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isExcluindo}
              className="rounded-full text-xs border-zinc-700 bg-transparent text-zinc-300 hover:bg-white/5"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirAula}
              disabled={isExcluindo}
              className="rounded-full text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {isExcluindo ? 'Excluindo...' : 'Sim, Excluir Aula'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
