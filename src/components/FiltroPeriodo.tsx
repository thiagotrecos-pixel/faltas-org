import React from 'react'
import { Periodo } from '@/types'
import { FILTRO_SEM_PERIODO, FILTRO_TODOS } from '@/services/periodos'
import { cn } from '@/lib/utils'

interface FiltroPeriodoProps {
  periodos: Periodo[]
  value: string
  onChange: (valor: string) => void
}

/** Pílulas para alternar entre "todos", cada período e "sem período". */
export const FiltroPeriodo: React.FC<FiltroPeriodoProps> = ({ periodos, value, onChange }) => {
  if (periodos.length === 0) return null

  const opcoes = [
    { id: FILTRO_TODOS, label: 'Todos' },
    ...periodos.map((p) => ({ id: p.id, label: p.nome })),
    { id: FILTRO_SEM_PERIODO, label: 'Sem período' },
  ]

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Filtrar por período"
    >
      <span className="text-[11px] uppercase font-mono text-zinc-500 mr-1">Período</span>
      {opcoes.map((o) => {
        const ativo = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.id)}
            className={cn(
              'px-3 h-7 rounded-full text-[11px] font-semibold border transition-colors',
              ativo
                ? 'bg-indigo-600/30 border-indigo-400/60 text-indigo-200 shadow-md shadow-indigo-600/20'
                : 'bg-[#101426] border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
