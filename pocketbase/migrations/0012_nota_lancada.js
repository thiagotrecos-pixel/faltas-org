// Campo bool nota_lancada em avaliacoes: marca explicitamente se a nota já
// foi lançada. Necessário porque campos number do PocketBase NUNCA armazenam
// null — nota_obtida vazia chega como 0, o que é uma nota válida (prova sem
// pontos). Backfill: nota_obtida > 0 => nota_lancada = true; registros com
// nota_obtida = 0 viram pendentes (eram gravados como 0 por engano).
// Idempotente: pula se o campo já existir.

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes')
    if (col.fields.getByName('nota_lancada')) {
      return
    }
    col.fields.add(new BoolField({ name: 'nota_lancada' }))
    app.save(col)

    // Backfill: tudo que tinha uma nota (> 0) conta como lançada.
    app.db().newQuery('UPDATE avaliacoes SET nota_lancada = 1 WHERE nota_obtida > 0').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes')
    if (col.fields.getByName('nota_lancada')) {
      col.fields.removeByName('nota_lancada')
      app.save(col)
    }
  },
)
