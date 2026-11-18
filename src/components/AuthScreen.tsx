import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'

export const AuthScreen: React.FC = () => {
  const { login, signup, loginAsDemo, requestPasswordReset } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: 'Informe seu e-mail',
        variant: 'destructive',
      })
      return
    }

    if (mode === 'reset') {
      setIsLoading(true)
      try {
        await requestPasswordReset(email)
        toast({
          title: 'E-mail enviado!',
          description: 'Se o endereço estiver cadastrado, você receberá o link de redefinição.',
        })
        setMode('login')
      } catch (err: unknown) {
        toast({
          title: 'Erro ao solicitar recuperação',
          description: (err as { message?: string })?.message || 'Verifique o e-mail informado.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!password) {
      toast({
        title: 'Informe sua senha',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast({
          title: 'Bem-vindo de volta!',
          description: 'Acessando suas matérias e faltas.',
        })
      } else {
        if (!name) {
          toast({
            title: 'Informe seu nome',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }
        await signup(email, password, name)
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Seja bem-vindo ao Controle de Faltas.',
        })
      }
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: mode === 'login' ? 'Falha no login' : 'Falha no cadastro',
        description:
          (err as { message?: string })?.message ||
          'Verifique suas credenciais e tente novamente (senha mínima de 8 caracteres).',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setDemoLoading(true)
    try {
      await loginAsDemo()
      toast({
        title: 'Modo Demonstração ativado!',
        description: 'Você entrou com a conta de exemplo pronta para explorar.',
      })
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao entrar como demo',
        description: 'Use o formulário para criar sua própria conta.',
        variant: 'destructive',
      })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background soft ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 right-10 w-[400px] h-[300px] bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25">
            <div className="w-full h-full bg-[#0a0d18] rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Controle de Faltas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Monitore suas presenças, não perca o limite de 25% e evite reprovações por falta no
            semestre.
          </p>
        </div>

        {/* Demo button highlight */}
        <div className="p-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-cyan-500/30 to-purple-500/30">
          <div className="p-3.5 rounded-[14px] bg-[#0d1122] flex items-center justify-between gap-3 border tech-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Quer só testar o app?</p>
                <p className="text-[11px] text-zinc-400">
                  Conta pronta com matérias e aulas de exemplo
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleDemoAccess}
              disabled={demoLoading || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold px-3 h-8 shadow-md shadow-indigo-600/30 shrink-0"
            >
              {demoLoading ? 'Entrando...' : 'Entrar Demo'}
            </Button>
          </div>
        </div>

        {/* Auth form card */}
        <Card className="tech-card border tech-border shadow-2xl rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white">
                {mode === 'login' && 'Entrar na sua conta'}
                {mode === 'signup' && 'Criar nova conta'}
                {mode === 'reset' && 'Recuperar senha'}
              </CardTitle>
              {mode !== 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Não tem conta? Criar' : 'Já tenho conta'}
                </button>
              )}
            </div>
            <CardDescription className="text-xs text-zinc-400">
              {mode === 'login' &&
                'Acesse suas matérias e faltas sincronizadas no seu dispositivo.'}
              {mode === 'signup' && 'Cadastre-se para gerenciar seus limites e checklist de aulas.'}
              {mode === 'reset' &&
                'Enviaremos um link de recuperação para o seu e-mail cadastrado.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs text-zinc-300">
                    Seu nome completo
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Ex: Amanda Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#12162a] border-zinc-700/60 pl-9 text-xs h-9 text-zinc-100"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-zinc-300">
                  E-mail institucional ou pessoal
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="aluno@faculdade.edu.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#12162a] border-zinc-700/60 pl-9 text-xs h-9 text-zinc-100"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass" className="text-xs text-zinc-300">
                      Senha {mode === 'signup' && '(mín. 8 caracteres)'}
                    </Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[11px] text-zinc-400 hover:text-indigo-400 transition-colors"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <Input
                      id="pass"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#12162a] border-zinc-700/60 pl-9 text-xs h-9 text-zinc-100"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || demoLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5"
              >
                <span>
                  {isLoading
                    ? 'Processando...'
                    : mode === 'login'
                      ? 'Entrar no Sistema'
                      : mode === 'signup'
                        ? 'Cadastrar e Começar'
                        : 'Enviar Link de Recuperação'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              {mode === 'reset' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Voltar para o login
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Feature Pills Footer */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            Limite oficial de 25%
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Alertas antecipados (75%)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            Checklist por aula
          </span>
        </div>
      </div>
    </div>
  )
}
