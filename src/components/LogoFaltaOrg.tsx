import React from 'react'
import { cn } from '@/lib/utils'

interface LogoFaltaOrgProps {
  className?: string
}

/**
 * Capelo de formatura em SVG vetorial — mesmo desenho e cor (#5ce1e6) dos
 * ícones do app (public/icons/icon.svg, public/favicon.svg).
 */
const CapeloFaltaOrg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="592 528 760 500"
    role="img"
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="#5ce1e6">
      <path d="M965 548 L1322 672 Q1332 678 1320 684 L997 800 Q968 812 968 835 Q970 855 1000 862 L1190 812 L1190 915 Q1190 1005 968 1005 Q748 1005 748 915 L748 800 Q735 790 695 778 L640 757 Q615 745 612 710 Q612 680 632 668 Z" />
      <path
        d="M978 672 Q760 745 712 818"
        fill="none"
        stroke="#5ce1e6"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path d="M704 836 L712 880 L690 960 L632 958 L660 905 Z" />
      <circle cx="690" cy="870" r="22" />
    </g>
    {/* Linhas das páginas do capelo */}
    <g stroke="#070913" strokeWidth="8" strokeLinecap="round">
      <line x1="1000" y1="815" x2="1305" y2="703" />
      <line x1="1000" y1="828" x2="1310" y2="718" />
      <line x1="1000" y1="842" x2="1315" y2="735" />
    </g>
  </svg>
)

/**
 * Marca completa do Falta.org para a tela de login, na identidade atual dos
 * ícones: capelo ciano sobre tile escuro arredondado + wordmark "Falta.org"
 * (o ".org" em destaque) + tagline "GESTÃO DE FALTAS".
 */
export const LogoFaltaOrg: React.FC<LogoFaltaOrgProps> = ({ className }) => {
  return (
    <span className={cn('flex flex-col items-center', className)}>
      <span className="block w-24 h-24 sm:w-28 sm:h-28 rounded-[1.75rem] bg-[#0d1122] border tech-border flex items-center justify-center shadow-[0_0_45px_-12px_rgba(92,225,230,0.45)]">
        <CapeloFaltaOrg className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" />
      </span>
      <span className="block mt-3 text-3xl font-bold tracking-tight text-white leading-none">
        Falta<span className="text-cyan-400">.org</span>
      </span>
      <span className="block mt-1.5 text-[10px] font-semibold tracking-[0.35em] text-purple-400 uppercase">
        Gestão de Faltas
      </span>
    </span>
  )
}
