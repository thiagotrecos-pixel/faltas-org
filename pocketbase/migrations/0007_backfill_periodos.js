// Backfill idempotente: garante que todo usuário com matérias tenha períodos demo
// e que nenhuma matéria fique sem período por ter sido criada antes da migration 0005.
// No-op em banco vazio e em matérias que já têm período atribuído.
migrate(
  (app) => {
    const emails = ['thiago-bs@ufmg.br', 'demo@universitario.com', 'thiagobs.exe@gmail.com']
    for (const email of emails) {
      let user
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        continue
      }

      let periodos
      try {
        periodos = app.findCollectionByNameOrId('periodos')
      } catch (_) {
        throw new Error('coleção periodos não existe — aplique 0005 antes')
      }

      const porNome = {}
      for (const nome of ['2026/1', '2026/2']) {
        const existentes = app.findRecordsByFilter(
          'periodos',
          `user_id = '${user.id}' && nome = '${nome}'`,
          '',
          1,
          0,
        )
        if (existentes.length > 0) {
          porNome[nome] = existentes[0]
        } else {
          const p = new Record(periodos)
          p.set('user_id', user.id)
          p.set('nome', nome)
          app.save(p)
          porNome[nome] = p
        }
      }

      const mats = app.findRecordsByFilter('materias', `user_id = '${user.id}'`, '', 500, 0)
      for (const m of mats) {
        if (m.get('periodo_id')) continue
        const alvo = m.get('codigo') === 'MAT101' ? porNome['2026/1'] : porNome['2026/2']
        m.set('periodo_id', alvo.id)
        app.save(m)
      }
    }
  },
  (app) => {
    // down: no-op — 0005 é dona da estrutura; o backfill não cria nada que precise desfazer aqui.
  },
)
