'use client'

import { useEffect, useRef, type RefObject } from 'react'

export type SignalRange = '24h' | '7d' | '30d'

type SignalTheme = 'dark' | 'light'

function noise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function useSignalField(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  theme: SignalTheme,
  range: SignalRange,
  inverted = false,
) {
  const themeRef = useRef(theme)
  const rangeRef = useRef(range)
  const invertedRef = useRef(inverted)
  const drawRef = useRef<() => void>(() => {})

  useEffect(() => {
    themeRef.current = theme
    drawRef.current()
  }, [theme])

  useEffect(() => {
    invertedRef.current = inverted
    drawRef.current()
  }, [inverted])

  useEffect(() => {
    rangeRef.current = range
    drawRef.current()
  }, [range])

  useEffect(() => {
    const canvas = canvasRef.current
    const surface = canvas?.parentElement
    if (!canvas || !surface) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarseQuery = window.matchMedia('(hover: none), (pointer: coarse)')
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, tpx: 0, tpy: 0, active: false }
    let width = 0
    let height = 0
    let elapsed = 0
    let pulseAge = 10
    let pulseX = 0
    let pulseY = 0
    let running = false
    let visible = true
    let scrolling = false
    let scrollTimer = 0
    let frameId = 0
    let last = performance.now()

    const project = (s: number, v: number) => {
      const edge = Math.cos(s * Math.PI * 0.5)
      const mode = rangeRef.current
      let wave = 0

      if (mode === '24h') {
        wave = Math.sin(s * 2.3 + elapsed * 0.35) * 0.55 + Math.sin(s * 5.1 - elapsed * 0.2) * 0.16
      } else if (mode === '7d') {
        wave = Math.sin(s * 3.3 + elapsed * 0.55) * 0.5 + Math.sin(s * 8.2 - elapsed * 0.7) * 0.16
      } else {
        wave = Math.sin(s * 2.1 + elapsed * 0.3) * 0.48 + Math.sin(s * 6.8 - elapsed * 0.4) * 0.14
        wave += Math.exp(-Math.pow((s + 0.18) * 7, 2)) * 1.3
        wave -= Math.exp(-Math.pow((s - 0.46) * 10, 2)) * 0.72
      }

      const amplitude = mode === '24h' ? 0.16 : mode === '7d' ? 0.2 : 0.24
      const x = s * width * 0.47 + Math.sin(s * 2.2 + elapsed * 0.15) * 18 + pointer.x * width * 0.012
      const y = wave * height * amplitude + v * height * (0.025 + edge * 0.13) + pointer.y * height * 0.008
      const z = Math.sin(s * 2.6 + elapsed * 0.2) * 100 + v * 90 * edge
      const rotateY = pointer.x * 0.14 + Math.sin(elapsed * 0.12) * 0.03
      const rotateX = -0.1 + pointer.y * 0.06
      const xr = x * Math.cos(rotateY) - z * Math.sin(rotateY)
      const zr = x * Math.sin(rotateY) + z * Math.cos(rotateY)
      const yr = y * Math.cos(rotateX) - zr * Math.sin(rotateX)
      const zf = y * Math.sin(rotateX) + zr * Math.cos(rotateX)
      const scale = clamp(1 / (1 + zf / 1600), 0.55, 1.45)

      return { sx: width * 0.52 + xr * scale, sy: height * 0.52 + yr * scale, scale, edge }
    }

    const draw = () => {
      if (!width || !height) return

      const darkSurface = invertedRef.current ? themeRef.current === 'light' : themeRef.current === 'dark'
      const ink = darkSurface ? '240, 244, 248' : '10, 12, 15'
      const red = darkSurface ? '255, 118, 108' : '180, 35, 24'
      const mode = rangeRef.current

      ctx.clearRect(0, 0, width, height)

      const gridStepX = Math.max(64, width / 16)
      const gridStepY = Math.max(64, height / 9)
      ctx.fillStyle = `rgba(${ink}, ${darkSurface ? 0.04 : 0.05})`
      for (let x = gridStepX; x < width; x += gridStepX) ctx.fillRect(x, 0, 1, height)
      for (let y = gridStepY; y < height; y += gridStepY) ctx.fillRect(0, y, width, 1)

      ctx.lineWidth = 1
      for (const offset of [-0.6, 0, 0.6]) {
        ctx.beginPath()
        for (let index = 0; index <= 90; index += 1) {
          const s = (index / 90) * 2 - 1
          const point = project(s, offset)
          if (index === 0) ctx.moveTo(point.sx, point.sy)
          else ctx.lineTo(point.sx, point.sy)
        }
        ctx.strokeStyle = `rgba(${ink}, ${offset === 0 ? 0.11 : 0.045})`
        ctx.stroke()
      }

      const count = clamp(Math.round((width * height) / 700), 700, 1800)
      ctx.fillStyle = `rgba(${ink}, 1)`

      for (let index = 0; index < count; index += 1) {
        const s = noise(index + 3) * 2 - 1
        const v = noise(index + 50021) * 2 - 1
        const point = project(s, v)
        let x = point.sx
        let y = point.sy
        let alpha = (0.06 + point.edge * 0.13 + noise(index + 7) * 0.3) * (0.68 + point.scale * 0.32)
        let color = ink

        if (pointer.active) {
          const dx = x - pointer.px
          const dy = y - pointer.py
          const distance = Math.hypot(dx, dy)
          if (distance < 160) {
            const force = 1 - distance / 160
            x += (dx / (distance || 1)) * force * force * 26
            y += (dy / (distance || 1)) * force * force * 26
            alpha += force * 0.2
          }
        }

        if (pulseAge < 1.15) {
          const radius = pulseAge * Math.min(width, height) * 0.7
          const dx = x - pulseX
          const dy = y - pulseY
          const distance = Math.hypot(dx, dy)
          const ring = Math.abs(distance - radius)
          if (ring < 26) {
            const strength = 1 - pulseAge / 1.15
            const force = (1 - ring / 26) * strength
            x += (dx / (distance || 1)) * force * 20
            y += (dy / (distance || 1)) * force * 20
            alpha += force * 0.35
          }
        }

        if (mode === '30d') {
          const incident = Math.exp(-Math.pow((s + 0.18) * 7, 2)) + Math.exp(-Math.pow((s - 0.46) * 10, 2))
          if (incident > 0.55 && noise(index + 99) > 0.5) {
            color = red
            alpha += 0.16
          }
        }

        if (index % 23 === 0) alpha += 0.18

        ctx.globalAlpha = clamp(alpha, 0.03, 0.85)
        if (color !== ink) ctx.fillStyle = `rgba(${color}, 1)`
        const size = point.edge > 0.62 && noise(index + 13) > 0.86 ? 2 : 1
        ctx.fillRect(x, y, size, size)
        if (color !== ink) ctx.fillStyle = `rgba(${ink}, 1)`
      }

      ctx.globalAlpha = 1
    }

    drawRef.current = draw

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const area = rect.width * rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, area > 900_000 ? 1.5 : 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    const start = () => {
      if (running || motionQuery.matches) return
      running = true
      last = performance.now()
      frameId = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(frameId)
    }

    const tick = (now: number) => {
      if (!running) return
      const delta = Math.min(48, now - last)
      last = now

      if (!scrolling) {
        elapsed += delta * 0.001
        pointer.x += (pointer.tx - pointer.x) * 0.08
        pointer.y += (pointer.ty - pointer.y) * 0.08
        pointer.px += (pointer.tpx - pointer.px) * 0.16
        pointer.py += (pointer.tpy - pointer.py) * 0.16
        if (pulseAge < 1.15) pulseAge += delta * 0.001
        draw()
      }

      if (running) frameId = requestAnimationFrame(tick)
    }

    const move = (event: PointerEvent) => {
      if (motionQuery.matches || event.pointerType === 'touch') return
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.tx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1)
      pointer.ty = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1)
      pointer.tpx = event.clientX - rect.left
      pointer.tpy = event.clientY - rect.top
      pointer.active = true
    }

    const leave = () => {
      pointer.tx = 0
      pointer.ty = 0
      pointer.active = false
    }

    const onScroll = () => {
      if (!coarseQuery.matches) return
      leave()
      pulseAge = 10
      scrolling = true
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        scrolling = false
      }, 140)
    }

    const press = (event: PointerEvent) => {
      if (motionQuery.matches) return
      const target = event.target as HTMLElement | null
      if (target?.closest('button, a')) return
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      if (event.pointerType === 'touch') {
        pointer.tx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1)
        pointer.ty = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1)
        pointer.tpx = event.clientX - rect.left
        pointer.tpy = event.clientY - rect.top
        pointer.active = true
      }

      pulseX = event.clientX - rect.left
      pulseY = event.clientY - rect.top
      pulseAge = 0
    }

    const release = (event: PointerEvent) => {
      if (event.pointerType === 'touch') leave()
    }

    const onMotionChange = () => {
      if (motionQuery.matches) {
        stop()
        draw()
      } else if (visible) {
        start()
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    }, { threshold: 0.01 })

    intersection.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    motionQuery.addEventListener('change', onMotionChange)
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerdown', press, { passive: true })
    surface.addEventListener('pointerup', release, { passive: true })
    surface.addEventListener('pointercancel', release, { passive: true })
    surface.addEventListener('pointerleave', leave, { passive: true })

    resize()
    start()

    return () => {
      stop()
      window.clearTimeout(scrollTimer)
      observer.disconnect()
      intersection.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      motionQuery.removeEventListener('change', onMotionChange)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerdown', press)
      surface.removeEventListener('pointerup', release)
      surface.removeEventListener('pointercancel', release)
      surface.removeEventListener('pointerleave', leave)
      drawRef.current = () => {}
    }
  }, [canvasRef])
}
