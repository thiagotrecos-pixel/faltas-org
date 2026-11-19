import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Materia } from '@/types'
import { SecaoAvaliacoes } from '@/components/SecaoAvaliacoes'
import { useConfigPontos } from '@/hooks/use-config-pontos'
import { GraduationCap } from 'lucide-react'

interface ModalLancarNotaProps {
  isOpen: boolean
  onClose: () => void
  /** Matérias disponíveis para escolher (quando o contexto não tem uma só). */
  materias: Materia[]
  /** Quando definida, abre direto nesta matéria (sem seletor). */
  materiaPreSelecionadaId?: string
  /** Chamado após qualquer lançamento/edição/exclusão de avaliação. */
  onSuccess?: () => void
}

/**
 * Modal "Lançar nota": escolhe (ou recebe) a matéria e reutiliza a seção
 * de avaliações do ModalMateria para lançar pontos/notas.
 */
export function ModalLancarNota({
  isOpen,
  onClose,
  materias,
  materiaPreSelecionadaId,
  onSuccess,
}: ModalLancarNotaProps) {
  const { config: configPontos } = useConfigPontos()
  const [materiaId, setMateriaId] = useState<string>(
    materiaPreSelecionadaId || materias[0]?.id || '',
  )

  useEffect(() => {
    if (!isOpen) return
    if (materiaPreSelecionadaId) {
      setMateriaId(materiaPreSelecionadaId)
    } else if (!materias.some((m) => m.id === materiaId)) {
      setMateriaId(materias[0]?.id || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, materiaPreSelecionadaId])

  const materia = useMemo(
    () => materias.find((m) => m.id === materiaId) || null,
    [materias, materiaId],
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1424] border tech-border text-zinc-100 shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-white">
              Lançar Nota
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Registre avaliações (P1, P2, trabalhos...) com os pontos obtidos. A pílula e os gráficos
            atualizam na hora.
          </DialogDescription>
        </DialogHeader>

        {!materiaPreSelecionadaId && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Matéria *</label>
            <Select value={materiaId} onValueChange={setMateriaId}>
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
        )}

        <SecaoAvaliacoes materia={materia} config={configPontos} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}

export default ModalLancarNota
