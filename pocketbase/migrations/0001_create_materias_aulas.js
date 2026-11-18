migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const materias = new Collection({
      name: 'materias',
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
        { name: 'codigo', type: 'text' },
        { name: 'professor', type: 'text' },
        { name: 'carga_horaria', type: 'number', required: true, min: 1 },
        { name: 'limite_faltas', type: 'number', required: false, min: 0 },
        { name: 'horas_por_aula', type: 'number', min: 1 },
        { name: 'cor', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_materias_user_created ON materias (user_id, created DESC)'],
    })
    app.save(materias)

    const aulas = new Collection({
      name: 'aulas',
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
        { name: 'data', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['presenca', 'falta', 'prevista'],
          maxSelect: 1,
        },
        { name: 'conteudo', type: 'text' },
        { name: 'horas', type: 'number', min: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_aulas_user_materia_data ON aulas (user_id, materia_id, data DESC)',
      ],
    })
    app.save(aulas)
  },
  (app) => {
    try {
      const aulas = app.findCollectionByNameOrId('aulas')
      app.delete(aulas)
    } catch (_) {}
    try {
      const materias = app.findCollectionByNameOrId('materias')
      app.delete(materias)
    } catch (_) {}
  },
)
