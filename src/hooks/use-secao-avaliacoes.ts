import { Materia, Avaliacao } from '@/types'
import {
  criarAvaliacao,
  atualizarAvaliacao,
  excluirAvaliacao,
  AvaliacaoInput,
} from '@/services/avaliacoes'
import { useState, useCallback } from 'react'

export type AvaliacaoParaEditar = (Avaliacao & { materia_id?: string }) | null

interface SecaoAvaliacoesProps {
  materia: Materia
  avaliacoes: Avaliacao[]
  onRecarregar: () => void
}

/** Estado de formulário de uma avaliação (linha editável inline). */
interface FormAvaliacao {
  id: string | null
  nome: string
  valor_maximo: string
  nota_obtida: string
  data: string
}

const FORM_VAZIO: FormAvaliacao = {
  id: null,
  nome: '',
  valor_maximo: '',
  nota_obtida: '',
  data: '',
}

/**
 * Seção "Avaliações" do modal de matéria: lança, edita e exclui pontuações
 * (P1, P2, trabalhos...) e mostra o resumo de aprovação por pontos.
 */
export function SecaoAvaliacoes({ materia, avaliacoes, onRecarregar }: SecaoAvaliacoesProps) {
  const [form, setForm] = useState<FormAvaliacao>(FORM_VAZIO)
  const [isSalvando, setIsSalvando] = useState(false)
  const [isExcluindo, setIsExcluindo] = useState(false)

  const iniciarEdicao = useCallback((av: Avaliacao) => {
    setForm({
      id: av.id,
      nome: av.nome,
      valor_maximo: String(av.valor_maximo ?? ''),
      nota_obtida: av.nota_obtida == null ? '' : String(av.nota_obtida),
      data: av.data || '',
    })
  }, [])

  const cancelar = useCallback(() => setForm(FORM_VAZIO), [])

  const salvar = async () => {
    if (!form.nome.trim() || !form.valor_maximo) return
    setIsSalvando(true)
    try {
      const dados: AvaliacaoInput = {
        materia_id: materia.id,
        nome: form.nome,
        valor_maximo: Number(form.valor_maximo),
        nota_obtida: form.nota_obtida === '' ? null : Number(form.nota_obtida),
        data: form.data,
      }
      if (form.id) {
        await atualizarAvaliacao(form.id, dados)
      } else {
        await criarAvaliacao(dados)
      }
      setForm(FORM_VAZIO)
      onRecarregar()
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err)
    } finally {
      setIsSalvando(false)
    }
  }

  const excluir = async (id: string) => {
    setIsExcluindo(true)
    try {
      await excluirAvaliacao(id)
      if (form.id === id) setForm(FORM_VAZIO)
      onRecarregar()
    } catch (err) {
      console.error('Erro ao excluir avaliação:', err)
    } finally {
      setIsExcluindo(false)
    }
  }

  return { form, setForm, iniciarEdicao, cancelar, salvar, excluir, isSalvando, isExcluindo }
}
