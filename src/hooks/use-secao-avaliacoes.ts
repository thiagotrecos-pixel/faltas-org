import { Materia, Avaliacao } from '@/types'
import {
  criarAvaliacao,
  atualizarAvaliacao,
  excluirAvaliacao,
  AvaliacaoInput,
} from '@/services/avaliacoes'
import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

/** Estado do formulário de uma avaliação (linha editável inline). */
interface FormAvaliacao {
  id: string | null
  nome: string
  valor_maximo: string
  nota_obtida: string
}

const FORM_VAZIO: FormAvaliacao = {
  id: null,
  nome: '',
  valor_maximo: '',
  nota_obtida: '',
}

/**
 * Estado da seção "Avaliações" do modal de matéria: lança, edita e exclui
 * pontuações (P1, P2, trabalhos...) da matéria.
 */
export function useSecaoAvaliacoes(materiaId: string | null, onAlterado: () => void) {
  const [form, setForm] = useState<FormAvaliacao>(FORM_VAZIO)
  const [isSalvando, setIsSalvando] = useState(false)
  const [isExcluindo, setIsExcluindo] = useState(false)

  const iniciarEdicao = useCallback((av: Avaliacao) => {
    setForm({
      id: av.id,
      nome: av.nome,
      valor_maximo: String(av.valor_maximo ?? ''),
      nota_obtida: av.nota_obtida == null ? '' : String(av.nota_obtida),
    })
  }, [])

  const cancelar = useCallback(() => setForm(FORM_VAZIO), [])

  const salvar = async () => {
    if (!materiaId || !form.nome.trim() || !form.valor_maximo) return
    setIsSalvando(true)
    try {
      const dados: AvaliacaoInput = {
        materia_id: materiaId,
        nome: form.nome,
        valor_maximo: Number(form.valor_maximo),
        nota_obtida: form.nota_obtida === '' ? null : Number(form.nota_obtida),
      }
      if (form.id) {
        await atualizarAvaliacao(form.id, dados)
      } else {
        await criarAvaliacao(dados)
      }
      setForm(FORM_VAZIO)
      onAlterado()
      toast({ title: 'Avaliação salva', description: `"${form.nome.trim()}" registrada.` })
    } catch (err: unknown) {
      console.error('Erro ao salvar avaliação:', err)
      toast({
        title: 'Erro ao salvar avaliação',
        description: (err as { message?: string })?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSalvando(false)
    }
  }

  const excluir = async (id: string) => {
    setIsExcluindo(true)
    try {
      await excluirAvaliacao(id)
      if (form.id === id) setForm(FORM_VAZIO)
      onAlterado()
      toast({ title: 'Avaliação excluída' })
    } catch (err: unknown) {
      console.error('Erro ao excluir avaliação:', err)
      toast({
        title: 'Erro ao excluir avaliação',
        description: (err as { message?: string })?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsExcluindo(false)
    }
  }

  return { form, setForm, iniciarEdicao, cancelar, salvar, excluir, isSalvando, isExcluindo }
}
