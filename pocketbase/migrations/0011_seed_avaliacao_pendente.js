// Seed idempotente de demonstração para "nota necessária nas próximas
// avaliações": garante EXATAMENTE UMA avaliação PENDENTE (bool nota_lancada
// = false) "P3" na matéria "Cálculo Diferencial e Integral I" do usuário demo.
// Com P1=22/25, P2=20/25 e Trabalho=18/20 lançados (60 pts... correção: 60 é
// a média — com 42 pts acumulados e média de aprovação 60, faltam 18 pts) —
// a pílula de pontos fica "Em andamento" e a linha "faltam 18 pts · precisa
// de 18 em 1" aparece no card da matéria.

migrate(
  (app) => {
    let materia
    try {
      materia = app.findFirstRecordByFilter('materias', "nome = 'Cálculo Diferencial e Integral I'")
    } catch (_) {
      return // matéria demo não existe — nada a fazer
    }

    // Remove duplicatas acidentais do seed (mantém a mais antiga).
    const p3s = app.findRecordsByFilter(
      'avaliacoes',
      `materia_id = "${materia.id}" && nome = 'P3'`,
      'created',
      200,
      0,
    )
    for (let i = 1; i < p3s.length; i++) {
      app.delete(p3s[i])
    }

    // Idempotente: já existe a pendente semeada — nada a fazer.
    if (p3s.length > 0) {
      return
    }

    const record = new Record(app.findCollectionByNameOrId('avaliacoes'))
    record.set('user_id', materia.getString('user_id'))
    record.set('materia_id', materia.id)
    record.set('nome', 'P3')
    record.set('valor_maximo', 25)
    // nota_lancada NÃO é setada: false (bool opcional) = avaliação pendente.
    app.save(record)
  },
  (app) => {
    try {
      const materia = app.findFirstRecordByFilter(
        'materias',
        "nome = 'Cálculo Diferencial e Integral I'",
      )
      const p3s = app.findRecordsByFilter(
        'avaliacoes',
        `materia_id = "${materia.id}" && nome = 'P3'`,
        'created',
        200,
        0,
      )
      for (const av of p3s) {
        app.delete(av)
      }
    } catch (_) {}
  },
)
