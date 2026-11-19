// Seed idempotente: avaliação P3 PENDENTE (nota_lancada = false) na matéria
// "Algoritmos e Programação" do usuário demo. Com P1=20/50 e P2=25/50
// lançados (45 pts) e média de aprovação 60, faltam 15 pts — o card mostra
// "faltam 15 pts · precisa de 15 em 1" (estado "Em andamento").

migrate(
  (app) => {
    let materia
    try {
      materia = app.findFirstRecordByFilter('materias', "nome = 'Algoritmos e Programação'")
    } catch (_) {
      return // matéria demo não existe — nada a fazer
    }

    // Idempotente: já existe a pendente semeada — nada a fazer.
    try {
      app.findFirstRecordByFilter(
        'avaliacoes',
        `materia_id = "${materia.id}" && nome = 'P3' && nota_lancada = false`,
      )
      return
    } catch (_) {}

    const record = new Record(app.findCollectionByNameOrId('avaliacoes'))
    record.set('user_id', materia.getString('user_id'))
    record.set('materia_id', materia.id)
    record.set('nome', 'P3')
    record.set('valor_maximo', 50)
    // nota_lancada NÃO é setada: false (bool opcional) = avaliação pendente.
    app.save(record)
  },
  (app) => {
    try {
      const materia = app.findFirstRecordByFilter('materias', "nome = 'Algoritmos e Programação'")
      const av = app.findFirstRecordByFilter(
        'avaliacoes',
        `materia_id = "${materia.id}" && nome = 'P3' && nota_lancada = false`,
      )
      app.delete(av)
    } catch (_) {}
  },
)
