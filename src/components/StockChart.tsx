import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import type { CandleData } from '../types'

interface Props {
  data: CandleData[]
  height?: number
}

export default function StockChart({ data, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const container = containerRef.current
    const chart = createChart(container, {
      layout: {
        background: { color: '#09090b' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#3f3f46', width: 1, style: 2, labelBackgroundColor: '#27272a' },
        horzLine: { color: '#3f3f46', width: 1, style: 2, labelBackgroundColor: '#27272a' },
      },
      rightPriceScale: {
        borderColor: '#27272a',
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: false,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height,
    })

    const series = chart.addSeries(
      CandlestickSeries,
      {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      }
    )

    series.setData(
      data.map((d) => ({
        time: d.time as import('lightweight-charts').Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth })
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border border-zinc-800 rounded">
        <span className="text-zinc-600 text-sm">No chart data available</span>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" />
}
