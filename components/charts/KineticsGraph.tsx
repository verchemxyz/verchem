'use client'

import { useRef, useEffect, useMemo } from 'react'

// ============================================
// Types
// ============================================
type RateOrder = 'zero' | 'first' | 'second'

interface KineticsGraphProps {
  order: RateOrder
  initialConc: number
  k: number
  maxTime: number
  highlightTime?: number
  width?: number
  height?: number
}

// ============================================
// Kinetics Graph Component
// ============================================
export default function KineticsGraph({
  order,
  initialConc,
  k,
  maxTime,
  highlightTime,
  width = 500,
  height = 300,
}: KineticsGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate concentration at time t
  const getConcentration = useMemo(() => {
    return (t: number): number => {
      if (t < 0) return initialConc

      switch (order) {
        case 'zero':
          const zeroConc = initialConc - k * t
          return Math.max(0, zeroConc)
        case 'first':
          return initialConc * Math.exp(-k * t)
        case 'second':
          return initialConc / (1 + k * initialConc * t)
        default:
          return initialConc
      }
    }
  }, [order, initialConc, k])

  // Calculate half-life
  const halfLife = useMemo(() => {
    switch (order) {
      case 'zero':
        return initialConc / (2 * k)
      case 'first':
        return Math.log(2) / k
      case 'second':
        return 1 / (k * initialConc)
      default:
        return 0
    }
  }, [order, initialConc, k])

  // Generate data points
  const dataPoints = useMemo(() => {
    const points: { t: number; conc: number }[] = []
    const numPoints = 100

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * maxTime
      const conc = getConcentration(t)
      if (conc >= 0) {
        points.push({ t, conc })
      }
    }

    return points
  }, [getConcentration, maxTime])

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Margins
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom

    // Clear canvas
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, width, height)

    // Find max concentration for y-axis
    const maxConc = initialConc * 1.1

    // Scale functions
    const scaleX = (t: number) => margin.left + (t / maxTime) * plotWidth
    const scaleY = (conc: number) => margin.top + plotHeight - (conc / maxConc) * plotHeight

    // Draw grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1

    // Vertical grid lines
    const xTicks = 5
    for (let i = 0; i <= xTicks; i++) {
      const x = margin.left + (i / xTicks) * plotWidth
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + plotHeight)
      ctx.stroke()
    }

    // Horizontal grid lines
    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + (i / yTicks) * plotHeight
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + plotWidth, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + plotHeight)
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + plotHeight)
    ctx.stroke()

    // Draw half-life line if within range
    if (halfLife <= maxTime && halfLife > 0) {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      const halfLifeX = scaleX(halfLife)
      const halfConcY = scaleY(initialConc / 2)

      // Vertical line at half-life
      ctx.beginPath()
      ctx.moveTo(halfLifeX, margin.top + plotHeight)
      ctx.lineTo(halfLifeX, halfConcY)
      ctx.stroke()

      // Horizontal line at half concentration
      ctx.beginPath()
      ctx.moveTo(margin.left, halfConcY)
      ctx.lineTo(halfLifeX, halfConcY)
      ctx.stroke()

      ctx.setLineDash([])

      // Half-life label
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`t½ = ${halfLife.toFixed(1)}s`, halfLifeX, margin.top - 10)
    }

    // Draw concentration curve
    ctx.strokeStyle = order === 'zero' ? '#3b82f6' : order === 'first' ? '#10b981' : '#8b5cf6'
    ctx.lineWidth = 3
    ctx.setLineDash([])

    ctx.beginPath()
    dataPoints.forEach((point, i) => {
      const x = scaleX(point.t)
      const y = scaleY(point.conc)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Highlight point if time specified
    if (highlightTime !== undefined && highlightTime >= 0 && highlightTime <= maxTime) {
      const highlightConc = getConcentration(highlightTime)
      const hx = scaleX(highlightTime)
      const hy = scaleY(highlightConc)

      // Vertical dashed line
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(hx, margin.top + plotHeight)
      ctx.lineTo(hx, hy)
      ctx.stroke()

      // Horizontal dashed line
      ctx.beginPath()
      ctx.moveTo(margin.left, hy)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.setLineDash([])

      // Point marker
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, Math.PI * 2)
      ctx.fill()

      // Value label
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`[A] = ${highlightConc.toFixed(4)} M`, hx + 10, hy - 10)
    }

    // Axis labels
    ctx.fillStyle = '#475569'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'

    // X-axis label
    ctx.fillText('Time (s)', margin.left + plotWidth / 2, height - 10)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(15, margin.top + plotHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('[A] (M)', 0, 0)
    ctx.restore()

    // Axis tick labels
    ctx.font = '12px Arial'
    ctx.fillStyle = '#64748b'

    // X-axis ticks
    ctx.textAlign = 'center'
    for (let i = 0; i <= xTicks; i++) {
      const t = (i / xTicks) * maxTime
      const x = margin.left + (i / xTicks) * plotWidth
      ctx.fillText(t.toFixed(0), x, margin.top + plotHeight + 20)
    }

    // Y-axis ticks
    ctx.textAlign = 'right'
    for (let i = 0; i <= yTicks; i++) {
      const conc = ((yTicks - i) / yTicks) * maxConc
      const y = margin.top + (i / yTicks) * plotHeight
      ctx.fillText(conc.toFixed(2), margin.left - 10, y + 4)
    }

    // Title
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    const orderLabel = order.charAt(0).toUpperCase() + order.slice(1)
    ctx.fillText(`${orderLabel} Order Reaction`, margin.left, 20)

    // Legend
    const legendX = margin.left + plotWidth - 150
    const legendY = margin.top + 10

    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillRect(legendX - 5, legendY - 5, 160, 45)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(legendX - 5, legendY - 5, 160, 45)

    // Curve color
    ctx.fillStyle = order === 'zero' ? '#3b82f6' : order === 'first' ? '#10b981' : '#8b5cf6'
    ctx.fillRect(legendX, legendY, 20, 3)
    ctx.fillStyle = '#475569'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`[A] vs time`, legendX + 25, legendY + 5)

    // Half-life color
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(legendX, legendY + 20, 20, 3)
    ctx.fillStyle = '#475569'
    ctx.fillText(`Half-life (t½)`, legendX + 25, legendY + 25)

  }, [dataPoints, order, initialConc, maxTime, halfLife, highlightTime, width, height, getConcentration])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="rounded-lg"
      />
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Order:</span>{' '}
          <span className="text-blue-600">{order}</span>
        </div>
        <div>
          <span className="font-medium">[A]₀:</span>{' '}
          <span className="text-green-600">{initialConc} M</span>
        </div>
        <div>
          <span className="font-medium">k:</span>{' '}
          <span className="text-purple-600">{k.toExponential(3)}</span>
        </div>
        <div>
          <span className="font-medium">t½:</span>{' '}
          <span className="text-orange-600">{halfLife.toFixed(2)} s</span>
        </div>
      </div>
    </div>
  )
}
