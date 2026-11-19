import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthScreen } from '@/components/AuthScreen'
import { DashboardScreen } from '@/components/DashboardScreen'
import { RefreshCw } from 'lucide-react'

const Index: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
        <p className="text-xs">Carregando Falta.org...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <DashboardScreen />
}

export default Index
