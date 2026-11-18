migrate(
  (app) => {
    // 1. Campo opcional de limite de aviso específico por matéria
    const materias = app.findCollectionByNameOrId('materias')
    if (!materias.fields.getByName('percentual_aviso')) {
      materias.fields.add(
        new NumberField({
          name: 'percentual_aviso',
          min: 1,
          max: 99,
        }),
      )
    }
    app.save(materias)

    // 2. Coleção de configurações globais por usuário
    const collection = new Collection({
      name: 'configuracoes',
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
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'chave',
          type: 'select',
          required: true,
          values: ['aviso_preventivo'],
          maxSelect: 1,
        },
        {
          name: 'valor',
          type: 'number',
          required: true,
          min: 1,
          max: 99,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_configuracoes_user_chave ON configuracoes (user_id, chave)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('configuracoes')
      app.delete(collection)
    } catch (_) {}

    const materias = app.findCollectionByNameOrId('materias')
    try {
      const field = materias.fields.getByName('percentual_aviso')
      if (field) {
        materias.fields.removeByName('percentual_aviso')
        app.save(materias)
      }
    } catch (_) {}
  },
)
