import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { access, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const slidesPath = path.join(rootDir, 'slides.md')
const distPagesDir = path.join(rootDir, 'dist-pages')
const outputDir = path.join(rootDir, 'dist', 'rendered-images')
const basePath = '/drone_plan'
const host = '127.0.0.1'
const port = 4173
const viewport = { width: 1600, height: 900 }
let slideCount = 0

await mkdir(outputDir, { recursive: true })
await clearOutput(outputDir)

const server = await startStaticServer({ rootDir: distPagesDir, basePath, host, port })

try {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: 'light',
  })

  const page = await context.newPage()
  slideCount = await countSlides(slidesPath)

  for (let slide = 1; slide <= slideCount; slide += 1) {
    const url = `http://${host}:${port}${basePath}/#/${slide}`
    const outputPath = path.join(outputDir, `slide-${String(slide).padStart(2, '0')}.png`)

    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })
    await page.addStyleTag({
      content: `
        * {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        nav,
        .slidev-controls,
        .slidev-nav-controls,
        .slidev-open-in-editor,
        .slidev-code-copy,
        .slidev-icon-btn,
        #slidev-goto-dialog,
        #page-root::before,
        #page-root::after {
          display: none !important;
        }
        html, body {
          cursor: none !important;
        }
      `,
    })
    await page.waitForTimeout(500)
    await page.locator('.slidev-slide-content').first().screenshot({ path: outputPath })
    console.log(`Captured ${path.relative(rootDir, outputPath)}`)
  }

  await browser.close()
} finally {
  await server.close()
}

console.log(`Rendered ${slideCount} slide images into ${outputDir}`)

async function clearOutput(dir) {
  const files = await readdir(dir)
  await Promise.all(
    files
      .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
      .map((file) => rm(path.join(dir, file), { force: true })),
  )
}

async function countSlides(filePath) {
  const source = await readFile(filePath, 'utf8')
  const chunks = splitSlideChunks(source)
  const hasDocumentFrontmatter = source.trimStart().startsWith('---') && chunks[0]?.trim() === ''
  let index = hasDocumentFrontmatter ? 2 : 0
  let total = 0

  while (index < chunks.length) {
    const chunk = chunks[index]?.trim() ?? ''

    if (!chunk) {
      index += 1
      continue
    }

    if (isLikelyFrontmatter(chunk) && index + 1 < chunks.length) {
      total += 1
      index += 2
      continue
    }

    total += 1
    index += 1
  }

  return total
}

function splitSlideChunks(source) {
  const lines = source.split(/\r?\n/)
  const chunks = []
  const current = []
  let inFence = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      inFence = !inFence
    }

    if (!inFence && trimmed === '---') {
      chunks.push(current.join('\n'))
      current.length = 0
      continue
    }

    current.push(line)
  }

  chunks.push(current.join('\n'))
  return chunks
}

function isLikelyFrontmatter(chunk) {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)

  if (!lines.length) return false

  return lines.every((line) => {
    const trimmed = line.trim()
    return /^[A-Za-z0-9_-]+:/.test(trimmed)
      || /^-\s+/.test(trimmed)
      || /^[A-Za-z0-9_-]+\s*:$/.test(trimmed)
      || /^[A-Za-z0-9_-]+\s*:\s*$/.test(trimmed)
      || /^[A-Za-z0-9_-]+\s*:\s+.+$/.test(trimmed)
      || /^[A-Za-z0-9_-]+\s*:\s*(true|false|null|\d+(\.\d+)?)$/i.test(trimmed)
      || /^[\s]+[A-Za-z0-9_-]+:/.test(line)
  })
}

async function startStaticServer({ rootDir, basePath, host, port }) {
  await access(rootDir)

  const mimeTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'application/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webp', 'image/webp'],
    ['.json', 'application/json; charset=utf-8'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2'],
  ])

  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '/', `http://${host}:${port}`)
      let pathname = decodeURIComponent(requestUrl.pathname)

      if (!pathname.startsWith(basePath)) {
        res.writeHead(302, { Location: `${basePath}/` })
        res.end()
        return
      }

      pathname = pathname.slice(basePath.length) || '/'
      let filePath = path.join(rootDir, pathname)

      if (pathname.endsWith('/')) {
        filePath = path.join(rootDir, pathname, 'index.html')
      }

      let fileStats
      try {
        fileStats = await stat(filePath)
      } catch {
        filePath = path.join(rootDir, 'index.html')
        fileStats = await stat(filePath)
      }

      if (fileStats.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }

      const contentType = mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType })
      createReadStream(filePath).pipe(res)
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(error instanceof Error ? error.message : 'Server error')
    }
  })

  await new Promise((resolve, reject) => {
    server.listen(port, host, resolve)
    server.on('error', reject)
  })

  return {
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      }),
  }
}
