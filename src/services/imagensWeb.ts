import pb from '@/lib/pocketbase/client'

export interface ImagemWeb {
  id: string
  titulo: string
  url: string
  thumb: string
  width: number
  height: number
  mime: string
  origem: string
  pagina_descritiva?: string
}

export interface ResultadoBuscaImagens {
  total: number
  resultados: ImagemWeb[]
}

/**
 * Busca imagens na web via hook no backend (/backend/v1/imagens/busca),
 * que consulta o Wikimedia Commons — nenhuma chamada sai direto do navegador,
 * sem expor CORS nem chaves.
 */
export async function buscarImagensWeb(termo: string, pagina = 1): Promise<ResultadoBuscaImagens> {
  const clean = termo.trim()
  if (clean.length < 2) {
    throw new Error('Digite um termo com pelo menos 2 caracteres.')
  }
  const url =
    `${pb.baseUrl}/backend/v1/imagens/busca?q=${encodeURIComponent(clean)}` +
    `&pagina=${encodeURIComponent(String(pagina))}`
  const res = await fetch(url, {
    headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
  })
  if (!res.ok) {
    let mensagem = 'A busca de imagens falhou. Tente novamente.'
    try {
      const corpo = await res.json()
      if (corpo && typeof corpo.message === 'string' && corpo.message) mensagem = corpo.message
    } catch {
      // corpo não-JSON: mantém a mensagem padrão
    }
    throw new Error(mensagem)
  }
  const dados = (await res.json()) as ResultadoBuscaImagens
  return { total: dados.total || 0, resultados: dados.resultados || [] }
}

/**
 * Baixa a imagem escolhida como um File real, passando pelo proxy do backend
 * (/backend/v1/imagens/baixar) — a imagem vira arquivo no campo "imagem",
 * sem hotlink externo.
 */
export async function baixarImagemWebComoArquivo(img: ImagemWeb): Promise<File> {
  const url = `${pb.baseUrl}/backend/v1/imagens/baixar?url=${encodeURIComponent(img.url)}`
  const res = await fetch(url, {
    headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
  })
  if (!res.ok) {
    let mensagem = 'Não foi possível baixar a imagem. Tente outra.'
    try {
      const corpo = await res.json()
      if (corpo && typeof corpo.message === 'string' && corpo.message) mensagem = corpo.message
    } catch {
      // corpo não-JSON: mantém a mensagem padrão
    }
    throw new Error(mensagem)
  }
  const blob = await res.blob()
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('A imagem escolhida passa de 5 MB. Escolha outra.')
  }
  const tipo = img.mime || blob.type || 'image/jpeg'
  const extensao = (tipo.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const nome = `materia-web-${Date.now()}.${extensao}`
  return new File([blob], nome, { type: tipo })
}
