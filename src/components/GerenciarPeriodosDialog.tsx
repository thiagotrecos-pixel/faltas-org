import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Periodo } from '@/types'
import { criarPeriodo, renomearPeriodo, excluirPeriodo } from '@/services/periodos'
import { useToast } from '@/hooks/use-toast'
import { CalendarDays, Check, Edit2, Plus, Trash2, X } from 'lucide-react'

interface GerenciarPeriodosDialogProps {
  isOpen: boolean
  onClose: () => void
  periodos: Periodo[]
  /** Chamado após criar, renomear ou excluir um período. */
  onAlterado: () => void | Promise<void>
}

export const GerenciarPeriodosDialog: React.FC<GerenciarPeriodosDialogProps> = ({
  isOpen,
  onClose,
  periodos,
  onAlterado,
}) => {
  const { toast } = useToast()
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [periodoParaExcluir, setPeriodoParaExcluir] = useState<Periodo | null>(null)
  const [isSalvando, setIsSalvando] = useState(false)

  const erro = (titulo: string, err: unknown) => {
    console.error(err)
    toast({
      title: titulo,
      description: (err as { message?: string })?.message || 'Tente novamente.',
      variant: 'destructive',
    })
  }

  /** Valida nome preenchido e sem repetição (ignora o próprio período ao renomear). */
  const nomeValido = (nome: string, ignorarId?: string): boolean => {
    const limpo = nome.trim()
    if (!limpo) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do período (ex: 2026/2).',
        variant: 'destructive',
      })
      return false
    }
    const duplicado = periodos.some(
      (p) => p.id !== ignorarId && p.nome.trim().toLowerCase() === limpo.toLowerCase(),
    )
    if (duplicado) {
      toast({
        title: 'Período já existe',
        description: `Já existe um período chamado "${limpo}".`,
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeValido(novoNome)) return
    setIsSalvando(true)
    try {
      const nome = novoNome.trim()
      await criarPeriodo(nome)
      setNovoNome('')
      toast({ title: 'Período criado', description: `"${nome}" foi adicionado.` })
      await onAlterado()
    } catch (err) {
      erro('Erro ao criar período', err)
    } finally {
      setIsSalvando(false)
    }
  }

  const iniciarEdicao = (periodo: Periodo) => {
    setEditandoId(periodo.id)
    setNomeEdicao(periodo.nome)
  }

  const handleRenomear = async (periodo: Periodo) => {
    if (!nomeValido(nomeEdicao, periodo.id)) return
    setIsSalvando(true)
    try {
      await renomearPeriodo(periodo.id, nomeEdicao)
      setEditandoId(null)
      toast({ title: 'Período renomeado' })
      await onAlterado()
    } catch (err) {
      erro('Erro ao renomear período', err)
    } finally {
      setIsSalvando(false)
    }
  }

  const handleExcluir = async () => {
    if (!periodoParaExcluir) return
    setIsSalvando(true)
    try {
      await excluirPeriodo(periodoParaExcluir.id)
      toast({
        title: 'Período excluído',
        description: 'As matérias dele continuam cadastradas, agora sem período.',
      })
      setPeriodoParaExcluir(null)
      await onAlterado()
    } catch (err) {
      erro('Erro ao excluir período', err)
    } finally {
      setIsSalvando(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-[#0f1424] border tech-border text-zinc-100 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/40">
                <CalendarDays className="w-4 h-4 text-indigo-300" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                Períodos
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              Crie um período para cada semestre (ex: 2026/2) e escolha-o ao cadastrar uma matéria.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriar} className="flex items-center gap-2">
            <Input
              placeholder="Ex: 2026/2"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              disabled={isSalvando}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9"
            />
            <Button
              type="submit"
              disabled={isSalvando}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold h-9 px-4 gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </Button>
          </form>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {periodos.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhum período criado ainda.</p>
            ) : (
              periodos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#101426] border border-zinc-800/80"
                >
                  {editandoId === p.id ? (
                    <>
                      <Input
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        autoFocus
                        className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isSalvando}
                        onClick={() => handleRenomear(p)}
                        className="w-8 h-8 rounded-xl text-emerald-400 hover:bg-emerald-500/10"
                        title="Salvar nome"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditandoId(null)}
                        className="w-8 h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-mono text-sm font-semibold text-zinc-200 truncate">
                        {p.nome}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => iniciarEdicao(p)}
                        className="w-8 h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
                        title="Renomear período"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPeriodoParaExcluir(p)}
                        className="w-8 h-8 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir período"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão do período */}
      <AlertDialog
        open={!!periodoParaExcluir}
        onOpenChange={(open) => !open && setPeriodoParaExcluir(null)}
      >
        <AlertDialogContent className="bg-[#0f1424] border tech-border text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir período?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs">
              O período <strong className="text-white">"{periodoParaExcluir?.nome}"</strong> será
              removido. Suas matérias e aulas <strong className="text-zinc-200">não</strong> serão
              apagadas: elas ficam como "Sem período".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isSalvando}
              className="rounded-full text-xs border-zinc-700 bg-transparent text-zinc-300 hover:bg-white/5"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={isSalvando}
              className="rounded-full text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {isSalvando ? 'Excluindo...' : 'Sim, Excluir Período'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
