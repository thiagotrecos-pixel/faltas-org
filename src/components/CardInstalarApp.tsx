import React from 'react'
import { Download, Smartphone, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useInstalacaoPWA } from '@/hooks/use-instalacao-pwa'

/**
 * Card "Instalar o aplicativo" na página de Configurações.
 *
 * - Com beforeinstallprompt disponível: botão dispara o prompt nativo.
 * - App já instalado (standalone): estado amigável de confirmação.
 * - Navegador sem suporte: instruções manuais (Android/Chrome e iPhone).
 *
 * Não é um APK da Play Store — é o próprio site instalado como PWA.
 */
export const CardInstalarApp: React.FC = () => {
  const { estado, instalar } = useInstalacaoPWA()
  const [instalando, setInstalando] = React.useState(false)

  const aoInstalar = async () => {
    setInstalando(true)
    try {
      await instalar()
    } finally {
      setInstalando(false)
    }
  }

  return (
    <Card className="tech-card border tech-border rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-bold text-white">Instalar o aplicativo</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instale o Falta.org no seu celular ou computador para abrir em tela cheia, sem a barra
              do navegador, como um app nativo.
            </p>
          </div>
        </div>

        {estado === 'instalado' ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300">App instalado!</strong> O Falta.org já está
              funcionando como aplicativo neste dispositivo.
            </span>
          </div>
        ) : (
          <>
            {estado === 'disponivel' && (
              <Button
                onClick={aoInstalar}
                disabled={instalando}
                className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-md shadow-indigo-600/30 gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{instalando ? 'Preparando...' : 'Instalar aplicativo'}</span>
              </Button>
            )}

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-zinc-400 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <strong className="text-indigo-300 text-[11px]">Como instalar manualmente</strong>
              </div>
              <p>
                <strong className="text-zinc-200">Android (Chrome):</strong> toque no menu{' '}
                <strong className="text-zinc-200">⋮</strong> e escolha{' '}
                <strong className="text-zinc-200">"Instalar aplicativo"</strong> ou{' '}
                <strong className="text-zinc-200">"Adicionar à tela inicial"</strong>.
              </p>
              <p>
                <strong className="text-zinc-200">iPhone (Safari):</strong> toque em{' '}
                <strong className="text-zinc-200">Compartilhar</strong> e depois em{' '}
                <strong className="text-zinc-200">"Adicionar à Tela de Início"</strong>.
              </p>
              <p>
                <strong className="text-zinc-200">Computador:</strong> no Chrome ou Edge, clique no
                ícone de instalação na barra de endereço ou no menu ⋮ →{' '}
                <strong className="text-zinc-200">"Instalar Falta.org"</strong>.
              </p>
              <p className="text-zinc-500 pt-1 border-t border-white/5">
                Não é um APK da Play Store: o app abre em tela cheia, como nativo, direto pelo
                navegador. Não ocupa espaço extra e sempre fica na versão mais atual.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
