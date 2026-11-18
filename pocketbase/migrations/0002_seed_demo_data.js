migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const materias = app.findCollectionByNameOrId('materias')
    const aulas = app.findCollectionByNameOrId('aulas')

    let demoUser
    try {
      demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@universitario.com')
    } catch (_) {
      demoUser = new Record(users)
      demoUser.setEmail('demo@universitario.com')
      demoUser.setPassword('Skip@Pass123')
      demoUser.setVerified(true)
      demoUser.set('name', 'Universitário Demo')
      app.save(demoUser)
    }

    // Also seed/ensure the user from instruction thiagobs.exe@gmail.com
    let thiagoUser
    try {
      thiagoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'thiagobs.exe@gmail.com')
    } catch (_) {
      thiagoUser = new Record(users)
      thiagoUser.setEmail('thiagobs.exe@gmail.com')
      thiagoUser.setPassword('Skip@Pass123')
      thiagoUser.setVerified(true)
      thiagoUser.set('name', 'Thiago Silva')
      app.save(thiagoUser)
    }

    const seedForUser = (userId) => {
      // Check if materias already exist for this user
      const existing = app.findRecordsByFilter('materias', `user_id = '${userId}'`, '', 1, 0)
      if (existing.length > 0) {
        return
      }

      // 1. Cálculo I (60h, limite 15h, 2h por aula -> limite 7 ou 8 aulas ou 15h)
      // 60h: 25% = 15h. Aulas de 2h = total 30 aulas, limite de 7 faltas de 2h (ou 15h de faltas).
      const mat1 = new Record(materias)
      mat1.set('user_id', userId)
      mat1.set('nome', 'Cálculo Diferencial e Integral I')
      mat1.set('codigo', 'MAT101')
      mat1.set('professor', 'Prof. Dr. Ricardo Santos')
      mat1.set('carga_horaria', 60)
      mat1.set('limite_faltas', 15)
      mat1.set('horas_por_aula', 2)
      mat1.set('cor', '#6366f1') // Indigo tech
      app.save(mat1)

      // 2. Algoritmos e Estruturas de Dados (80h, limite 20h)
      // Let's set it in alert state: 16h de faltas (80% do limite de 20h!) -> >= 75% alerta
      const mat2 = new Record(materias)
      mat2.set('user_id', userId)
      mat2.set('nome', 'Algoritmos e Programação')
      mat2.set('codigo', 'CC202')
      mat2.set('professor', 'Profa. Dra. Mariana Lima')
      mat2.set('carga_horaria', 80)
      mat2.set('limite_faltas', 20)
      mat2.set('horas_por_aula', 2)
      mat2.set('cor', '#ec4899') // Pink neon
      app.save(mat2)

      // 3. Sistemas Operacionais (60h, limite 15h)
      const mat3 = new Record(materias)
      mat3.set('user_id', userId)
      mat3.set('nome', 'Sistemas Operacionais')
      mat3.set('codigo', 'CC301')
      mat3.set('professor', 'Prof. Carlos Eduardo')
      mat3.set('carga_horaria', 60)
      mat3.set('limite_faltas', 15)
      mat3.set('horas_por_aula', 2)
      mat3.set('cor', '#06b6d4') // Cyan
      app.save(mat3)

      // Seed aulas for mat1 (Cálculo) - 10 aulas: 8 presenças, 2 faltas (4h de falta / 15h limite = 26.6% do limite)
      const aulasMat1 = [
        { data: '2025-03-03', status: 'presenca', conteudo: 'Apresentação e Funções' },
        { data: '2025-03-05', status: 'presenca', conteudo: 'Limites: Conceito Intuitivo' },
        { data: '2025-03-10', status: 'falta', conteudo: 'Propriedades dos Limites' },
        { data: '2025-03-12', status: 'presenca', conteudo: 'Limites Laterais' },
        { data: '2025-03-17', status: 'presenca', conteudo: 'Continuidade de Funções' },
        { data: '2025-03-19', status: 'presenca', conteudo: 'Teorema do Confronto' },
        { data: '2025-03-24', status: 'falta', conteudo: 'Derivadas: Definição formal' },
        { data: '2025-03-26', status: 'presenca', conteudo: 'Regras de Derivação básica' },
        { data: '2025-03-31', status: 'presenca', conteudo: 'Regra da Cadeia' },
        { data: '2025-04-02', status: 'presenca', conteudo: 'Exercícios preparatórios P1' },
      ]

      for (const a of aulasMat1) {
        const rec = new Record(aulas)
        rec.set('user_id', userId)
        rec.set('materia_id', mat1.id)
        rec.set('data', a.data)
        rec.set('status', a.status)
        rec.set('conteudo', a.conteudo)
        rec.set('horas', 2)
        app.save(rec)
      }

      // Seed aulas for mat2 (Algoritmos) - Near limit (8 faltas de 2h = 16h de 20h limite -> 80% do limite!)
      const aulasMat2 = [
        { data: '2025-03-04', status: 'presenca', conteudo: 'Estruturas de Dados Lineares' },
        { data: '2025-03-06', status: 'falta', conteudo: 'Filas e Pilhas em C' },
        { data: '2025-03-11', status: 'falta', conteudo: 'Alocação Dinâmica de Memória' },
        { data: '2025-03-13', status: 'presenca', conteudo: 'Listas Encadeadas Simples' },
        { data: '2025-03-18', status: 'falta', conteudo: 'Listas Duplamente Encadeadas' },
        { data: '2025-03-20', status: 'falta', conteudo: 'Árvores Binárias de Busca' },
        { data: '2025-03-25', status: 'presenca', conteudo: 'Balanceamento AVL' },
        { data: '2025-03-27', status: 'falta', conteudo: 'Grafos e Matriz de Adjacência' },
        { data: '2025-04-01', status: 'falta', conteudo: 'Busca em Largura (BFS)' },
        { data: '2025-04-03', status: 'falta', conteudo: 'Busca em Profundidade (DFS)' },
        { data: '2025-04-08', status: 'falta', conteudo: 'Algoritmo de Dijkstra' },
        { data: '2025-04-10', status: 'presenca', conteudo: 'Revisão e Prática em Laboratório' },
      ]

      for (const a of aulasMat2) {
        const rec = new Record(aulas)
        rec.set('user_id', userId)
        rec.set('materia_id', mat2.id)
        rec.set('data', a.data)
        rec.set('status', a.status)
        rec.set('conteudo', a.conteudo)
        rec.set('horas', 2)
        app.save(rec)
      }

      // Seed aulas for mat3 (Sistemas Operacionais) - Tranquilo (1 falta)
      const aulasMat3 = [
        { data: '2025-03-04', status: 'presenca', conteudo: 'Introdução a Sistemas Operacionais' },
        { data: '2025-03-07', status: 'presenca', conteudo: 'Processos e Threads' },
        { data: '2025-03-11', status: 'falta', conteudo: 'Chamadas de Sistema (Syscalls)' },
        { data: '2025-03-14', status: 'presenca', conteudo: 'Comunicação Interprocesso' },
        { data: '2025-03-18', status: 'presenca', conteudo: 'Escalonamento Round Robin' },
      ]

      for (const a of aulasMat3) {
        const rec = new Record(aulas)
        rec.set('user_id', userId)
        rec.set('materia_id', mat3.id)
        rec.set('data', a.data)
        rec.set('status', a.status)
        rec.set('conteudo', a.conteudo)
        rec.set('horas', 2)
        app.save(rec)
      }
    }

    seedForUser(demoUser.id)
    if (thiagoUser.id !== demoUser.id) {
      seedForUser(thiagoUser.id)
    }
  },
  (app) => {
    // down migration
  },
)
