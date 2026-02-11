import { readFileSync, writeFileSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const dist = join(import.meta.dir, '..', 'dist')
const assetsDir = join(dist, 'assets')

let html = readFileSync(join(dist, 'index.html'), 'utf-8')

// Inline CSS
for (const file of readdirSync(assetsDir).filter(f => f.endsWith('.css'))) {
  const css = readFileSync(join(assetsDir, file), 'utf-8')
  html = html.replace(
    new RegExp(`<link[^>]+href="[^"]*${file}"[^>]*>`),
    `<style>${css}</style>`
  )
}

// Inline JS
for (const file of readdirSync(assetsDir).filter(f => f.endsWith('.js'))) {
  const js = readFileSync(join(assetsDir, file), 'utf-8')
  html = html.replace(
    new RegExp(`<script[^>]+src="[^"]*${file}"[^>]*></script>`),
    `<script type="module">${js}</script>`
  )
}

writeFileSync(join(dist, 'index.html'), html)
rmSync(assetsDir, { recursive: true })

const size = Buffer.byteLength(html)
console.log(`dist/index.html  ${(size / 1024).toFixed(1)} kB`)
