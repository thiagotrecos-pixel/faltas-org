import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Settings2,
  History,
} from 'lucide-react'

interface BottomNavProps {
  totalAlertas?: number
}

/**
 * Barra de navegação inferior fixa — exibida apenas no mobile (md:hidden).
 * Estilo tech/noturno: fundo escuro com blur, borda superior com brilho e
 * pílula destacada no item ativo.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ totalAlertas = 0 }) => {
  const location = useLocation()

  const navItems = [
    { label: 'Painel', path: '/', icon: LayoutDashboard },
    { label: 'Matérias', path: '/materias', icon: BookOpen },
    { label: 'Aulas', path: '/aulas', icon: CheckSquare },
    { label: 'Histórico', path: '/historico', icon: History },
    {
      label: 'Alertas',
      path: '/alertas',
      icon: AlertTriangle,
      badge: totalAlertas > 0 ? totalAlertas : undefined,
    },
    { label: 'Config.', path: '/configuracoes', icon: Settings2 },
  ]

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t tech-border bg-[#0a0d18]/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.45)]"
    >
      <div
        className="max-w-7xl mx-auto flex items-stretch justify-around px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-1 pt-2.5 pb-1.5 rounded-xl min-w-0 flex-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-300'
                  : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-200'
              }`}
            >
              {/* Pílula de brilho no item ativo */}
              <span
                aria-hidden
                className={`absolute inset-x-2 top-1.5 h-9 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/40 to-cyan-500/30 shadow-md shadow-indigo-500/25'
                    : 'opacity-0'
                }`}
              />
              <span className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-300' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="relative truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
