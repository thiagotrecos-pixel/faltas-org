import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  ImageIcon,
} from 'lucide-react'
import { buscarImagensWeb, baixarImagemWebComoArquivo, ImagemWeb } from '@/services/imagensWeb'
import { cn } from '@/lib/utils'

interface SelecionadorImagemWebProps {
  /** Chamada quando o usuário confirma uma imagem da grade. */
  onEscolher: (arquivo: File) => void
  /** Fecha a busca e volta para o seletor de arquivo (upload). */
  onVoltar: () => void
}

/**
 * Pesquisa de imagens na web (Wikimedia Commons via backend) para escolher
 * a foto da matéria. A escolha devolve um File real, que entra no mesmo
 * fluxo do upload de arquivo.
 */
export const SelecionadorImagemWeb: React.FC<SelecionadorImagemWebProps> = ({
  onEscolher,
  onVoltar,
}) => {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<ImagemWeb[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [baixando, setBaixando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [buscou, setBuscou] = useState(false)
  const cancelado = useRef(false)

  useEffect(() => {
    return () => {
      cancelado.current = true
    }
  }, [])

  const executarBusca = async (novaPagina: number) => {
    const termoLimpo = termo.trim()
    if (termoLimpo.length < 2) {
      setErro('Digite um termo com pelo menos 2 caracteres.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const r = await buscarImagensWeb(termoLimpo, novaPagina)
      if (cancelado.current) return
      setResultados(r.resultados)
      setTotal(r.total)
      setPagina(novaPagina)
      setBuscou(true)
      if (r.resultados.length === 0) {
        setErro(
          r.total > 0
            ? 'Nada nesta página — tente voltar ou refinar o termo.'
            : 'Nenhuma imagem encontrada para esse termo. Tente outra palavra.',
        )
      }
    } catch (err) {
      if (cancelado.current) return
      setResultados([])
      setTotal(0)
      setBuscou(true)
      setErro(
        err instanceof Error
          ? err.message
          : 'A busca de imagens falhou. Tente novamente em instantes.',
      )
    } finally {
      if (!cancelado.current) setCarregando(false)
    }
  }

  const escolher = async (img: ImagemWeb) => {
    setBaixando(img.id)
    setErro(null)
    try {
      const arquivo = await baixarImagemWebComoArquivo(img)
      onEscolher(arquivo)
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Não foi possível usar esta imagem. Tente outra.',
      )
    } finally {
      setBaixando(null)
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / 24))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                executarBusca(1)
              }
            }}
            placeholder="Ex: cálculo, biologia, física..."
            className="pl-9 bg-[#151a2e] border-zinc-700/60 focus:border-indigo-500 text-xs h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => executarBusca(1)}
          disabled={carregando || termo.trim().length < 2}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold h-9 px-4"
        >
          {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onVoltar}
          disabled={carregando}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-full text-xs h-9"
        >
          Voltar
        </Button>
      </div>

      {erro && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {carregando && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {!carregando && resultados.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {resultados.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => escolher(img)}
                disabled={baixando !== null}
                title={img.titulo}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border transition-all group',
                  baixando === img.id
                    ? 'border-indigo-400 ring-2 ring-indigo-400/50'
                    : 'border-zinc-700/60 hover:border-indigo-400/70',
                  baixando !== null && baixando !== img.id && 'opacity-50',
                )}
              >
                <img
                  src={img.thumb}
                  alt={img.titulo}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[10px] text-white line-clamp-2 text-left">
                    {img.titulo}
                  </span>
                </span>
                {baixando === img.id && (
                  <span className="absolute inset-0 flex items-center justify-center bg-indigo-950/60">
                    <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
                  </span>
                )}
                {baixando === img.id && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => executarBusca(pagina - 1)}
                disabled={pagina <= 1 || carregando}
                className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] text-zinc-500">
                Página {pagina} de {Math.min(totalPaginas, 10)}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => executarBusca(pagina + 1)}
                disabled={pagina >= totalPaginas || pagina >= 10 || carregando}
                className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {!carregando && !buscou && !erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span>
            Digite um termo (o nome da matéria ou tema) e escolha uma das imagens encontradas.
          </span>
        </div>
      )}
    </div>
  )
}
