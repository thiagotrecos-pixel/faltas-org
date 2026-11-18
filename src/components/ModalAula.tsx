import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Aula, Materia } from '@/types'
import { criarAula, atualizarAula } from '@/services/aulas'
import { useToast } from '@/hooks/use-toast'
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ModalAulaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  materias: Materia[]
  aulaParaEditar?: Aula | null
  materiaPreSelecionadaId?: string
}

export const ModalAula: React.FC<ModalAulaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  materias,
  aulaParaEditar,
  materiaPreSelecionadaId,
}) => {
  const { toast } = useToast()
  const isEdicao = !!aulaParaEditar

  const defaultDate = new Date().toISOString().split('T')[0]
  const [materiaId, setMateriaId] = useState(
    aulaParaEditar?.materia_id || materiaPreSelecionadaId || (materias[0]?.id ?? ''),
  )
  const [data, setData] = useState(aulaParaEditar?.data || defaultDate)
  const [status, setStatus] = useState<'presenca' | 'falta' | 'prevista'>(
    aulaParaEditar?.status || 'presenca',
  )
  const [conteudo, setConteudo] = useState(aulaParaEditar?.conteudo || '')
  const [horas, setHoras] = useState(aulaParaEditar?.horas ? String(aulaParaEditar.horas) : '2')
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (aulaParaEditar) {
      setMateriaId(aulaParaEditar.materia_id)
      setData(aulaParaEditar.data)
      setStatus(aulaParaEditar.status)
      setConteudo(aulaParaEditar.conteudo || '')
      setHoras(String(aulaParaEditar.horas || 2))
    } else {
      setMateriaId(materiaPreSelecionadaId || materias[0]?.id || '')
      setData(new Date().toISOString().split('T')[0])
      setStatus('presenca')
      setConteudo('')
      // Set default horas from selected materia
      const sel = materias.find((m) => m.id === (materiaPreSelecionadaId || materias[0]?.id))
      setHoras(String(sel?.horas_por_aula || 2))
    }
  }, [aulaParaEditar, materiaPreSelecionadaId, materias, isOpen])

  const handleMateriaChange = (id: string) => {
    setMateriaId(id)
    const sel = materias.find((m) => m.id === id)
    if (sel && sel.horas_por_aula) {
      setHoras(String(sel.horas_por_aula))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materiaId) {
      toast({
        title: 'Selecione uma matéria',
        description: 'É necessário vincular a aula a uma matéria.',
        variant: 'destructive',
      })
      return
    }
    if (!data) {
      toast({
        title: 'Data obrigatória',
        description: 'Informe a data da aula.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdicao && aulaParaEditar) {
        await atualizarAula(aulaParaEditar.id, {
          materia_id: materiaId,
          data,
          status,
          conteudo,
          horas: Number(horas) || 2,
        })
        toast({
          title: 'Aula atualizada!',
          description: `Registro do dia ${data} atualizado.`,
        })
      } else {
        await criarAula({
          materia_id: materiaId,
          data,
          status,
          conteudo,
          horas: Number(horas) || 2,
        })
        toast({
          title: status === 'falta' ? 'Falta registrada!' : 'Presença registrada!',
          description: `Lançamento salvo com sucesso para o dia ${data}.`,
        })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao registrar aula',
        description: (err as { message?: string })?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1424] border tech-border text-zinc-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-white">
              {isEdicao ? 'Editar Aula' : 'Lançar Aula'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Marque presença ou falta e registre o conteúdo abordado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Matéria */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300">Matéria *</Label>
            <Select value={materiaId} onValueChange={handleMateriaChange}>
              <SelectTrigger className="bg-[#151a2e] border-zinc-700/60 text-sm h-9">
                <SelectValue placeholder="Selecione a matéria" />
              </SelectTrigger>
              <SelectContent className="bg-[#151a2e] border-zinc-700 text-zinc-200">
                {materias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: m.cor || '#6366f1' }}
                      />
                      <span>{m.nome}</span>
                      {m.codigo && (
                        <span className="text-zinc-500 text-xs font-mono">({m.codigo})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status da Aula: Presença / Falta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300">Situação nesta aula *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('presenca')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'presenca'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-[#151a2e] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Presença</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('falta')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'falta'
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-md shadow-rose-500/10'
                    : 'bg-[#151a2e] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Falta</span>
              </button>
            </div>
          </div>

          {/* Data e Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data" className="text-xs font-semibold text-zinc-300">
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9 text-zinc-100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horas" className="text-xs text-zinc-300">
                Duração da aula
              </Label>
              <div className="relative">
                <Input
                  id="horas"
                  type="number"
                  min="1"
                  step="1"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9 pr-8 text-zinc-100"
                />
                <span className="absolute right-3 top-2.5 text-xs text-zinc-500">h</span>
              </div>
            </div>
          </div>

          {/* Conteúdo abordado */}
          <div className="space-y-1.5">
            <Label htmlFor="conteudo" className="text-xs text-zinc-300">
              Conteúdo / Tema da aula
            </Label>
            <Input
              id="conteudo"
              placeholder="Ex: Introdução ao capítulo 3, Lista de exercícios..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-full text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold px-5 shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? 'Salvando...' : isEdicao ? 'Salvar Aula' : 'Confirmar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
