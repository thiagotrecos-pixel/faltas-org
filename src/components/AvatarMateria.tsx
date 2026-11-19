import React, { useState } from 'react'
import { Materia } from '@/types'
import { imagemMateriaUrl } from '@/services/materias'

interface AvatarMateriaProps {
  materia: Materia
  /** Tamanho do avatar em classes Tailwind (padrão 12 = 48px, ao lado do nome). */
  sizeClass?: string
  /** Classe de texto para a inicial do fallback. */
  textoClass?: string
}

/**
 * Avatar da matéria: mostra a imagem enviada pelo usuário ou,
 * como fallback, a inicial da matéria sobre um gradiente da cor escolhida.
 */
export const AvatarMateria: React.FC<AvatarMateriaProps> = ({
  materia,
  sizeClass = 'w-12 h-12',
  textoClass = 'text-lg',
}) => {
  const cor = materia.cor || '#6366f1'
  const urlImagem = imagemMateriaUrl(materia)
  const [imagemFalhou, setImagemFalhou] = useState(false)
  const inicial = materia.nome?.trim()?.charAt(0).toUpperCase() || '?'

  return (
    <div
      className={`relative ${sizeClass} rounded-xl shrink-0 overflow-hidden border tech-border flex items-center justify-center`}
      style={{ boxShadow: `0 0 18px -6px ${cor}66` }}
    >
      {urlImagem && !imagemFalhou ? (
        <img
          src={urlImagem}
          alt={`Imagem da matéria ${materia.nome}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImagemFalhou(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-black text-white ${textoClass}`}
          style={{
            background: `linear-gradient(135deg, ${cor}dd 0%, ${cor}55 100%)`,
          }}
        >
          {inicial}
        </div>
      )}
    </div>
  )
}
