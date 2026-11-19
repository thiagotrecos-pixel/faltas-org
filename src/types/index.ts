export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  created: string
  updated: string
}

export interface Materia {
  id: string
  user_id: string
  nome: string
  codigo?: string
  professor?: string
  carga_horaria: number
  limite_faltas: number
  horas_por_aula?: number
  cor?: string
  percentual_aviso?: number | null
  /** Nome do arquivo de imagem enviado (campo file do PocketBase). */
  imagem?: string
  created: string
  updated: string
}

export interface Configuracao {
  id: string
  user_id: string
  chave: 'aviso_preventivo'
  valor: number
  created: string
  updated: string
}

export interface Aula {
  id: string
  user_id: string
  materia_id: string
  data: string
  status: 'presenca' | 'falta' | 'prevista'
  conteudo?: string
  horas?: number
  created: string
  updated: string
}

export interface MateriaStats {
  materia: Materia
  totalAulas: number
  totalPresencas: number
  totalFaltas: number
  totalPrevistas: number
  horasFaltas: number
  horasPresencas: number
  horasTotalRealizadas: number
  percentualFaltasCarga: number // (horas de faltas / carga horária total) * 100
  percentualLimiteConsumido: number // (horas de faltas / limite de faltas) * 100
  faltasRestantesHoras: number
  aulasRestantesPossiveis: number // faltas restantes / horas_por_aula
  isAlerta: boolean // >= percentual de aviso configurado
  isEstourado: boolean // >= 100% do limite
  percentualAviso: number // percentual da cota usado como gatilho do alerta
  statusAlerta: 'seguro' | 'alerta' | 'reprovado'
}
