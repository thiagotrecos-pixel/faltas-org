// 0008: coleção de avaliações (notas/pontuações) por matéria + override de aprovação
// por pontos na matéria (pontos_media, pontos_semestre) + dados demo.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const materias = app.findCollectionByNameOrId('materias')

    // Coleção de avaliações/provas por matéria, vinculada ao usuário dono
    let avaliacoes
    try {
      avaliacoes = app.findCollectionByNameOrId('avaliacoes')
    } catch (_) {
      avaliacoes = new Collection({
        name: 'avaliacoes',
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
          {
            name: 'materia_id',
            type: 'relation',
            required: true,
            collectionId: materias.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'nome', type: 'text', required: true },
          { name: 'valor_maximo', type: 'number', required: true },
          { name: 'nota_obtida', type: 'number' },
          { name: 'data', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_avaliacoes_materia ON avaliacoes (materia_id)'],
      })
      app.save(avaliacoes)
    }

    // Override de aprovação por pontos na própria matéria (vazio = usa o global)
    if (!materias.fields.getByName('pontos_media')) {
      materias.fields.add(new NumberField({ name: 'pontos_media' }))
      app.save(materias)
    }
    if (!materias.fields.getByName('pontos_semestre')) {
      materias.fields.add(new NumberField({ name: 'pontos_semestre' }))
      app.save(materias)
    }

    // Dados demo: três cenários (aprovado por pontos, em recuperação, abaixo da média)
    // para os usuários demo, aplicados às primeiras matérias de cada um.
    const emailsDemo = ['demo@universitario.com', 'thiagobs.exe@gmail.com']
    for (const email of emailsDemo) {
      let user
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        continue
      }

      const existentes = app.findRecordsByFilter('avaliacoes', `user_id = '${user.id}'`, '', 1, 0)
      if (existentes.length > 0) continue

      const mats = app.findRecordsByFilter('materias', `user_id = '${user.id}'`, 'created', 500, 0)
      const cenarios = [
        [
          { nome: 'P1', valor: 25, nota: 22 },
          { nome: 'P2', valor: 25, nota: 20 },
          { nome: 'Trabalho', valor: 20, nota: 18 },
        ],
        [
          { nome: 'P1', valor: 30, nota: 12 },
          { nome: 'P2', valor: 30, nota: 15 },
        ],
        [
          { nome: 'P1', valor: 50, nota: 20 },
          { nome: 'P2', valor: 50, nota: 25 },
        ],
      ]

      for (let i = 0; i < Math.min(mats.length, cenarios.length); i++) {
        const m = mats[i]
        for (const a of cenarios[i]) {
          const r = new Record(avaliacoes)
          r.set('user_id', user.id)
          r.set('materia_id', m.id)
          r.set('nome', a.nome)
          r.set('valor_maximo', a.valor)
          r.set('nota_obtida', a.nota)
          r.set('data', '')
          app.save(r)
        }
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('avaliacoes'))
    } catch (_) {}
    try {
      const materias = app.findCollectionByNameOrId('materias')
      let mudou = false
      if (materias.fields.getByName('pontos_media')) {
        materias.fields.removeByName('pontos_media')
        mudou = true
      }
      if (materias.fields.getByName('pontos_semestre')) {
        materias.fields.removeByName('pontos_semestre')
        mudou = true
      }
      if (mudou) app.save(materias)
    } catch (_) {}
  },
)
