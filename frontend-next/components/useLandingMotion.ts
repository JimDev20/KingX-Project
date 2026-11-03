'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect, type RefObject } from 'react'

gsap.registerPlugin(ScrollTrigger)

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let active = true

      gsap.utils.toArray<HTMLElement>('[data-reveal]', root).forEach((element) => {
        const delay = Number.parseFloat(getComputedStyle(element).getPropertyValue('--reveal-delay')) / 1000 || 0

        gsap.fromTo(element, {
          opacity: 0.8,
          y: 24,
          scale: 0.992,
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            once: true,
          },
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-timeline]', root).forEach((timeline) => {
        const bars = Array.from(timeline.children) as HTMLElement[]

        gsap.fromTo(bars, {
          scaleY: 0.2,
          opacity: 0.4,
        }, {
          scaleY: 1,
          opacity: 1,
          duration: 0.5,
          delay: timeline.closest('[data-reveal]') ? 0.08 : 0.3,
          stagger: 0.012,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 92%',
            once: true,
          },
        })
      })

      const refresh = () => ScrollTrigger.refresh()
      const refreshFrame = requestAnimationFrame(refresh)

      window.addEventListener('load', refresh)
      document.fonts.ready.then(() => {
        if (active) refresh()
      }).catch(() => {})

      return () => {
        active = false
        cancelAnimationFrame(refreshFrame)
        window.removeEventListener('load', refresh)
      }
    })

    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const lenis = new Lenis({
        autoRaf: false,
        lerp: 0.09,
        syncTouch: false,
        anchors: true,
        stopInertiaOnNavigate: true,
      })

      const unsubscribe = lenis.on('scroll', ScrollTrigger.update)
      const update = (time: number) => lenis.raf(time * 1000)

      gsap.ticker.add(update)
      gsap.ticker.lagSmoothing(0)

      return () => {
        unsubscribe()
        gsap.ticker.remove(update)
        lenis.destroy()
      }
    })

    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const scene = root.querySelector<HTMLElement>('[data-hero-scene]')
      const tilt = root.querySelector<HTMLElement>('[data-hero-tilt]')
      if (!scene || !tilt) return

      const baseX = 2
      const baseY = -3
      const rotateX = gsap.quickTo(tilt, 'rotationX', { duration: 0.7, ease: 'power3.out' })
      const rotateY = gsap.quickTo(tilt, 'rotationY', { duration: 0.7, ease: 'power3.out' })

      const move = (event: PointerEvent) => {
        const rect = scene.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        const x = gsap.utils.clamp(-1, 1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)
        const y = gsap.utils.clamp(-1, 1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)

        rotateX(baseX - y * 3)
        rotateY(baseY + x * 4)
      }

      const reset = () => {
        rotateX(baseX)
        rotateY(baseY)
      }

      scene.addEventListener('pointermove', move)
      scene.addEventListener('pointerleave', reset)

      return () => {
        scene.removeEventListener('pointermove', move)
        scene.removeEventListener('pointerleave', reset)
        gsap.killTweensOf(tilt)
      }
    })

    return () => mm.revert()
  }, [rootRef])
}
