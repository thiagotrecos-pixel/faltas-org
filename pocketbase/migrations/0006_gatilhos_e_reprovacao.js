migrate(
  (app) => {
    // 1. Matérias: percentual de reprovação próprio (vazio = usa 25% global)
    //    e gatilho de aviso por faltas restantes (vazio = desativado / usa global).
    const materias = app.findCollectionByNameOrId('materias')
    if (!materias.fields.getByName('percentual_reprovacao')) {
      materias.fields.add(
        new NumberField({
          name: 'percentual_reprovacao',
          min: 1,
          max: 99,
          onlyInt: false,
        }),
      )
    }
    if (!materias.fields.getByName('faltas_restantes_aviso')) {
      materias.fields.add(
        new NumberField({
          name: 'faltas_restantes_aviso',
          min: 1,
          max: 10000,
          onlyInt: true,
        }),
      )
    }
    app.save(materias)

    // 2. Configurações: nova chave para o gatilho global de faltas restantes.
    //    O registro só existe quando o gatilho está ativo (valor >= 1);
    //    sem registro = desativado (só o aviso percentual dispara).
    const configuracoes = app.findCollectionByNameOrId('configuracoes')
    const chaveField = configuracoes.fields.getByName('chave')
    if (chaveField && !chaveField.values.includes('aviso_faltas_restantes')) {
      chaveField.values.push('aviso_faltas_restantes')
      app.save(configuracoes)
    }
  },
  (app) => {
    try {
      const materias = app.findCollectionByNameOrId('materias')
      if (materias.fields.getByName('percentual_reprovacao')) {
        materias.fields.removeByName('percentual_reprovacao')
      }
      if (materias.fields.getByName('faltas_restantes_aviso')) {
        materias.fields.removeByName('faltas_restantes_aviso')
      }
      app.save(materias)
    } catch (_) {}

    try {
      // Remove registros do gatilho global (o registro É a ativação do gatilho)
      const registros = app.findRecordsByFilter(
        'configuracoes',
        "chave = 'aviso_faltas_restantes'",
        '',
        1000,
        0,
      )
      for (const r of registros) app.delete(r)
    } catch (_) {}

    try {
      const configuracoes = app.findCollectionByNameOrId('configuracoes')
      const chaveField = configuracoes.fields.getByName('chave')
      if (chaveField) {
        chaveField.values = chaveField.values.filter((v) => v !== 'aviso_faltas_restantes')
        app.save(configuracoes)
      }
    } catch (_) {}
  },
)
