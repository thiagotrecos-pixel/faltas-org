migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    // Campo texto opcional com o nome da universidade do usuário
    if (!col.fields.getByName('universidade')) {
      col.fields.add(new TextField({ name: 'universidade', max: 120 }))
    }

    app.save(col)

    // Universidade de exemplo para o usuário demo (idempotente)
    const demoEmails = ['demo@universitario.com', 'thiagobs.exe@gmail.com']
    for (const email of demoEmails) {
      try {
        const rec = app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (rec.getString('universidade') === '') {
          rec.set('universidade', 'Universidade Demo')
          app.save(rec)
        }
      } catch (_) {
        // usuário demo não existe nesta cópia — nada a fazer
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (col.fields.getByName('universidade')) {
      col.fields.removeByName('universidade')
      app.save(col)
    }
  },
)
