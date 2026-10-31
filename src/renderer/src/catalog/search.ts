import type { ToolMeta } from './types'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (const ch of haystack) {
    if (ch === needle[i]) i++
    if (i === needle.length) return true
  }
  return needle.length === 0
}

function scoreField(token: string, field: string, weight: number): number {
  const f = normalize(field)
  if (f === token) return 100 * weight
  if (f.startsWith(token)) return 80 * weight
  if (f.split(/[^a-z0-9]+/).some((w) => w.startsWith(token))) return 60 * weight
  if (f.includes(token)) return 40 * weight
  if (token.length >= 2 && isSubsequence(token, f)) return 10 * weight
  return 0
}

function scoreToken(token: string, tool: ToolMeta): number {
  return Math.max(
    scoreField(token, tool.name, 3),
    scoreField(token, tool.id, 2),
    ...tool.keywords.map((k) => scoreField(token, k, 2)),
    scoreField(token, tool.category, 1.5),
    scoreField(token, tool.description, 1),
  )
}

/** Returns tools matching every whitespace-separated token, best match first. */
export function searchTools<T extends ToolMeta>(tools: readonly T[], query: string): T[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...tools]
  const scored: { tool: T; score: number; index: number }[] = []
  tools.forEach((tool, index) => {
    let total = 0
    for (const token of tokens) {
      const s = scoreToken(token, tool)
      if (s === 0) return
      total += s
    }
    scored.push({ tool, score: total, index })
  })
  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  return scored.map((s) => s.tool)
}
