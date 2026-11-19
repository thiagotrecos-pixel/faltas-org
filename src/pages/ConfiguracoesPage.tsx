import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { ModalMateria } from '@/components/ModalMateria'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { PERCENTUAL_AVISO_PADRAO } from '@/services/configuracoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Settings2, BellRing, CheckCircle2, Save, Timer, Info } from 'lucide-react'

export const ConfiguracoesPage: React.FC = () => {
  const { toast } = useToast()
  const {
    percentualAviso,
    faltasRestantesAviso,
    isLoading,
    salvar,
    salvarFaltasRestantes,
    isSalvando,
  } = useConfiguracaoAviso()
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)

  const [valorLocal, setValorLocal] = useState<number>(percentualAviso)
  // '' = campo vazio (gatilho por faltas restantes desativado)
  const [faltasRestantesLocal, setFaltasRestantesLocal] = useState<string>(
    faltasRestantesAviso > 0 ? String(faltasRestantesAviso) : '',
  )

  // Sincroniza quando a configuração carrega ou muda em tempo real
  useEffect(() => {
    setValorLocal(percentualAviso)
  }, [percentualAviso])

  useEffect(() => {
    setFaltasRestantesLocal(faltasRestantesAviso > 0 ? String(faltasRestantesAviso) : '')
  }, [faltasRestantesAviso])

  const valorDivergente = valorLocal !== percentualAviso

  const faltasRestantesNormalizado = faltasRestantesLocal.trim()
    ? Math.max(1, Math.min(999, Math.round(Number(faltasRestantesLocal))))
    : 0
  const faltasDivergente = faltasRestantesNormalizado !== faltasRestantesAviso
  const algumDivergente = valorDivergente || faltasDivergente

  const salvarValor = async () => {
    const novo = Math.min(
      99,
      Math.max(1, Math.round(Number(valorLocal) || PERCENTUAL_AVISO_PADRAO)),
    )
    try {
      await salvar(novo)
      await salvarFaltasRestantes(
        faltasRestantesNormalizado > 0 ? faltasRestantesNormalizado : null,
      )
      toast({
        title: 'Configurações salvas!',
        description:
          faltasRestantesNormalizado > 0
            ? `Alertas disparam ao atingir ${novo}% da cota OU quando faltar(m) ${faltasRestantesNormalizado} aula(s) para o limite.`
            : `Os alertas preventivos agora disparam ao atingir ${novo}% da cota de faltas.`,
      })
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao salvar configuração',
        description: (err as { message?: string })?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={() => setModalMateriaAberto(true)} totalAlertas={0} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="pb-2 border-b tech-border">
          <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold">
            Personalização
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Settings2 className="w-7 h-7 text-indigo-400" />
            <span>Configurações</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Ajuste quando os alertas de faltas devem disparar. Válido para todas as matérias que não
            tenham um limite específico.
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs">Carregando configurações...</p>
          </div>
        ) : (
          <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BellRing className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-white">Gatilhos de aviso</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O aviso dispara quando uma matéria atinge <strong>qualquer um</strong> dos
                    gatilhos abaixo — o que ocorrer primeiro.
                  </p>
                </div>
              </div>

              {/* Gatilho 1: percentual */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/40 border tech-border">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="percentual" className="text-xs font-semibold text-zinc-300">
                    1. Percentual da cota de faltas
                  </Label>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono text-sm font-bold">
                    {valorLocal}%
                  </span>
                </div>

                <Slider
                  id="percentual"
                  value={[valorLocal]}
                  min={10}
                  max={95}
                  step={1}
                  onValueChange={(vals: number[]) => setValorLocal(vals[0])}
                  className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-cyan-500 [&_[data-slot=slider-range]]:to-indigo-500"
                />

                <div className="flex items-center gap-2">
                  <Input
                    id="percentual-input"
                    type="number"
                    min={1}
                    max={99}
                    value={valorLocal}
                    onChange={(e) => setValorLocal(Number(e.target.value))}
                    className="bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-sm h-9 w-24 font-mono"
                  />
                  <span className="text-xs text-zinc-500">% da cota de faltas</span>
                  {valorLocal !== PERCENTUAL_AVISO_PADRAO && (
                    <button
                      type="button"
                      onClick={() => setValorLocal(PERCENTUAL_AVISO_PADRAO)}
                      className="text-[11px] text-indigo-400 hover:underline ml-auto"
                    >
                      Restaurar padrão ({PERCENTUAL_AVISO_PADRAO}%)
                    </button>
                  )}
                </div>

                {/* Exemplo didático */}
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-indigo-300">Exemplo:</strong> em uma matéria de 60h, a
                  cota é de 15h de faltas. Com {valorLocal}% configurado, o alerta dispara ao
                  acumular{' '}
                  <strong className="text-zinc-200">
                    {Math.round(15 * (valorLocal / 100) * 10) / 10}h
                  </strong>{' '}
                  de faltas.
                </div>
              </div>

              {/* Gatilho 2: faltas restantes */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/40 border tech-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="faltas-restantes"
                      className="text-xs font-semibold text-zinc-300"
                    >
                      2. Faltas restantes para o limite
                    </Label>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Opcional. Avisa quando restar esse número de aulas (faltáveis) para o limite
                      da matéria — mesmo que o percentual ainda não tenha sido atingido.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="faltas-restantes"
                    type="number"
                    min={1}
                    max={999}
                    placeholder="Ex.: 3"
                    value={faltasRestantesLocal}
                    onChange={(e) => setFaltasRestantesLocal(e.target.value.replace(/[^0-9]/g, ''))}
                    className="bg-[#151a2e] border-zinc-700/60 focus:border-cyan-500 text-sm h-9 w-24 font-mono placeholder:text-zinc-600"
                  />
                  <span className="text-xs text-zinc-500">aula(s) restante(s) para o limite</span>
                  {faltasRestantesAviso > 0 && faltasRestantesLocal !== '' && (
                    <button
                      type="button"
                      onClick={() => setFaltasRestantesLocal('')}
                      className="text-[11px] text-cyan-400 hover:underline ml-auto"
                    >
                      Limpar (só percentual)
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-zinc-400 leading-relaxed flex gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  {faltasRestantesLocal.trim() ? (
                    <span>
                      <strong className="text-cyan-300">Exemplo:</strong> com{' '}
                      <strong className="text-zinc-200">{faltasRestantesLocal}</strong> configurado,
                      uma matéria de 60h (cota de 15h ≈ 7 aulas de 2h) recebe alerta quando ainda
                      puder faltar no máximo{' '}
                      <strong className="text-zinc-200">
                        {Math.max(
                          0,
                          Math.floor(15 / 2) - Math.round(Number(faltasRestantesLocal) || 0),
                        )}{' '}
                        aula(s)
                      </strong>{' '}
                      antes de estourar.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-cyan-300">Dica:</strong> deixe em branco para usar
                      apenas o gatilho por percentual. Preenchido, o aviso dispara no gatilho que
                      ocorrer primeiro.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  {algumDivergente ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Alteração pendente
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Salvo — alertas já usando estes valores
                    </>
                  )}
                </div>
                <Button
                  onClick={salvarValor}
                  disabled={isSalvando || !algumDivergente}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-5 shadow-md shadow-indigo-600/30 gap-1.5"
                >
                  {isSalvando ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSalvando ? 'Salvando...' : 'Salvar'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dica sobre limite por matéria */}
        <div className="p-4 rounded-2xl bg-[#0f1424] border tech-border flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
            <Settings2 className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-zinc-200">Regras diferentes para uma matéria?</h4>
            <p className="text-zinc-400 text-[12px] leading-relaxed">
              Cada matéria pode ter percentual de reprovação e aviso por faltas restantes próprios —
              edite a matéria para configurar. Matérias sem valores próprios usam os padrões
              definidos aqui.
            </p>
          </div>
        </div>
      </main>

      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}

export default ConfiguracoesPage
