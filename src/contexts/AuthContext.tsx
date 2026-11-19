import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  loginAsDemo: () => Promise<void>
  signup: (email: string, pass: string, name: string, universidade?: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  logout: () => void
  /** Atualiza o perfil do usuário logado (ex.: nome, universidade) e reflete no authStore. */
  atualizarPerfil: (dados: Partial<Pick<User, 'name' | 'universidade'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(pb.authStore.model as unknown as User | null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Escuta mudanças de authStore
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as unknown as User | null)
    })

    // Checa validade do token existente
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model as unknown as User | null)
    } else {
      pb.authStore.clear()
      setUser(null)
    }
    setIsLoading(false)

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email.trim(), pass)
  }

  const loginAsDemo = async () => {
    // Tenta primeiro demo@universitario.com, senão thiagobs.exe@gmail.com
    try {
      await pb.collection('users').authWithPassword('demo@universitario.com', 'Skip@Pass123')
    } catch {
      await pb.collection('users').authWithPassword('thiagobs.exe@gmail.com', 'Skip@Pass123')
    }
  }

  const signup = async (email: string, pass: string, name: string, universidade?: string) => {
    const createdUser = await pb.collection('users').create({
      email: email.trim(),
      password: pass,
      passwordConfirm: pass,
      name: name.trim(),
      universidade: universidade?.trim() || '',
    })

    await pb.collection('users').authWithPassword(email.trim(), pass)

    // Se o novo usuário não tiver matérias, pode opcionalmente receber matérias padrão de exemplo
    try {
      const { criarMateria } = await import('@/services/materias')
      await criarMateria({
        nome: 'Cálculo Diferencial e Integral',
        codigo: 'MAT101',
        professor: 'Prof. Exemplo',
        carga_horaria: 60,
        horas_por_aula: 2,
        cor: '#6366f1',
      })
      await criarMateria({
        nome: 'Algoritmos e Estruturas de Dados',
        codigo: 'CC202',
        professor: 'Profa. Exemplo',
        carga_horaria: 80,
        horas_por_aula: 2,
        cor: '#ec4899',
      })
    } catch (e) {
      console.warn('Não foi possível gerar matérias iniciais do usuário:', e)
    }
  }

  const requestPasswordReset = async (email: string) => {
    await pb.collection('users').requestPasswordReset(email.trim())
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const atualizarPerfil = async (dados: Partial<Pick<User, 'name' | 'universidade'>>) => {
    if (!user) throw new Error('Usuário não autenticado')
    await pb.collection('users').update(user.id, dados)
    const atualizado = { ...user, ...dados } as User
    // Mantém o authStore (e toda a árvore de componentes) em sincronia
    const model = pb.authStore.model
    if (model) {
      pb.authStore.save(pb.authStore.token, { ...model, ...dados })
    }
    setUser(atualizado)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginAsDemo,
        signup,
        requestPasswordReset,
        logout,
        atualizarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
