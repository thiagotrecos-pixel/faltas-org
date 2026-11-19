import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Seletor livre de cor em espectro (tema tech noturno): roleta de matiz em SVG,
 * área de saturação/brilho e input hex. Sem bibliotecas externas.
 * Emite sempre um hex normalizado `#rrggbb`, compatível com as cores já salvas.
 */

interface Hsv {
  h: number // 0–359
  s: number // 0–1
  v: number // 0–1
}

interface SelecionadorCorEspectroProps {
  cor: string
  onChange: (hex: string) => void
  className?: string
}

/** Fallback das matérias novas (índigo tech), mesma cor usada pelo app. */
const COR_PADRAO: Hsv = { h: 234, s: 0.61, v: 0.95 }

export const hexParaHsv = (hex: string): Hsv | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let hh = 0
  if (d !== 0) {
    if (max === r) hh = ((g - b) / d) % 6
    else if (max === g) hh = (b - r) / d + 2
    else hh = (r - g) / d + 4
    hh *= 60
    if (hh < 0) hh += 360
  }
  return { h: hh, s: max === 0 ? 0 : d / max, v: max }
}

const hsvParaHex = ({ h, s, v }: Hsv): string => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g] = [c, x]
  else if (h < 120) [r, g] = [x, c]
  else if (h < 180) [g, b] = [c, x]
  else if (h < 240) [g, b] = [x, c]
  else if (h < 300) [r, b] = [x, c]
  else [r, b] = [c, x]
  const p = (t: number) =>
    Math.round(Math.min(1, Math.max(0, t + m)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${p(r)}${p(g)}${p(b)}`
}

const limitar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor))

const TAM_ROLETA = 160
const CENTRO = TAM_ROLETA / 2
const RAIO_EXTERNO = CENTRO - 4
const RAIO_INTERNO = RAIO_EXTERNO - 26
const SEGMENTOS = 72

export const SelecionadorCorEspectro: React.FC<SelecionadorCorEspectroProps> = ({
  cor,
  onChange,
  className,
}) => {
  const [hsv, setHsv] = useState<Hsv>(() => hexParaHsv(cor) ?? COR_PADRAO)
  const [hexTexto, setHexTexto] = useState(cor)
  const [arrastando, setArrastando] = useState<'roleta' | 'area' | null>(null)
  // Hex do último emitido: evita dessincronizar quando a conversão arredonda
  const ultimoEmitido = useRef<string | null>(null)

  // Sincroniza quando a cor muda por fora (abrir modal, editar matéria antiga)
  useEffect(() => {
    if (cor.toLowerCase() === ultimoEmitido.current?.toLowerCase()) {
      setHexTexto(cor)
      return
    }
    const parsed = hexParaHsv(cor) ?? COR_PADRAO
    setHsv(parsed)
    setHexTexto(cor)
  }, [cor])

  const aplicar = (novo: Hsv) => {
    setHsv(novo)
    const hex = hsvParaHex(novo)
    ultimoEmitido.current = hex
    setHexTexto(hex)
    onChange(hex)
  }

  const roletaRef = useRef<SVGSVGElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  const matizDePonto = (clientX: number, clientY: number) => {
    const rect = roletaRef.current?.getBoundingClientRect()
    if (!rect) return null
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    if (dx === 0 && dy === 0) return null
    return (Math.atan2(dy, dx) * 180) / Math.PI >= 0
      ? (Math.atan2(dy, dx) * 180) / Math.PI
      : ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
  }

  const svDePonto = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect) return null
    const s = limitar((clientX - rect.left) / rect.width, 0, 1)
    const v = limitar(1 - (clientY - rect.top) / rect.height, 0, 1)
    return { s, v }
  }

  const aoMover = (e: React.PointerEvent) => {
    if (!arrastando) return
    if (arrastando === 'roleta') {
      const h = matizDePonto(e.clientX, e.clientY)
      if (h !== null) aplicar({ ...hsv, h })
    } else {
      const sv = svDePonto(e.clientX, e.clientY)
      if (sv) aplicar({ ...hsv, ...sv })
    }
  }

  const iniciarArrasto = (e: React.PointerEvent, tipo: 'roleta' | 'area') => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setArrastando(tipo)
    if (tipo === 'roleta') {
      const h = matizDePonto(e.clientX, e.clientY)
      if (h !== null) aplicar({ ...hsv, h })
    } else {
      const sv = svDePonto(e.clientX, e.clientY)
      if (sv) aplicar({ ...hsv, ...sv })
    }
  }

  const soltar = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setArrastando(null)
  }

  // Teclado na roleta: setas ajustam o matiz (1°, com Shift 10°)
  const aoTeclar = (e: React.KeyboardEvent) => {
    const passo = e.shiftKey ? 10 : 1
    let h: number | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') h = (hsv.h - passo + 360) % 360
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') h = (hsv.h + passo) % 360
    if (h !== null) {
      e.preventDefault()
      aplicar({ ...hsv, h })
    }
  }

  const aoDigitarHex = (valor: string) => {
    setHexTexto(valor)
    const parsed = hexParaHsv(valor)
    if (parsed) {
      ultimoEmitido.current = hsvParaHex(parsed)
      setHsv(parsed)
      onChange(hsvParaHex(parsed))
    }
  }

  // Segmentos da roleta (setores anelares em HSL puro)
  const segmentos = useMemo(() => {
    const p = (raio: number, angulo: number) => {
      const rad = (angulo * Math.PI) / 180
      const x = CENTRO + raio * Math.cos(rad)
      const y = CENTRO + raio * Math.sin(rad)
      return `${x.toFixed(2)} ${y.toFixed(2)}`
    }
    return Array.from({ length: SEGMENTOS }, (_, i) => {
      const a1 = (i * 360) / SEGMENTOS
      const a2 = ((i + 1) * 360) / SEGMENTOS
      return {
        path: `M ${p(RAIO_EXTERNO, a1)} A ${RAIO_EXTERNO} ${RAIO_EXTERNO} 0 0 1 ${p(RAIO_EXTERNO, a2)} L ${p(RAIO_INTERNO, a2)} A ${RAIO_INTERNO} ${RAIO_INTERNO} 0 0 0 ${p(RAIO_INTERNO, a1)} Z`,
        cor: `hsl(${a1}, 100%, 50%)`,
      }
    })
  }, [])

  const radMarcador = (hsv.h * Math.PI) / 180
  const raioMedio = (RAIO_EXTERNO + RAIO_INTERNO) / 2
  const marcadorX = CENTRO + raioMedio * Math.cos(radMarcador)
  const marcadorY = CENTRO + raioMedio * Math.sin(radMarcador)

  const hexAtual = hsvParaHex(hsv)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-4">
        {/* Roleta de matiz */}
        <svg
          ref={roletaRef}
          width={TAM_ROLETA}
          height={TAM_ROLETA}
          viewBox={`0 0 ${TAM_ROLETA} ${TAM_ROLETA}`}
          role="slider"
          tabIndex={0}
          aria-label="Roleta de matiz (cor)"
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={Math.round(hsv.h)}
          aria-valuetext={hexAtual}
          className="shrink-0 touch-none rounded-full outline-none cursor-crosshair focus-visible:ring-2 focus-visible:ring-indigo-400/70"
          style={{ filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.25))' }}
          onPointerDown={(e) => iniciarArrasto(e, 'roleta')}
          onPointerMove={aoMover}
          onPointerUp={soltar}
          onKeyDown={aoTeclar}
        >
          {segmentos.map((seg, i) => (
            <path key={i} d={seg.path} fill={seg.cor} />
          ))}
          <circle
            cx={CENTRO}
            cy={CENTRO}
            r={RAIO_INTERNO - 3}
            fill="#0f1424"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
          <circle cx={CENTRO} cy={CENTRO} r={RAIO_INTERNO - 12} fill={hexAtual} />
          <circle
            cx={marcadorX}
            cy={marcadorY}
            r={6}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}
            pointerEvents="none"
          />
        </svg>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Área saturação (x) / brilho (y) */}
          <div
            ref={areaRef}
            role="slider"
            tabIndex={0}
            aria-label="Saturação e brilho da cor"
            aria-valuetext={hexAtual}
            className="relative h-24 rounded-xl border border-white/10 touch-none cursor-crosshair overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            style={{
              background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${hsv.h}, 100%, 50%)`,
            }}
            onPointerDown={(e) => iniciarArrasto(e, 'area')}
            onPointerMove={aoMover}
            onPointerUp={soltar}
          >
            <span
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.8)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: hexAtual,
              }}
            />
          </div>

          {/* Hex + pré-visualização */}
          <div className="flex items-center gap-2">
            <span
              className="w-9 h-9 rounded-lg shrink-0 border border-white/15"
              style={{ backgroundColor: hexAtual, boxShadow: `0 0 10px ${hexAtual}55` }}
              aria-hidden="true"
            />
            <InputHex valor={hexTexto} onChange={aoDigitarHex} />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">
        Gire a roleta para o matiz e ajuste intensidade/brilho — qualquer cor é aceita. Cole um
        código hex (ex.: <span className="font-mono text-zinc-400">#6366f1</span>) se preferir.
      </p>
    </div>
  )
}

/** Input hex com máscara leve (# + hex) e feedback de erro. */
const InputHex: React.FC<{ valor: string; onChange: (v: string) => void }> = ({
  valor,
  onChange,
}) => {
  const valido = !!hexParaHsv(valor)
  return (
    <div className="relative flex-1 min-w-0">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono pointer-events-none">
        #
      </span>
      <input
        type="text"
        value={valor.replace(/^#/, '')}
        onChange={(e) => onChange(`#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`)}
        placeholder="6366f1"
        maxLength={6}
        aria-label="Código hexadecimal da cor"
        className={cn(
          'w-full bg-[#151a2e] border rounded-md text-xs h-9 pl-7 pr-3 font-mono text-zinc-200 outline-none transition-colors',
          valido ? 'border-zinc-700/60 focus:border-indigo-500' : 'border-rose-500/60',
        )}
      />
    </div>
  )
}
