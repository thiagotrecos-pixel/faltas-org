/**
 * Rotas de busca de imagens na web para a foto da matéria.
 *
 * GET /backend/v1/imagens/busca?q=<termo>&pagina=1
 *   Busca no Wikimedia Commons (API pública, sem chave) e devolve miniaturas.
 *
 * GET /backend/v1/imagens/baixar?url=<url>  [só superusuário]
 *   Proxy de download: devolve os bytes da imagem para o cliente salvar
 *   como arquivo no campo "imagem" da matéria (sem hotlink externo).
 *
 * Nenhuma chamada sai direto do navegador: toda requisição externa passa
 * por aqui via $http.send, evitando CORS e escondendo a origem.
 */

routerAdd(
  'GET',
  '/backend/v1/imagens/busca',
  (e) => {
    const RESULTADOS_POR_PAGINA = 24
    const IMAGENS_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    const termo = (e.request.url().query().get('q') || '').trim()
    if (termo.length < 2) {
      throw new BadRequestError('Informe um termo de busca com pelo menos 2 caracteres.')
    }
    let pagina = parseInt(e.request.url().query().get('pagina') || '1', 10)
    if (!pagina || pagina < 1 || pagina > 10) pagina = 1

    const params = {
      action: 'query',
      format: 'json',
      formatversion: 2,
      generator: 'search',
      gsrsearch: 'filetype:bitmap ' + termo,
      gsrnamespace: 6,
      gsrlimit: RESULTADOS_POR_PAGINA,
      gsroffset: (pagina - 1) * RESULTADOS_POR_PAGINA,
      prop: 'imageinfo',
      iiprop: 'url|size|mime',
      iiurlwidth: 320,
      origin: '*',
    }

    const pares = []
    for (const chave in params) {
      pares.push(encodeURIComponent(chave) + '=' + encodeURIComponent(params[chave]))
    }

    let res
    try {
      res = $http.send({
        url: 'https://commons.wikimedia.org/w/api.php?' + pares.join('&'),
        method: 'GET',
        timeout: 20,
        headers: {
          'User-Agent': 'Falta.org/1.0 (app de controle de faltas; busca de imagens)',
          Accept: 'application/json',
        },
      })
    } catch (err) {
      console.log('imagens/busca: falha de rede ao consultar o Wikimedia Commons: ' + err)
      throw new BadRequestError('A busca de imagens falhou. Tente novamente em instantes.')
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log('imagens/busca: Commons respondeu HTTP ' + res.statusCode)
      throw new BadRequestError('A busca de imagens falhou. Tente novamente em instantes.')
    }

    const dados = res.json || {}
    const paginas = (dados.query && dados.query.pages) || []
    const resultados = []

    for (const pag of paginas) {
      const info = pag.imageinfo && pag.imageinfo[0]
      if (!info) continue
      if (IMAGENS_MIME.indexOf(info.mime) === -1) continue
      const largura = info.width || 0
      const altura = info.height || 0
      if (largura < 200 || altura < 150) continue
      resultados.push({
        id: String(pag.pageid),
        titulo: String(pag.title || '').replace(/^File:/, ''),
        url: info.url,
        thumb: info.thumburl || info.url,
        width: largura,
        height: altura,
        mime: info.mime,
        origem: 'Wikimedia Commons',
        pagina_descritiva: info.descriptionurl || '',
      })
    }

    const total =
      dados.query && typeof dados.query.totalhits === 'number'
        ? dados.query.totalhits
        : resultados.length

    return e.json(200, { termo, pagina, total, resultados })
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/imagens/baixar',
  (e) => {
    const IMAGENS_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const TAMANHO_MAX_BYTES = 5 * 1024 * 1024

    const url = (e.request.url().query().get('url') || '').trim()
    if (!url) {
      throw new BadRequestError('URL da imagem ausente.')
    }
    if (url.indexOf('https://') !== 0 || url.indexOf('upload.wikimedia.org') === -1) {
      throw new BadRequestError('A imagem precisa virar do upload.wikimedia.org.')
    }

    let res
    try {
      res = $http.send({
        url: url,
        method: 'GET',
        timeout: 30,
        headers: {
          'User-Agent': 'Falta.org/1.0 (app de controle de faltas; busca de imagens)',
        },
      })
    } catch (err) {
      console.log('imagens/baixar: falha de rede: ' + err)
      throw new BadRequestError('Não foi possível baixar a imagem. Tente outra.')
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new BadRequestError('Não foi possível baixar a imagem (HTTP ' + res.statusCode + ').')
    }

    const cabecalhos = res.headers || {}
    const valoresTipo = cabecalhos['Content-Type'] || cabecalhos['content-type'] || []
    const contentType = String(valoresTipo[0] || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    if (IMAGENS_MIME.indexOf(contentType) === -1) {
      throw new BadRequestError('A URL não aponta para uma imagem JPG, PNG, WebP ou GIF.')
    }
    if (res.body && res.body.length > TAMANHO_MAX_BYTES) {
      throw new BadRequestError('A imagem escolhida passa de 5 MB. Escolha outra imagem.')
    }

    return e.blob(200, contentType || 'image/jpeg', res.body)
  },
  $apis.requireSuperuserAuth(),
)

// Rota de diagnóstico (só superusuário).
routerAdd(
  'GET',
  '/backend/v1/imagens/ping',
  (e) => {
    return e.json(200, { ok: true, servico: 'imagens-web' })
  },
  $apis.requireSuperuserAuth(),
)
