import './style.css'
import { initTheme } from './theme.ts'
import { initEditor } from './editor.ts'
import { loadFromURL } from './url.ts'

initTheme()
const { setContent, showEncryptedScreen } = initEditor()

const result = loadFromURL()
if (result.encrypted) {
  showEncryptedScreen(result.data)
} else if (result.content) {
  setContent(result.content)
}
