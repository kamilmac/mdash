import { renderMarkdown } from './render.ts'
import { updateURL } from './url.ts'
import { decryptContent } from './crypto.ts'

const DEBOUNCE_MS = 2000

const $ = (s: string) => document.getElementById(s)!

export interface EditorAPI {
  setContent(content: string): void
  showEncryptedScreen(encData: string): void
}

export function initEditor(): EditorAPI {
  const editor = $('editor') as HTMLTextAreaElement
  const sidebar = $('sidebar')
  const overlay = $('overlay')
  const charCount = $('charCount')
  const encStatus = $('encStatus')
  const toast = $('toast')
  const lockBtn = $('lockBtn')
  const passwordInline = $('passwordInline')
  const encPasswordInput = $('encPasswordInput') as HTMLInputElement

  let encryptionActive = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let savedTimer: ReturnType<typeof setTimeout> | null = null

  // --- Sidebar ---
  function openSidebar(): void {
    sidebar.classList.add('open')
    overlay.classList.add('open')
    document.body.classList.add('sidebar-open')
    editor.focus()
  }
  function closeSidebar(): void {
    sidebar.classList.remove('open')
    overlay.classList.remove('open')
    document.body.classList.remove('sidebar-open')
  }
  sidebar.removeAttribute('hidden')
  $('menuBtn').addEventListener('click', openSidebar)
  $('closeBtn').addEventListener('click', closeSidebar)
  overlay.addEventListener('click', closeSidebar)

  // --- Lock toggle ---
  function getEncryptionPassword(): string | null {
    if (!encryptionActive) return null
    return encPasswordInput.value || null
  }

  lockBtn.addEventListener('click', () => {
    encryptionActive = !encryptionActive
    lockBtn.classList.toggle('active', encryptionActive)
    passwordInline.classList.toggle('visible', encryptionActive)
    if (encryptionActive) {
      encPasswordInput.focus()
    } else {
      encPasswordInput.value = ''
      updateURL(editor.value, getEncryptionPassword)
    }
  })

  $('eyeBtn').addEventListener('click', () => {
    encPasswordInput.type = encPasswordInput.type === 'password' ? 'text' : 'password'
  })

  encPasswordInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => updateURL(editor.value, getEncryptionPassword), DEBOUNCE_MS)
  })

  // --- Editor input ---
  editor.addEventListener('input', () => {
    const content = editor.value
    charCount.textContent = content.length.toLocaleString() + ' chars'
    encStatus.textContent = '···'
    if (savedTimer) clearTimeout(savedTimer)
    renderMarkdown(content)
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      await updateURL(content, getEncryptionPassword)
      encStatus.textContent = '✓'
      savedTimer = setTimeout(() => { encStatus.textContent = '' }, 1500)
    }, DEBOUNCE_MS)
  })

  // --- Copy link ---
  function showToast(msg: string): void {
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2000)
  }

  $('copyBtn').addEventListener('click', () => {
    if (!window.location.hash) {
      showToast('Nothing to copy — start writing first')
      return
    }
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied!')
    }).catch(() => {
      showToast('Failed to copy')
    })
  })

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar()
    }
  })

  // --- Encrypted landing screen ---
  function showEncryptedScreen(encData: string): void {
    const screen = $('encryptedScreen')
    const input = $('decryptInput') as HTMLInputElement
    const errorMsg = $('decryptError')

    screen.style.display = 'flex'
    document.querySelector<HTMLElement>('.content')!.style.display = 'none'
    document.querySelector<HTMLElement>('.icon-left')!.style.display = 'none'
    document.querySelector<HTMLElement>('.icon-right')!.style.display = 'none'

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || !input.value) return
      errorMsg.textContent = ''
      try {
        const password = input.value
        const plaintext = await decryptContent(encData, password)
        screen.style.display = 'none'
        document.querySelector<HTMLElement>('.content')!.style.display = ''
        document.querySelector<HTMLElement>('.icon-left')!.style.display = ''
        document.querySelector<HTMLElement>('.icon-right')!.style.display = ''
        encryptionActive = true
        lockBtn.classList.add('active')
        passwordInline.classList.add('visible')
        encPasswordInput.value = password
        editor.value = plaintext
        charCount.textContent = plaintext.length.toLocaleString() + ' chars'
        renderMarkdown(plaintext)
        $('rendered').classList.add('reveal')
      } catch {
        input.classList.remove('shake')
        void input.offsetWidth
        input.classList.add('shake')
        errorMsg.textContent = 'Wrong password'
        input.value = ''
      }
    })
    setTimeout(() => input.focus(), 100)
  }

  return {
    setContent(content: string): void {
      editor.value = content
      charCount.textContent = content.length.toLocaleString() + ' chars'
      renderMarkdown(content)
      $('rendered').classList.add('reveal')
    },
    showEncryptedScreen,
  }
}
