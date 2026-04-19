"use client"

import { useEffect, useRef } from "react"

export function AnimatedGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let mouseX = 0
    let mouseY = 0
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const draw = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gridSize = 60
      const cols = Math.ceil(canvas.width / gridSize) + 1
      const rows = Math.ceil(canvas.height / gridSize) + 1

      // Draw grid lines with depth effect
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * gridSize
          const y = j * gridSize

          // Calculate distance from mouse for depth effect
          const dx = x - mouseX
          const dy = y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 300
          const intensity = Math.max(0, 1 - distance / maxDistance)

          // Draw intersection points with glow
          const pointSize = 1 + intensity * 3
          const alpha = 0.1 + intensity * 0.4 + Math.sin(time + i * 0.1 + j * 0.1) * 0.05

          // Create gradient for depth
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointSize * 4)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
          gradient.addColorStop(0.5, `rgba(200, 200, 200, ${alpha * 0.3})`)
          gradient.addColorStop(1, "rgba(150, 150, 150, 0)")

          ctx.beginPath()
          ctx.arc(x, y, pointSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.fill()

          // Glow effect
          if (intensity > 0.3) {
            ctx.beginPath()
            ctx.arc(x, y, pointSize * 4, 0, Math.PI * 2)
            ctx.fillStyle = gradient
            ctx.fill()
          }
        }
      }

      // Draw horizontal lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
      ctx.lineWidth = 1
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath()
        ctx.moveTo(0, j * gridSize)
        ctx.lineTo(canvas.width, j * gridSize)
        ctx.stroke()
      }

      // Draw vertical lines
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath()
        ctx.moveTo(i * gridSize, 0)
        ctx.lineTo(i * gridSize, canvas.height)
        ctx.stroke()
      }

      // Add subtle moving highlight beams
      const beamCount = 3
      for (let b = 0; b < beamCount; b++) {
        const beamTime = time * 0.3 + (b * Math.PI * 2) / beamCount
        const beamX = (Math.sin(beamTime) * 0.5 + 0.5) * canvas.width
        const beamY = (Math.cos(beamTime * 0.7) * 0.5 + 0.5) * canvas.height

        const beamGradient = ctx.createRadialGradient(
          beamX,
          beamY,
          0,
          beamX,
          beamY,
          200
        )
        beamGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)")
        beamGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.02)")
        beamGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.beginPath()
        ctx.arc(beamX, beamY, 200, 0, Math.PI * 2)
        ctx.fillStyle = beamGradient
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", handleMouseMove)
    draw()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  )
}
