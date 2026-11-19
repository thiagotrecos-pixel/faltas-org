import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { ModalAula } from '@/components/ModalAula'
import { ModalMateria } from '@/components/ModalMateria'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { Materia, Aula } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas, excluirAula } from '@/services/aulas'
import { calcularStatsMateria } from '@/services/calculations'
import { FILTRO_TODOS, filtrarPorPeriodo, filtroValido, pertencePeriodo } from '@/services/periodos'
import { usePeriodos } from '@/hooks/use-periodos'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  History,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Clock,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

/** Formata "AAAA-MM-DD..." como "DD/MM/AAAA"; devolve o valor original se não reconhecer. */
function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return data
  return `${dia}/${mes}/${ano}`
}

export const HistoricoPage: React.FC = () => {
  const { toast } = useToast()
  const { percentualAviso, faltasRestantesAviso } = useConfiguracaoAviso()
  const { periodos, isLoading: carregandoPeriodos } = usePeriodos()

  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(FILTRO_TODOS)
  const [filtroMateria, setFiltroMateria] = useState<string>('todas')
  const [somenteFaltas, setSomenteFaltas] = useState(false)

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

  // Trocar o período limpa a matéria selecionada se ela não pertencer ao novo período.
  const handleMudarPeriodo = (valor: string) => {
    const novo = filtroValido(valor, periodos)
    setFiltroPeriodo(novo)
    if (filtroMateria !== 'todas') {
      const mat = materias.find((m) => m.id === filtroMateria)
      if (!mat || !pertencePeriodo(mat, novo)) setFiltroMateria('todas')
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
      toast({ title: 'Erro ao excluir aula', variant: 'destructive' })
    } finally {
      setIsExcluindo(false)
    }
  }

  // Matérias do período escolhido (alimenta o seletor de matéria)
  const materiasDoPeriodo = filtrarPorPeriodo(materias, filtroPeriodo)
  const idsMateriasDoPeriodo = new Set(materiasDoPeriodo.map((m) => m.id))
  const materiasPorId = new Map(materias.map((m) => [m.id, m]))

  // Histórico: só presenças e faltas (aulas previstas ficam fora), mais recentes primeiro
  const aulasLancadas = aulas
    .filter((a) => a.status === 'presenca' || a.status === 'falta')
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))

  // Recorte por período e matéria (base do resumo)
  const aulasDoRecorte = aulasLancadas.filter((a) => {
    if (filtroPeriodo !== FILTRO_TODOS && !idsMateriasDoPeriodo.has(a.materia_id)) return false
    if (filtroMateria !== 'todas' && a.materia_id !== filtroMateria) return false
    return true
  })

  // Lista exibida: recorte + filtro rápido "só faltas"
  const aulasFiltradas = somenteFaltas
    ? aulasDoRecorte.filter((a) => a.status === 'falta')
    : aulasDoRecorte

  const totalAulas = aulasDoRecorte.length
  const totalFaltas = aulasDoRecorte.filter((a) => a.status === 'falta').length
  const percentualFaltas = totalAulas > 0 ? Math.round((totalFaltas / totalAulas) * 1000) / 10 : 0

  // Alertas para o cabeçalho do menu (mesmo cálculo das outras telas)
  const totalAlertas = materias
    .map((mat) =>
      calcularStatsMateria(
        mat,
        aulas.filter((a) => a.materia_id === mat.id),
        percentualAviso,
        faltasRestantesAviso,
      ),
    )
    .filter((s) => s.isAlerta || s.isEstourado).length

  const semLancamentos = aulasLancadas.length === 0
  const filtrosAtivos = filtroPeriodo !== FILTRO_TODOS || filtroMateria !== 'todas' || somenteFaltas

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={() => setModalMateriaAberto(true)} totalAlertas={totalAlertas} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400" />
              <span>Histórico de Faltas</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Todas as aulas lançadas, da mais recente para a mais antiga. Edite ou exclua qualquer
              lançamento daqui.
            </p>
          </div>
        </div>

        {/* Resumo do recorte filtrado */}
        <div className="grid grid-cols-3 gap-3">
          <div className="tech-card border tech-border rounded-2xl p-4 bg-gradient-to-br from-indigo-600/15 to-transparent">
            <span className="text-[11px] uppercase font-mono text-zinc-400 block">Aulas</span>
            <span className="text-2xl font-bold text-white font-mono">{totalAulas}</span>
          </div>
          <div className="tech-card border tech-border rounded-2xl p-4 bg-gradient-to-br from-rose-600/15 to-transparent">
            <span className="text-[11px] uppercase font-mono text-zinc-400 block">Faltas</span>
            <span className="text-2xl font-bold text-rose-400 font-mono">{totalFaltas}</span>
          </div>
          <div className="tech-card border tech-border rounded-2xl p-4 bg-gradient-to-br from-cyan-500/15 to-transparent">
            <span className="text-[11px] uppercase font-mono text-zinc-400 block">% de faltas</span>
            <span className="text-2xl font-bold text-cyan-300 font-mono">{percentualFaltas}%</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#0d1020] p-3 rounded-2xl border tech-border space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Filtrar por:</span>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                <SelectTrigger className="bg-[#14182e] border-zinc-700/60 text-xs h-8">
                  <SelectValue placeholder="Todas as matérias" />
                </SelectTrigger>
                <SelectContent className="bg-[#14182e] border-zinc-700 text-zinc-200">
                  <SelectItem value="todas">Todas as matérias</SelectItem>
                  {materiasDoPeriodo.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                type="button"
                aria-pressed={somenteFaltas}
                onClick={() => setSomenteFaltas((v) => !v)}
                className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                  somenteFaltas
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-[#14182e] border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {somenteFaltas ? 'Mostrando só faltas' : 'Só faltas'}
              </button>
            </div>

            <span className="text-xs text-zinc-500 shrink-0">
              {aulasFiltradas.length} registro(s)
            </span>
          </div>

          {!carregandoPeriodos && periodos.length > 0 && (
            <FiltroPeriodo
              periodos={periodos}
              value={filtroPeriodo}
              onChange={handleMudarPeriodo}
            />
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-500">Carregando histórico...</div>
        ) : aulasFiltradas.length === 0 ? (
          <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
            <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              {semLancamentos ? 'Nenhum lançamento ainda' : 'Nenhum lançamento neste recorte'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              {semLancamentos
                ? 'Assim que você registrar presenças ou faltas, o histórico aparece aqui.'
                : filtrosAtivos
                  ? 'Nenhum lançamento corresponde aos filtros selecionados.'
                  : 'Nenhum lançamento encontrado.'}
            </p>
            {semLancamentos && (
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
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {aulasFiltradas.map((aula) => {
              const materia = materiasPorId.get(aula.materia_id)
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPresenca
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {isPresenca ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cor }}
                        />
                        <span className="font-semibold text-xs text-white">
                          {materia?.nome || 'Matéria removida'}
                        </span>
                        {materia?.codigo && (
                          <span className="font-mono text-[10px] px-1.5 py-px rounded bg-zinc-800 text-zinc-400">
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
                        <p className="text-xs text-zinc-300 truncate">{aula.conteudo}</p>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Sem anotação de conteúdo</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 tech-border text-xs text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {formatarData(aula.data)}
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
                        title="Editar lançamento"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAulaParaExcluir(aula)}
                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir lançamento"
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

      {/* Modal Editar Aula */}
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

      {/* Confirmação de Exclusão */}
      <AlertDialog
        open={!!aulaParaExcluir}
        onOpenChange={(open) => !open && setAulaParaExcluir(null)}
      >
        <AlertDialogContent className="bg-[#0f1424] border tech-border text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir lançamento de aula?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs">
              Tem certeza de que deseja excluir este registro de aula (
              {aulaParaExcluir ? formatarData(aulaParaExcluir.data) : ''})? O total de presenças e
              faltas da matéria será recalculado imediatamente.
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
