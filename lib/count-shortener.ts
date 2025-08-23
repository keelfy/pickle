export const getShortenedCount = (count: number) => {
  if (count === 0) return '0'
  if (count < 1000) return count
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  if (count < 1000000) return `${(count / 1000).toFixed(0)}k`
  return `${(count / 1000000).toFixed(1)}M`
}
