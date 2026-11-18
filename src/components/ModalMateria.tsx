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
import { Materia } from '@/types'
import { criarMateria, atualizarMateria } from '@/services/materias'
import { calcularLimiteFaltas } from '@/services/calculations'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Sparkles, Clock, AlertCircle } from 'lucide-react'

interface ModalMateriaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  materiaParaEditar?: Materia | null
}

const PALETA_CORES = [
  '#6366f1', // Indigo Tech
  '#ec4899', // Pink Neon
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
]

export const ModalMateria: React.FC<ModalMateriaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  materiaParaEditar,
}) => {
  const { toast } = useToast()
  const isEdicao = !!materiaParaEditar

  const [nome, setNome] = useState(materiaParaEditar?.nome || '')
  const [codigo, setCodigo] = useState(materiaParaEditar?.codigo || '')
  const [professor, setProfessor] = useState(materiaParaEditar?.professor || '')
  const [cargaHoraria, setCargaHoraria] = useState(
    materiaParaEditar?.carga_horaria ? String(materiaParaEditar.carga_horaria) : '60',
  )
  const [horasPorAula, setHorasPorAula] = useState(
    materiaParaEditar?.horas_por_aula ? String(materiaParaEditar.horas_por_aula) : '2',
  )
  const [cor, setCor] = useState(materiaParaEditar?.cor || '#6366f1')
  const [limitePersonalizado, setLimitePersonalizado] = useState(
    materiaParaEditar?.limite_faltas ? String(materiaParaEditar.limite_faltas) : '',
  )
  const [usarLimiteAuto, setUsarLimiteAuto] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Atualiza estado se materiaParaEditar mudar
  React.useEffect(() => {
    if (materiaParaEditar) {
      setNome(materiaParaEditar.nome)
      setCodigo(materiaParaEditar.codigo || '')
      setProfessor(materiaParaEditar.professor || '')
      setCargaHoraria(String(materiaParaEditar.carga_horaria))
      setHorasPorAula(String(materiaParaEditar.horas_por_aula || 2))
      setCor(materiaParaEditar.cor || '#6366f1')
      setLimitePersonalizado(String(materiaParaEditar.limite_faltas))
      setUsarLimiteAuto(false)
    } else {
      setNome('')
      setCodigo('')
      setProfessor('')
      setCargaHoraria('60')
      setHorasPorAula('2')
      setCor('#6366f1')
      setLimitePersonalizado('')
      setUsarLimiteAuto(true)
    }
  }, [materiaParaEditar, isOpen])

  const chNum = Number(cargaHoraria) || 0
  const limiteCalculadoAuto = calcularLimiteFaltas(chNum)
  const hAulaNum = Number(horasPorAula) || 2
  const maxFaltasAulas =
    hAulaNum > 0
      ? Math.floor(
          (usarLimiteAuto
            ? limiteCalculadoAuto
            : Number(limitePersonalizado) || limiteCalculadoAuto) / hAulaNum,
        )
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome da matéria.',
        variant: 'destructive',
      })
      return
    }
    if (!chNum || chNum <= 0) {
      toast({
        title: 'Carga horária inválida',
        description: 'A carga horária deve ser maior que zero (ex: 60h, 80h).',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const limiteFinal = usarLimiteAuto
        ? limiteCalculadoAuto
        : Number(limitePersonalizado) || limiteCalculadoAuto

      if (isEdicao && materiaParaEditar) {
        await atualizarMateria(materiaParaEditar.id, {
          nome,
          codigo,
          professor,
          carga_horaria: chNum,
          limite_faltas: limiteFinal,
          horas_por_aula: hAulaNum,
          cor,
        })
        toast({
          title: 'Matéria atualizada!',
          description: `"${nome}" foi atualizada com sucesso.`,
        })
      } else {
        await criarMateria({
          nome,
          codigo,
          professor,
          carga_horaria: chNum,
          limite_faltas: limiteFinal,
          horas_por_aula: hAulaNum,
          cor,
        })
        toast({
          title: 'Matéria cadastrada!',
          description: `"${nome}" cadastrada com limite de ${limiteFinal}h de faltas (25%).`,
        })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao salvar matéria',
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
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${cor}25`, border: `1px solid ${cor}50` }}
            >
              <BookOpen className="w-4 h-4" style={{ color: cor }} />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-white">
              {isEdicao ? 'Editar Matéria' : 'Nova Matéria'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Cadastre o nome e a carga horária total para calcular o limite automático de 25% de
            faltas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs font-semibold text-zinc-300">
              Nome da matéria *
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Cálculo Diferencial I, Algoritmos..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-sm h-9"
              autoFocus
              required
            />
          </div>

          {/* Código e Professor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="codigo" className="text-xs text-zinc-300">
                Código / Turma
              </Label>
              <Input
                id="codigo"
                placeholder="Ex: MAT101"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="professor" className="text-xs text-zinc-300">
                Professor(a)
              </Label>
              <Input
                id="professor"
                placeholder="Ex: Profa. Mariana"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9"
              />
            </div>
          </div>

          {/* Carga Horária Total e Horas por Aula */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="carga" className="text-xs font-semibold text-zinc-300">
                  Carga horária total *
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="carga"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="60"
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(e.target.value)}
                  className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-sm h-9 pr-8"
                  required
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-500">h</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="horasAula" className="text-xs text-zinc-300">
                Horas por aula
              </Label>
              <div className="relative">
                <Input
                  id="horasAula"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="2"
                  value={horasPorAula}
                  onChange={(e) => setHorasPorAula(e.target.value)}
                  className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-sm h-9 pr-8"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-500">h</span>
              </div>
            </div>
          </div>

          {/* Badge Informativo do Limite Calculado de 25% */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                <span>Limite oficial calculado (25%):</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono text-[11px]">
                  {usarLimiteAuto
                    ? limiteCalculadoAuto
                    : Number(limitePersonalizado) || limiteCalculadoAuto}
                  h
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Equivale a aproximadamente{' '}
                <strong className="text-zinc-200">{maxFaltasAulas} dias de aula</strong> ({hAulaNum}
                h/aula). O alerta dispara quando faltar menos de 25% dessa margem (a partir de 75%
                consumido).
              </p>
            </div>
          </div>

          {/* Opção de ajuste manual do limite */}
          <div className="pt-1">
            {!usarLimiteAuto ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="limiteManual" className="text-xs text-zinc-300">
                    Limite personalizado de faltas (horas)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setUsarLimiteAuto(true)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Usar padrão 25%
                  </button>
                </div>
                <Input
                  id="limiteManual"
                  type="number"
                  min="0"
                  step="0.5"
                  value={limitePersonalizado}
                  onChange={(e) => setLimitePersonalizado(e.target.value)}
                  className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUsarLimiteAuto(false)
                  setLimitePersonalizado(String(limiteCalculadoAuto))
                }}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                A faculdade usa outro percentual? Clique para personalizar o limite.
              </button>
            )}
          </div>

          {/* Cor de Identificação */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Cor de destaque</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETA_CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition-transform duration-150 flex items-center justify-center ${
                    cor === c
                      ? 'scale-125 ring-2 ring-white/80 ring-offset-2 ring-offset-[#0f1424]'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
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
              {isSubmitting ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Matéria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
