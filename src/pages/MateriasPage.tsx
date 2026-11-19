import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { ModalMateria } from '@/components/ModalMateria'
import { Materia, Aula, MateriaStats } from '@/types'
import { listarMaterias, excluirMateria } from '@/services/materias'
import { listarAulas } from '@/services/aulas'
import { calcularStatsMateria } from '@/services/calculations'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Clock,
  Sparkles,
  CalendarDays,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { MateriaCardGrade } from '@/components/MateriaCardGrade'
import { usePeriodos } from '@/hooks/use-periodos'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { GerenciarPeriodosDialog } from '@/components/GerenciarPeriodosDialog'
import {
  FILTRO_TODOS,
  FILTRO_SEM_PERIODO,
  filtroValido,
  pertencePeriodo,
} from '@/services/periodos'

export const MateriasPage: React.FC = () => {
  const { toast } = useToast()
  const { percentualAviso, faltasRestantesAviso } = useConfiguracaoAviso()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const { periodos, recarregar: recarregarPeriodos } = usePeriodos()
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [gerenciarPeriodosAberto, setGerenciarPeriodosAberto] = useState(false)
  const filtroAtivo = filtroValido(filtroPeriodo, periodos)

  const tituloGrupo = (filtro: string) =>
    filtro === FILTRO_SEM_PERIODO
      ? 'Sem período'
      : periodos.find((p) => p.id === filtro)?.nome || 'Matérias'

  // Modais
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)
  const [materiaParaEditar, setMateriaParaEditar] = useState<Materia | null>(null)
  const [materiaParaExcluir, setMateriaParaExcluir] = useState<Materia | null>(null)
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

  const statsPorMateria: MateriaStats[] = materias.map((mat) => {
    const aulasDessa = aulas.filter((a) => a.materia_id === mat.id)
    return calcularStatsMateria(mat, aulasDessa, percentualAviso, faltasRestantesAviso)
  })

  const filtradas = statsPorMateria.filter((s) => {
    const termo = busca.toLowerCase()
    if (!pertencePeriodo(s.materia, filtroAtivo)) return false
    return (
      s.materia.nome.toLowerCase().includes(termo) ||
      (s.materia.codigo && s.materia.codigo.toLowerCase().includes(termo)) ||
      (s.materia.professor && s.materia.professor.toLowerCase().includes(termo))
    )
  })

  // Agrupa as matérias por período (na ordem dos períodos), com "Sem período" no fim.
  const gruposPeriodo: { id: string; titulo: string; itens: MateriaStats[] }[] = periodos.map(
    (p) => ({ id: p.id, titulo: p.nome, itens: [] }),
  )
  const grupoSemPeriodo = { id: 'sem', titulo: 'Sem período', itens: [] as MateriaStats[] }
  for (const s of filtradas) {
    const grupo = s.materia.periodo_id
      ? gruposPeriodo.find((g) => g.id === s.materia.periodo_id)
      : null
    if (grupo) grupo.itens.push(s)
    else grupoSemPeriodo.itens.push(s)
  }
  const gruposVisiveis =
    filtroAtivo === FILTRO_TODOS
      ? [
          ...gruposPeriodo.filter((g) => g.itens.length > 0),
          ...(grupoSemPeriodo.itens.length > 0 ? [grupoSemPeriodo] : []),
        ]
      : [{ id: filtroAtivo, titulo: tituloGrupo(filtroAtivo), itens: filtradas }]

  const handleExcluir = async () => {
    if (!materiaParaExcluir) return
    setIsExcluindo(true)
    try {
      await excluirMateria(materiaParaExcluir.id)
      toast({
        title: 'Matéria excluída',
        description: `"${materiaParaExcluir.nome}" e suas aulas foram removidas.`,
      })
      setMateriaParaExcluir(null)
      carregarDados()
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao excluir matéria',
        description: (err as { message?: string })?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsExcluindo(false)
    }
  }

  const totalAlertas = statsPorMateria.filter((s) => s.isAlerta || s.isEstourado).length

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar
        onOpenNovaMateria={() => {
          setMateriaParaEditar(null)
          setModalMateriaAberto(true)
        }}
        totalAlertas={totalAlertas}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Gerenciar Matérias</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cadastre suas disciplinas, configure a carga horária e confira o limite de faltas.
            </p>
          </div>

          <Button
            onClick={() => {
              setMateriaParaEditar(null)
              setModalMateriaAberto(true)
            }}
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 shadow-md shadow-indigo-600/30 gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Matéria</span>
          </Button>
        </div>

        {/* Período */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <FiltroPeriodo periodos={periodos} value={filtroAtivo} onChange={setFiltroPeriodo} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGerenciarPeriodosAberto(true)}
            className="rounded-full border-zinc-700 bg-transparent hover:bg-white/5 text-zinc-300 text-xs h-8 px-3.5 gap-1.5 self-start sm:self-auto"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Gerenciar períodos
          </Button>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <Input
              placeholder="Buscar matéria por nome, código ou professor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-[#101426] border-zinc-700/60 pl-9 text-xs h-9 text-zinc-200"
            />
          </div>
          <span className="text-xs text-zinc-500">{filtradas.length} matéria(s) encontrada(s)</span>
        </div>

        {/* Lista de matérias */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-500">Carregando matérias...</div>
        ) : filtradas.length === 0 ? (
          <Card className="tech-card border tech-border rounded-2xl p-12 text-center">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">Nenhuma matéria encontrada</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              {busca
                ? 'Nenhum resultado corresponde à sua busca.'
                : 'Cadastre sua primeira matéria para começar.'}
            </p>
            {!busca && (
              <Button
                size="sm"
                onClick={() => {
                  setMateriaParaEditar(null)
                  setModalMateriaAberto(true)
                }}
                className="bg-indigo-600 text-white text-xs rounded-full px-4"
              >
                Cadastrar Matéria
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-8">
            {gruposVisiveis.map((grupo) => (
              <section key={grupo.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    {grupo.titulo}
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {grupo.itens.length} matéria(s)
                  </span>
                  <div className="flex-1 h-px bg-zinc-800/80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grupo.itens.map((item) => (
                    <MateriaCardGrade
                      key={item.materia.id}
                      item={item}
                      onEditar={(m) => {
                        setMateriaParaEditar(m)
                        setModalMateriaAberto(true)
                      }}
                      onExcluir={setMateriaParaExcluir}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Gerenciador de períodos */}
      <GerenciarPeriodosDialog
        isOpen={gerenciarPeriodosAberto}
        onClose={() => setGerenciarPeriodosAberto(false)}
        periodos={periodos}
        onAlterado={async () => {
          await recarregarPeriodos()
          await carregarDados()
        }}
      />

      {/* Modal Criar / Editar Matéria */}
      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={carregarDados}
        materiaParaEditar={materiaParaEditar}
      />

      {/* Confirmação de Exclusão */}
      <AlertDialog
        open={!!materiaParaExcluir}
        onOpenChange={(open) => !open && setMateriaParaExcluir(null)}
      >
        <AlertDialogContent className="bg-[#0f1424] border tech-border text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir matéria?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs">
              Tem certeza de que deseja excluir a matéria{' '}
              <strong className="text-white">"{materiaParaExcluir?.nome}"</strong>? Todas as aulas e
              presenças vinculadas a ela serão excluídas permanentemente.
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
              onClick={handleExcluir}
              disabled={isExcluindo}
              className="rounded-full text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {isExcluindo ? 'Excluindo...' : 'Sim, Excluir Matéria'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
