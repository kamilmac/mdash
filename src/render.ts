import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const rendered = document.getElementById('rendered')!
const emptyState = document.getElementById('emptyState')!

export function renderMarkdown(md: string): void {
  if (!md || !md.trim()) {
    rendered.innerHTML = ''
    rendered.style.display = 'none'
    emptyState.style.display = 'flex'
    return
  }
  emptyState.style.display = 'none'
  rendered.style.display = 'block'
  rendered.innerHTML = marked.parse(md) as string
  rendered.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })
}
