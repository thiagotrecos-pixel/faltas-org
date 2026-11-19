migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Coleção de períodos letivos (ex.: "2026/1", "2026/2"), vinculada ao usuário
    let periodos
    try {
      periodos = app.findCollectionByNameOrId('periodos')
    } catch (_) {
      periodos = new Collection({
        name: 'periodos',
        type: 'base',
        listRule: "@request.auth.id != '' && user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.body.user_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: users.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'nome', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_periodos_user_nome ON periodos (user_id, nome)'],
      })
      app.save(periodos)
    }

    // Vínculo opcional da matéria com um período (vazio = sem período)
    const materias = app.findCollectionByNameOrId('materias')
    if (!materias.fields.getByName('periodo_id')) {
      materias.fields.add(
        new RelationField({
          name: 'periodo_id',
          collectionId: periodos.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(materias)
    }

    // Dados demo: cria os períodos 2026/1 e 2026/2 e distribui as matérias demo existentes.
    // Idempotente: só cria períodos ausentes e só mexe em matérias ainda sem período.
    const emailsDemo = ['demo@universitario.com', 'thiagobs.exe@gmail.com']
    for (const email of emailsDemo) {
      let user
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        continue
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
    try {
      const materias = app.findCollectionByNameOrId('materias')
      if (materias.fields.getByName('periodo_id')) {
        materias.fields.removeByName('periodo_id')
        app.save(materias)
      }
    } catch (_) {}
    try {
      const periodos = app.findCollectionByNameOrId('periodos')
      app.delete(periodos)
    } catch (_) {}
  },
)
