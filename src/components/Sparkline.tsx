interface Props {
  data: number[]
  width?: number
  height?: number
}

export default function Sparkline({ data, width = 60, height = 24 }: Props) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(((max - v) / range) * height).toFixed(1)}`)
    .join(' ')

  const isUp = data[data.length - 1] >= data[0]
  const strokeColor = isUp ? '#10b981' : '#f43f5e'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function generateSparklineData(): number[] {
  let price = 100 + Math.random() * 200
  const volatility = price * 0.015
  return Array.from({ length: 24 }, () => {
    price += (Math.random() - 0.48) * volatility
    return +price.toFixed(2)
  })
}
