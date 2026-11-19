// 0010: novas chaves de configuração global do sistema de pontos
// ("pontos_aprovacao" e "total_semestre"). O campo `chave` é um select:
// sem esses valores, criar a configuração do usuário falha.
migrate(
  (app) => {
    const config = app.findCollectionByNameOrId('configuracoes')

    let mudou = false
    const campoChave = config.fields.getByName('chave')
    const atuais = campoChave.values || []
    for (const nova of ['pontos_aprovacao', 'total_semestre']) {
      if (atuais.indexOf(nova) === -1) {
        atuais.push(nova)
        mudou = true
      }
    }
    if (mudou) {
      campoChave.values = atuais
      app.save(config)
    }
  },
  (app) => {
    // Down: remove as opções adicionadas (só remove quando nenhuma está em uso,
    // caso contrário o PocketBase recusa o save).
    try {
      const config = app.findCollectionByNameOrId('configuracoes')
      const campoChave = config.fields.getByName('chave')
      const filtradas = []
      const atuais = campoChave.values || []
      for (let i = 0; i < atuais.length; i++) {
        const v = atuais[i]
        if (v !== 'pontos_aprovacao' && v !== 'total_semestre') {
          filtradas.push(v)
        }
      }
      campoChave.values = filtradas
      app.save(config)
    } catch (_) {}
  },
)
