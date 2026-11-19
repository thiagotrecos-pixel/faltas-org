import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ModalAula } from '@/components/ModalAula'
import { ModalMateria } from '@/components/ModalMateria'
import { Materia, Aula, MateriaStats } from '@/types'
import { listarMaterias } from '@/services/materias'
import { listarAulas } from '@/services/aulas'
import { calcularStatsMateria, PERCENTUAL_REPROVACAO_PADRAO } from '@/services/calculations'
import { useConfiguracaoAviso } from '@/hooks/use-configuracao-aviso'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  HelpCircle,
} from 'lucide-react'

export const AlertasPage: React.FC = () => {
  const { percentualAviso, faltasRestantesAviso } = useConfiguracaoAviso()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [modalAulaAberto, setModalAulaAberto] = useState(false)
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false)
  const [materiaPreSelecionadaAula, setMateriaPreSelecionadaAula] = useState<string | undefined>()

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

  const criticas = statsPorMateria.filter((s) => s.isEstourado)
  const emAlerta = statsPorMateria.filter((s) => s.isAlerta)
  const seguras = statsPorMateria.filter((s) => !s.isAlerta && !s.isEstourado)

  const handleLancarAula = (materiaId: string) => {
    setMateriaPreSelecionadaAula(materiaId)
    setModalAulaAberto(true)
  }

  const totalAlertas = criticas.length + emAlerta.length

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col">
      <Navbar onOpenNovaMateria={() => setModalMateriaAberto(true)} totalAlertas={totalAlertas} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b tech-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">
                Monitoramento Preventivo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
              <span>Central de Alertas de Faltas</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Notificações automáticas ao atingir {percentualAviso}% da cota limite
              {faltasRestantesAviso > 0
                ? ` ou quando restarem ${faltasRestantesAviso} faltável(is) para o limite`
                : ''}
              , ou em caso de risco de reprovação.
            </p>
          </div>
        </div>

        {/* Premissas explicadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-amber-200">
                Gatilho do Alerta: {percentualAviso}% da cota
                {faltasRestantesAviso > 0 ? ` OU ${faltasRestantesAviso} faltável(is)` : ''}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Quando você consome {percentualAviso}% da sua folga de faltas (ex:{' '}
                {Math.round(15 * (percentualAviso / 100) * 10) / 10}h de um limite de 15h)
                {faltasRestantesAviso > 0
                  ? `, ou quando restarem apenas ${faltasRestantesAviso} aula(s) faltáveis antes do limite`
                  : ''}
                , a matéria entra imediatamente nesta central para que você não perca a aprovação na
                reta final.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-indigo-200">
                Regra de Ouro: Máximo {PERCENTUAL_REPROVACAO_PADRAO}% de faltas
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Disciplinas com carga de 60h permitem no máximo 15h de ausência. Cargas de 80h
                permitem até 20h. Cada matéria pode ter um teto próprio (definido no cadastro);
                faltar além disso acarreta reprovação automática por frequência.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            Verificando situação das matérias...
          </div>
        ) : totalAlertas === 0 ? (
          <Card className="tech-card border border-emerald-500/30 rounded-2xl p-12 text-center shadow-xl shadow-emerald-950/10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-emerald-300">
              Tudo sob controle! Nenhum alerta ativo
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5">
              Todas as suas matérias estão com percentual de faltas bem abaixo do teto de{' '}
              {percentualAviso}%. Continue mantendo sua presença em dia.
            </p>
            <Link to="/aulas">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold px-5 h-9">
                Ver Checklist de Aulas
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 1. Matérias Estouradas (Críticas) */}
            {criticas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h2 className="text-base font-bold text-rose-300 uppercase tracking-wider">
                    Limite Ultrapassado ({criticas.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {criticas.map((item) => (
                    <Card
                      key={item.materia.id}
                      className="tech-card border-rose-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-[#180d14]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.materia.cor || '#ef4444' }}
                            />
                            <h3 className="font-bold text-base text-white">{item.materia.nome}</h3>
                            {item.materia.codigo && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {item.materia.codigo}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              REPROVADO POR FALTAS
                            </span>
                          </div>

                          <p className="text-xs text-rose-200/90 leading-relaxed pt-1">
                            Você acumulou <strong>{item.horasFaltas}h de faltas</strong> (
                            {item.totalFaltas} ausências), superando o teto máximo permitido de{' '}
                            <strong>{item.materia.limite_faltas}h</strong> (
                            {item.percentualReprovacao}% da carga de {item.materia.carga_horaria}h).
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleLancarAula(item.materia.id)}
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold h-8"
                          >
                            Corrigir/Lançar Aula
                          </Button>
                          <Link to={`/aulas?materia=${item.materia.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 text-zinc-300 hover:bg-white/5 rounded-xl text-xs h-8"
                            >
                              Ver Histórico
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs">
                        <span className="text-rose-300/80">
                          Percentual de faltas: {item.percentualFaltasCarga.toFixed(1)}%
                        </span>
                        <span className="font-mono font-bold text-rose-400">
                          {Math.round(item.percentualLimiteConsumido)}% do limite consumido
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Matérias em Alerta (>= percentual de aviso configurado) */}
            {emAlerta.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h2 className="text-base font-bold text-amber-300 uppercase tracking-wider">
                    Alerta Preventivo ({emAlerta.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {emAlerta.map((item) => (
                    <Card
                      key={item.materia.id}
                      className="tech-card border-amber-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-[#18150f]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.materia.cor || '#f59e0b' }}
                            />
                            <h3 className="font-bold text-base text-white">{item.materia.nome}</h3>
                            {item.materia.codigo && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {item.materia.codigo}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {Math.round(item.percentualLimiteConsumido)}% DO LIMITE
                            </span>
                          </div>

                          <p className="text-xs text-amber-200/90 leading-relaxed pt-1">
                            Você já tem <strong>{item.horasFaltas}h de faltas</strong>. Restam
                            apenas{' '}
                            <strong className="text-white underline">
                              {item.faltasRestantesHoras}h de folga (~{item.aulasRestantesPossiveis}{' '}
                              aula(s))
                            </strong>{' '}
                            antes de ultrapassar o limite de {item.materia.limite_faltas}h.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleLancarAula(item.materia.id)}
                            className="bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs h-8"
                          >
                            Marcar Presença
                          </Button>
                          <Link to={`/aulas?materia=${item.materia.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 text-zinc-300 hover:bg-white/5 rounded-xl text-xs h-8"
                            >
                              Ver Histórico
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Barra de progresso do limite */}
                      <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Consumo da cota:</span>
                          <span className="text-amber-300 font-bold">
                            {item.horasFaltas}h / {item.materia.limite_faltas}h
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{
                              width: `${Math.min(100, item.percentualLimiteConsumido)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matérias Regulares */}
        {seguras.length > 0 && (
          <div className="space-y-3 pt-4 border-t tech-border">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Matérias em Situação Regular ({seguras.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {seguras.map((s) => (
                <div
                  key={s.materia.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/50 border tech-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.materia.cor || '#10b981' }}
                    />
                    <div>
                      <p className="font-semibold text-zinc-200">{s.materia.nome}</p>
                      <p className="text-[11px] text-zinc-400">
                        {s.horasFaltas}h gastas de {s.materia.limite_faltas}h permitidas
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-emerald-400 text-xs font-semibold">
                    {Math.round(s.percentualLimiteConsumido)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modais */}
      <ModalAula
        isOpen={modalAulaAberto}
        onClose={() => setModalAulaAberto(false)}
        onSuccess={carregarDados}
        materias={materias}
        materiaPreSelecionadaId={materiaPreSelecionadaAula}
      />

      <ModalMateria
        isOpen={modalMateriaAberto}
        onClose={() => setModalMateriaAberto(false)}
        onSuccess={carregarDados}
      />
    </div>
  )
}
