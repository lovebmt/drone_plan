import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { access, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
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

const slideCount = await countSlides(slidesPath)

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
  const lines = source.split(/\r?\n/)
  let inFence = false
  let frontmatterEnded = false
  let slideCount = 0
  let currentHasContent = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!frontmatterEnded) {
      if (line === '---') frontmatterEnded = true
      continue
    }

    if (line.startsWith('```')) {
      inFence = !inFence
      currentHasContent = true
      continue
    }

    if (!inFence && line === '---') {
      if (currentHasContent) {
        slideCount += 1
        currentHasContent = false
      }
      continue
    }

    if (line.length > 0) currentHasContent = true
  }

  if (currentHasContent) slideCount += 1
  return slideCount
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
