import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  Plus,
  Settings2,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/BottomNav'

interface NavbarProps {
  onOpenNovaMateria?: () => void
  totalAlertas?: number
}

const navItems = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Matérias', path: '/materias', icon: BookOpen },
  { label: 'Aulas', path: '/aulas', icon: CheckSquare },
  { label: 'Histórico', path: '/historico', icon: History },
  {
    label: 'Alertas',
    path: '/alertas',
    icon: AlertTriangle,
    badgeKey: 'alertas' as const,
  },
  { label: 'Config.', path: '/configuracoes', icon: Settings2 },
]

/**
 * Cabeçalho da aplicação.
 * - Desktop: marca + navegação em pílulas (com item ativo destacado) + ações do usuário.
 * - Mobile: apenas marca + ações; a navegação fica na barra inferior fixa
 *   (BottomNav, md:hidden), renderizada junto deste componente.
 */
export const Navbar: React.FC<NavbarProps> = ({ onOpenNovaMateria, totalAlertas = 0 }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b tech-border bg-[#0a0d18]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  Falta<span className="text-indigo-400">.org</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Univ
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Frequência e limite de 25%
              </p>
            </div>
          </Link>

          {/* Center Navigation - Pill style (desktop only) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#12162a]/90 p-1.5 rounded-full border tech-border shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const badge =
                item.badgeKey === 'alertas' && totalAlertas > 0 ? totalAlertas : undefined
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {onOpenNovaMateria && (
              <Button
                size="sm"
                onClick={onOpenNovaMateria}
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 gap-1.5 h-8 px-3.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Matéria</span>
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l tech-border">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-medium text-zinc-200 truncate max-w-[120px]">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                  {user.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Sair da conta"
                  className="w-8 h-8 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Barra de navegação inferior fixa (mobile only) */}
      <BottomNav totalAlertas={totalAlertas} />
    </>
  )
}
