import pb from '@/lib/pocketbase/client'
import { Materia } from '@/types'
import { calcularLimiteFaltas } from './calculations'

export async function listarMaterias(): Promise<Materia[]> {
  const records = await pb.collection('materias').getFullList<Materia>({
    sort: 'nome',
  })
  return records
}

export async function obterMateria(id: string): Promise<Materia> {
  const record = await pb.collection('materias').getOne<Materia>(id)
  return record
}

export interface CriarMateriaInput {
  nome: string
  codigo?: string
  professor?: string
  carga_horaria: number
  limite_faltas?: number
  horas_por_aula?: number
  cor?: string
  /** Limite de aviso específico da matéria (1–99). Vazio = usa o global. */
  percentual_aviso?: number | null
  /** Percentual de reprovação próprio da matéria (1–99). Vazio = padrão do app (25%). */
  percentual_reprovacao?: number | null
  /** Gatilho próprio por faltas restantes (>=1). Vazio = usa o global. */
  faltas_restantes_aviso?: number | null
  /** Arquivo de imagem escolhido pelo usuário (upload). */
  imagem?: File | null
  /** Remove a imagem atual da matéria (envia null para o PocketBase). */
  remover_imagem?: boolean
  /** Período da matéria (vazio/null = sem período). */
  periodo_id?: string | null
}

/** URL pública do arquivo de imagem da matéria (thumb 600px do PocketBase). */
export function imagemMateriaUrl(materia: Pick<Materia, 'id' | 'imagem'>): string | null {
  if (!materia.imagem) return null
  return arquivoMateriaUrl(
    materia.id,
    (materia as { collectionId?: string }).collectionId,
    materia.imagem,
  )
}

/** URL pública de um arquivo do PocketBase dado o record, a coleção e o nome do arquivo. */
export function arquivoMateriaUrl(
  recordId: string,
  collectionId: string | undefined,
  filename: string,
): string {
  return pb.files.getURL({ id: recordId, collectionId: collectionId || 'materias' }, filename, {
    thumb: '600x0',
  })
}

export async function criarMateria(dados: CriarMateriaInput): Promise<Materia> {
  const userId = pb.authStore.model?.id
  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const limiteCalculado =
    dados.limite_faltas && dados.limite_faltas > 0
      ? dados.limite_faltas
      : calcularLimiteFaltas(dados.carga_horaria)

  const payload = {
    user_id: userId,
    nome: dados.nome.trim(),
    codigo: dados.codigo?.trim() || '',
    professor: dados.professor?.trim() || '',
    carga_horaria: Number(dados.carga_horaria),
    limite_faltas: Number(limiteCalculado),
    horas_por_aula: Number(dados.horas_por_aula || 2),
    cor: dados.cor || '#6366f1',
    periodo_id: dados.periodo_id || null,
    percentual_aviso:
      dados.percentual_aviso != null && dados.percentual_aviso > 0
        ? Math.min(99, Math.max(1, Math.round(dados.percentual_aviso)))
        : null,
    percentual_reprovacao:
      dados.percentual_reprovacao != null && dados.percentual_reprovacao > 0
        ? Math.min(99, Math.max(1, Math.round(dados.percentual_reprovacao)))
        : null,
    faltas_restantes_aviso:
      dados.faltas_restantes_aviso != null && dados.faltas_restantes_aviso > 0
        ? Math.max(1, Math.round(dados.faltas_restantes_aviso))
        : null,
  }

  const formData = buildMateriaFormData(payload)
  const record = await pb.collection('materias').create<Materia>(formData)
  return record
}

export async function atualizarMateria(
  id: string,
  dados: Partial<CriarMateriaInput>,
): Promise<Materia> {
  const payload: Record<string, unknown> = {}
  if (dados.nome !== undefined) payload.nome = dados.nome.trim()
  if (dados.codigo !== undefined) payload.codigo = dados.codigo.trim()
  if (dados.professor !== undefined) payload.professor = dados.professor.trim()
  if (dados.carga_horaria !== undefined) {
    payload.carga_horaria = Number(dados.carga_horaria)
    // Se o usuário não passou limite explícito, recalcula os 25%
    if (dados.limite_faltas === undefined) {
      payload.limite_faltas = calcularLimiteFaltas(payload.carga_horaria as number)
    }
  }
  if (dados.limite_faltas !== undefined) payload.limite_faltas = Number(dados.limite_faltas)
  if (dados.horas_por_aula !== undefined) payload.horas_por_aula = Number(dados.horas_por_aula)
  if (dados.cor !== undefined) payload.cor = dados.cor
  if (dados.percentual_aviso !== undefined) {
    payload.percentual_aviso =
      dados.percentual_aviso != null && dados.percentual_aviso > 0
        ? Math.min(99, Math.max(1, Math.round(dados.percentual_aviso)))
        : null
  }
  if (dados.percentual_reprovacao !== undefined) {
    payload.percentual_reprovacao =
      dados.percentual_reprovacao != null && dados.percentual_reprovacao > 0
        ? Math.min(99, Math.max(1, Math.round(dados.percentual_reprovacao)))
        : null
  }
  if (dados.faltas_restantes_aviso !== undefined) {
    payload.faltas_restantes_aviso =
      dados.faltas_restantes_aviso != null && dados.faltas_restantes_aviso > 0
        ? Math.max(1, Math.round(dados.faltas_restantes_aviso))
        : null
  }
  if (dados.periodo_id !== undefined) payload.periodo_id = dados.periodo_id || null
  if (dados.imagem !== undefined) payload.imagem = dados.imagem
  if (dados.remover_imagem) payload.imagem = null

  const formData = buildMateriaFormData(payload)
  const record = await pb.collection('materias').update<Materia>(id, formData)
  return record
}

/**
 * Monta o FormData de criação/atualização. Necessário porque o SDK do
 * PocketBase serializa arquivos (imagem) corretamente apenas via FormData.
 */
function buildMateriaFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData()
  for (const [chave, valor] of Object.entries(payload)) {
    if (valor === undefined) continue
    if (valor === null) {
      formData.append(chave, '')
    } else if (valor instanceof File) {
      formData.append(chave, valor)
    } else if (typeof valor === 'number') {
      formData.append(chave, String(valor))
    } else {
      formData.append(chave, String(valor))
    }
  }
  return formData
}

export async function excluirMateria(id: string): Promise<boolean> {
  return await pb.collection('materias').delete(id)
}
