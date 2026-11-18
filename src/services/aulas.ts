import pb from '@/lib/pocketbase/client'
import { Aula } from '@/types'

export async function listarAulas(materiaId?: string): Promise<Aula[]> {
  const filter = materiaId ? `materia_id = '${materiaId}'` : ''
  const records = await pb.collection('aulas').getFullList<Aula>({
    filter: filter || undefined,
    sort: '-data,-created',
  })
  return records
}

export interface CriarAulaInput {
  materia_id: string
  data: string
  status: 'presenca' | 'falta' | 'prevista'
  conteudo?: string
  horas?: number
}

export async function criarAula(dados: CriarAulaInput): Promise<Aula> {
  const userId = pb.authStore.model?.id
  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const record = await pb.collection('aulas').create<Aula>({
    user_id: userId,
    materia_id: dados.materia_id,
    data: dados.data,
    status: dados.status,
    conteudo: dados.conteudo?.trim() || '',
    horas: Number(dados.horas || 2),
  })
  return record
}

export async function atualizarAula(id: string, dados: Partial<CriarAulaInput>): Promise<Aula> {
  const payload: Record<string, unknown> = {}
  if (dados.materia_id !== undefined) payload.materia_id = dados.materia_id
  if (dados.data !== undefined) payload.data = dados.data
  if (dados.status !== undefined) payload.status = dados.status
  if (dados.conteudo !== undefined) payload.conteudo = dados.conteudo.trim()
  if (dados.horas !== undefined) payload.horas = Number(dados.horas)

  const record = await pb.collection('aulas').update<Aula>(id, payload)
  return record
}

export async function alternarStatusAula(
  id: string,
  statusAtual: 'presenca' | 'falta' | 'prevista',
): Promise<Aula> {
  // Ciclo rápido: presenca -> falta -> presenca
  const novoStatus = statusAtual === 'presenca' ? 'falta' : 'presenca'
  return await atualizarAula(id, { status: novoStatus })
}

export async function excluirAula(id: string): Promise<boolean> {
  return await pb.collection('aulas').delete(id)
}
