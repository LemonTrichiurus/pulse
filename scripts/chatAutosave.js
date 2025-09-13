// Simple chat autosave utility
// Usage: npm run chat:autosave
// Config via env vars:
//   AUTOSAVE_INTERVAL_MINUTES (default 3)
//   CHAT_SOURCE (default ./supabase/.temp/chat-source.md)
//   CHAT_LOG_DIR (default ./supabase/.temp/chat-logs)

const fs = require('fs')
const path = require('path')

const INTERVAL_MIN = parseFloat(process.env.AUTOSAVE_INTERVAL_MINUTES || '3')
const SOURCE = path.resolve(process.env.CHAT_SOURCE || './supabase/.temp/chat-source.md')
const LOG_DIR = path.resolve(process.env.CHAT_LOG_DIR || './supabase/.temp/chat-logs')

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

ensureDir(path.dirname(SOURCE))
ensureDir(LOG_DIR)

let lastHash = ''

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h.toString(16)
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${y}${m}${day}-${hh}${mm}${ss}`
}

function saveSnapshot() {
  let content = ''
  try {
    if (fs.existsSync(SOURCE)) {
      content = fs.readFileSync(SOURCE, 'utf8')
    }
  } catch (e) {
    console.error('[chat-autosave] Failed to read source file:', e.message)
    return
  }

  if (!content || !content.trim()) {
    console.log('[chat-autosave] Source empty, skip')
    return
  }

  const currentHash = hash(content)
  if (currentHash === lastHash) {
    console.log('[chat-autosave] No changes since last save, skip')
    return
  }

  const fileName = `chat-${timestamp()}.md`
  const outPath = path.join(LOG_DIR, fileName)

  try {
    fs.writeFileSync(outPath, content, 'utf8')
    fs.writeFileSync(path.join(LOG_DIR, 'chat-latest.md'), content, 'utf8')
    lastHash = currentHash
    console.log(`[chat-autosave] Saved snapshot -> ${outPath}`)
  } catch (e) {
    console.error('[chat-autosave] Failed to write snapshot:', e.message)
  }
}

console.log('[chat-autosave] Running...')
saveSnapshot()
const intervalMs = Math.max(1, Math.floor(INTERVAL_MIN * 60 * 1000))
setInterval(saveSnapshot, intervalMs)