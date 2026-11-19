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
import { criarMateria, atualizarMateria, imagemMateriaUrl } from '@/services/materias'
import { calcularLimiteFaltas } from '@/services/calculations'
import { Checkbox } from '@/components/ui/checkbox'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { PERCENTUAL_REPROVACAO_PADRAO } from '@/services/calculations'
import { useToast } from '@/hooks/use-toast'
import { usePeriodos } from '@/hooks/use-periodos'
import { SelecionadorImagemWeb } from '@/components/SelecionadorImagemWeb'
import { BookOpen, Sparkles, Clock, AlertCircle, ImagePlus, Globe, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

/** Tipos e limite de tamanho da imagem (5 MB), alinhados com a migration 0004. */
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024

export const ModalMateria: React.FC<ModalMateriaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  materiaParaEditar,
}) => {
  const { toast } = useToast()
  const { faltasRestantesAviso } = useConfiguracaoAviso()
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
  const [percentualAvisoEspecifico, setPercentualAvisoEspecifico] = useState(
    materiaParaEditar?.percentual_aviso ? String(materiaParaEditar.percentual_aviso) : '',
  )
  // Percentual de reprovação próprio (vazio = padrão do app, 25%)
  const [percentualReprovacao, setPercentualReprovacao] = useState(
    materiaParaEditar?.percentual_reprovacao ? String(materiaParaEditar.percentual_reprovacao) : '',
  )
  // Aviso por faltas restantes próprio (checkbox marcado = usar o padrão global)
  const [usarFaltasRestantesGlobal, setUsarFaltasRestantesGlobal] = useState(
    !materiaParaEditar?.faltas_restantes_aviso,
  )
  const [faltasRestantesProprias, setFaltasRestantesProprias] = useState(
    materiaParaEditar?.faltas_restantes_aviso
      ? String(materiaParaEditar.faltas_restantes_aviso)
      : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { periodos } = usePeriodos()
  const [periodoId, setPeriodoId] = useState(materiaParaEditar?.periodo_id || '')

  // Imagem da matéria
  const imagemAtualUrl = materiaParaEditar ? imagemMateriaUrl(materiaParaEditar) : null
  const [novoArquivoImagem, setNovoArquivoImagem] = useState<File | null>(null)
  const [previewImagem, setPreviewImagem] = useState<string | null>(null)
  const [removerImagem, setRemoverImagem] = useState(false)
  const [modoImagem, setModoImagem] = useState<'upload' | 'web'>('upload')

  // Atualiza estado se materiaParaEditar mudar
  React.useEffect(() => {
    // Reseta sempre o estado da imagem ao (re)abrir o modal
    setNovoArquivoImagem(null)
    setPreviewImagem(null)
    setRemoverImagem(false)
    setModoImagem('upload')
    setPeriodoId(materiaParaEditar?.periodo_id || '')
    if (materiaParaEditar) {
      setNome(materiaParaEditar.nome)
      setCodigo(materiaParaEditar.codigo || '')
      setProfessor(materiaParaEditar.professor || '')
      setCargaHoraria(String(materiaParaEditar.carga_horaria))
      setHorasPorAula(String(materiaParaEditar.horas_por_aula || 2))
      setCor(materiaParaEditar.cor || '#6366f1')
      const pctSalvo = materiaParaEditar.percentual_reprovacao || PERCENTUAL_REPROVACAO_PADRAO
      const limiteAutoSalvo = calcularLimiteFaltas(materiaParaEditar.carga_horaria, pctSalvo)
      // Modo automático quando o limite salvo corresponde ao cálculo pelo
      // percentual da matéria — assim mudar o percentual recalcula o limite.
      const auto = Math.abs((materiaParaEditar.limite_faltas || 0) - limiteAutoSalvo) < 0.05
      setUsarLimiteAuto(auto)
      setLimitePersonalizado(String(materiaParaEditar.limite_faltas))
      setPercentualAvisoEspecifico(
        materiaParaEditar.percentual_aviso ? String(materiaParaEditar.percentual_aviso) : '',
      )
      setPercentualReprovacao(
        materiaParaEditar.percentual_reprovacao
          ? String(materiaParaEditar.percentual_reprovacao)
          : '',
      )
      setUsarFaltasRestantesGlobal(!materiaParaEditar.faltas_restantes_aviso)
      setFaltasRestantesProprias(
        materiaParaEditar.faltas_restantes_aviso
          ? String(materiaParaEditar.faltas_restantes_aviso)
          : '',
      )
    } else {
      setNome('')
      setCodigo('')
      setProfessor('')
      setCargaHoraria('60')
      setHorasPorAula('2')
      setCor('#6366f1')
      setLimitePersonalizado('')
      setUsarLimiteAuto(true)
      setPercentualAvisoEspecifico('')
      setPercentualReprovacao('')
      setUsarFaltasRestantesGlobal(true)
      setFaltasRestantesProprias('')
    }
  }, [materiaParaEditar, isOpen])

  const chNum = Number(cargaHoraria) || 0
  const pctReprovacaoEfetivo =
    percentualReprovacao.trim() && Number(percentualReprovacao) > 0
      ? Number(percentualReprovacao)
      : PERCENTUAL_REPROVACAO_PADRAO
  const limiteCalculadoAuto = calcularLimiteFaltas(chNum, pctReprovacaoEfetivo)
  const hAulaNum = Number(horasPorAula) || 2
  const maxFaltasAulas =
    hAulaNum > 0
      ? Math.floor(
          (usarLimiteAuto
            ? limiteCalculadoAuto
            : Number(limitePersonalizado) || limiteCalculadoAuto) / hAulaNum,
        )
      : 0

  const escolherImagem = (arquivo: File | undefined) => {
    if (!arquivo) return
    if (!TIPOS_IMAGEM.includes(arquivo.type)) {
      toast({
        title: 'Formato de imagem não suportado',
        description: 'Use uma imagem nos formatos JPG, PNG, WebP ou GIF.',
        variant: 'destructive',
      })
      return
    }
    if (arquivo.size > TAMANHO_MAX_BYTES) {
      toast({
        title: 'Imagem muito grande',
        description: 'A imagem deve ter no máximo 5 MB. Escolha um arquivo menor.',
        variant: 'destructive',
      })
      return
    }
    setNovoArquivoImagem(arquivo)
    setRemoverImagem(false)
    // Libera o preview anterior para evitar vazamento de memória
    setPreviewImagem((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior)
      return URL.createObjectURL(arquivo)
    })
  }

  const limparImagemEscolhida = () => {
    if (previewImagem) URL.revokeObjectURL(previewImagem)
    setPreviewImagem(null)
    setNovoArquivoImagem(null)
    setRemoverImagem(false)
  }

  const removerImagemSalva = () => {
    limparImagemEscolhida()
    setRemoverImagem(true)
  }

  // Imagem escolhida na busca da web vira um File real e entra no fluxo do upload.
  const escolherImagemWeb = (arquivo: File) => {
    setNovoArquivoImagem(arquivo)
    setRemoverImagem(false)
    setPreviewImagem((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior)
      return URL.createObjectURL(arquivo)
    })
    setModoImagem('upload')
    toast({
      title: 'Imagem da web adicionada!',
      description: 'Salve a matéria para confirmar a nova foto.',
    })
  }

  // Preview: nova imagem escolhida > imagem salva > fallback
  const urlPreview = removerImagem ? null : previewImagem || imagemAtualUrl

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
          percentual_aviso: percentualAvisoEspecifico.trim()
            ? Number(percentualAvisoEspecifico)
            : null,
          percentual_reprovacao: percentualReprovacao.trim() ? Number(percentualReprovacao) : null,
          faltas_restantes_aviso: usarFaltasRestantesGlobal
            ? null
            : faltasRestantesProprias.trim()
              ? Number(faltasRestantesProprias)
              : null,
          imagem: novoArquivoImagem,
          remover_imagem: removerImagem,
          periodo_id: periodoId || null,
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
          percentual_aviso: percentualAvisoEspecifico.trim()
            ? Number(percentualAvisoEspecifico)
            : null,
          percentual_reprovacao: percentualReprovacao.trim() ? Number(percentualReprovacao) : null,
          faltas_restantes_aviso: usarFaltasRestantesGlobal
            ? null
            : faltasRestantesProprias.trim()
              ? Number(faltasRestantesProprias)
              : null,
          imagem: novoArquivoImagem,
          periodo_id: periodoId || null,
        })
        toast({
          title: 'Matéria cadastrada!',
          description: `"${nome}" cadastrada com limite de ${limiteFinal}h de faltas (${pctReprovacaoEfetivo}%).`,
        })
      }
      limparImagemEscolhida()
      setRemoverImagem(false)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao salvar matéria',
        description:
          (err as { message?: string })?.message ||
          'Não foi possível salvar a matéria (verifique a imagem). Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1424] border tech-border text-zinc-100 shadow-2xl max-h-[90vh] overflow-y-auto">
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
            Cadastre o nome e a carga horária total para calcular o limite automático de{' '}
            {PERCENTUAL_REPROVACAO_PADRAO}% de faltas.
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

          {/* Período letivo (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="periodo" className="text-xs text-zinc-300">
              Período
            </Label>
            <select
              id="periodo"
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="w-full bg-[#151a2e] border border-zinc-700/60 focus:border-indigo-500 rounded-md text-xs h-9 px-3 text-zinc-200 outline-none [&>option]:bg-[#151a2e]"
            >
              <option value="">Sem período</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Imagem da matéria */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Imagem da matéria</Label>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-20 h-20 rounded-xl shrink-0 overflow-hidden border tech-border flex items-center justify-center',
                  urlPreview
                    ? 'bg-[#0d1020]'
                    : 'bg-gradient-to-br from-indigo-500/25 to-cyan-500/15',
                )}
              >
                {urlPreview ? (
                  <img
                    src={urlPreview}
                    alt="Pré-visualização da imagem da matéria"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewImagem(null)}
                  />
                ) : (
                  <BookOpen className="w-7 h-7 text-indigo-300/90" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                {modoImagem === 'upload' ? (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <label
                        htmlFor="imagem-materia"
                        className="inline-flex items-center gap-1.5 cursor-pointer rounded-full bg-indigo-600/20 border border-indigo-500/40 px-3 h-8 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        {urlPreview ? 'Trocar imagem' : 'Escolher imagem'}
                        <input
                          id="imagem-materia"
                          type="file"
                          accept={TIPOS_IMAGEM.join(',')}
                          className="sr-only"
                          onChange={(e) => {
                            escolherImagem(e.target.files?.[0])
                            // Permite escolher o mesmo arquivo novamente depois
                            e.target.value = ''
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setModoImagem('web')}
                        className="inline-flex items-center gap-1.5 cursor-pointer rounded-full bg-cyan-600/15 border border-cyan-500/40 px-3 h-8 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-600/25 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Pesquisar na web
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      JPG, PNG, WebP ou GIF · máx. 5 MB. Sem imagem, a matéria usa o ícone padrão.
                    </p>
                  </>
                ) : (
                  <SelecionadorImagemWeb
                    onEscolher={escolherImagemWeb}
                    onVoltar={() => setModoImagem('upload')}
                  />
                )}
                {urlPreview && modoImagem === 'upload' && (
                  <button
                    type="button"
                    onClick={removerImagemSalva}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {novoArquivoImagem ? 'Descartar imagem escolhida' : 'Remover imagem'}
                  </button>
                )}
              </div>
            </div>
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
                <span>Limite oficial calculado ({pctReprovacaoEfetivo}%):</span>
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
                h/aula). O alerta preventivo dispara no percentual de aviso configurado (global ou
                específico desta matéria).
              </p>
            </div>
          </div>

          {/* Percentual de reprovação da matéria (opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="percentualReprovacao" className="text-xs text-zinc-300">
                Percentual de reprovação (% da carga)
              </Label>
              <button
                type="button"
                onClick={() => setPercentualReprovacao('')}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Usar padrão ({PERCENTUAL_REPROVACAO_PADRAO}%)
              </button>
            </div>
            <div className="relative">
              <Input
                id="percentualReprovacao"
                type="number"
                min="1"
                max="99"
                step="1"
                placeholder={`Vazio = padrão do app (${PERCENTUAL_REPROVACAO_PADRAO}%)`}
                value={percentualReprovacao}
                onChange={(e) => setPercentualReprovacao(e.target.value)}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8 pr-8"
              />
              <span className="absolute right-3 top-1.5 text-xs text-zinc-500">%</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Percentual da carga horária que, quando acumulado em faltas, reprova a matéria. Deixe
              em branco para manter o padrão de {PERCENTUAL_REPROVACAO_PADRAO}%.
            </p>
          </div>

          {/* Limite de aviso específico (opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="percentualAviso" className="text-xs text-zinc-300">
                Limite de aviso específico (% da cota)
              </Label>
              <button
                type="button"
                onClick={() => setPercentualAvisoEspecifico('')}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Usar global
              </button>
            </div>
            <div className="relative">
              <Input
                id="percentualAviso"
                type="number"
                min="1"
                max="99"
                step="1"
                placeholder="Vazio = usa o global (ex: 75)"
                value={percentualAvisoEspecifico}
                onChange={(e) => setPercentualAvisoEspecifico(e.target.value)}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8 pr-8"
              />
              <span className="absolute right-3 top-1.5 text-xs text-zinc-500">%</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Se preenchido, o alerta preventivo desta matéria dispara nesse percentual da cota de
              faltas, sem afetar as demais.
            </p>
          </div>

          {/* Aviso por faltas restantes próprio (opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="faltasRestantesProprias" className="text-xs text-zinc-300">
                Aviso por faltas restantes (aulas)
              </Label>
              <label className="inline-flex items-center gap-1.5 text-[11px] text-indigo-400 cursor-pointer select-none">
                <Checkbox
                  checked={usarFaltasRestantesGlobal}
                  onCheckedChange={(checked) => setUsarFaltasRestantesGlobal(checked === true)}
                />
                Usar padrão global
              </label>
            </div>
            <div className="relative">
              <Input
                id="faltasRestantesProprias"
                type="number"
                min="1"
                max="999"
                step="1"
                disabled={usarFaltasRestantesGlobal}
                placeholder={
                  usarFaltasRestantesGlobal
                    ? faltasRestantesAviso > 0
                      ? `Usando o global (${faltasRestantesAviso} aula(s))`
                      : 'Global desativado — só percentual'
                    : 'Ex.: 3'
                }
                value={usarFaltasRestantesGlobal ? '' : faltasRestantesProprias}
                onChange={(e) => setFaltasRestantesProprias(e.target.value.replace(/[^0-9]/g, ''))}
                className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-8 pr-8 disabled:opacity-60"
              />
              <span className="absolute right-3 top-1.5 text-xs text-zinc-500">aulas</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Avisa quando restar esse número de aulas para o limite de faltas desta matéria. Com
              "usar padrão global" marcado, vale o valor definido nas Configurações
              {faltasRestantesAviso > 0 ? ` (${faltasRestantesAviso} aula(s)).` : '.'}
            </p>
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
                    Usar padrão ({pctReprovacaoEfetivo}%)
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
