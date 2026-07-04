function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface BadgeSite { name: string; status: string; uptime: number }

export function getBadgeSvg(teamName: string, sites: BadgeSite[]): string {
  const down = sites.filter(s => s.status === 'DOWN')
  const up = sites.filter(s => s.status === 'UP')
  const status = down.length > 0 ? 'DOWN' : up.length > 0 ? 'UP' : 'PENDING'
  const color = status === 'UP' ? '#22c55e' : status === 'DOWN' ? '#ef4444' : '#f59e0b'
  const label = `KingX - ${esc(teamName)}`
  const value = `${down.length > 0 ? down.length + ' down' : 'all operational'}`
  const lw = label.length * 7 + 16
  const rw = value.length * 7 + 16
  const tw = lw + rw
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="${tw}" height="20" fill="#555"/>
  <rect rx="3" x="${lw}" width="${rw}" height="20" fill="${color}"/>
  <rect fill="url(#b)" width="${tw}" height="20"/>
  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="8" y="14">${esc(label)}</text>
    <text x="${lw + rw / 2}" y="14" text-anchor="middle">${esc(value)}</text>
  </g>
</svg>`
}
