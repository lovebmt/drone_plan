import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const inputDir = path.resolve(process.argv[2] || path.join(rootDir, 'dist', 'rendered-images'))
const outputFile = path.resolve(process.argv[3] || path.join(rootDir, 'dist', 'UAV-Manufacturing-Complex.pdf'))

const files = (await readdir(inputDir))
  .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

if (!files.length) {
  throw new Error(`No slide images found in ${inputDir}`)
}

const firstImage = path.join(inputDir, files[0])
const { width, height } = await getImageSize(firstImage)

const pages = await Promise.all(files.map(async (file) => {
  const absolutePath = path.join(inputDir, file)
  const imageBuffer = await readFile(absolutePath)
  const mimeType = getMimeType(file)
  return `\n<section class="page"><img src="data:${mimeType};base64,${imageBuffer.toString('base64')}" alt="${file}" /></section>`
}))

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(buildHtml(width, height, pages.join('')), { waitUntil: 'load' })
  await page.emulateMedia({ media: 'screen' })
  await page.pdf({
    path: outputFile,
    printBackground: true,
    width: `${width}px`,
    height: `${height}px`,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  })
} finally {
  await browser.close()
}

console.log(`Packed ${files.length} slide images from ${inputDir}`)
console.log(`PDF created at ${outputFile}`)

function buildHtml(width, height, pages) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: ${width}px ${height}px;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      .page {
        width: ${width}px;
        height: ${height}px;
        break-after: page;
        page-break-after: always;
      }

      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    </style>
  </head>
  <body>${pages}
  </body>
</html>`
}

function getMimeType(fileName) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

async function getImageSize(filePath) {
  const buffer = await readFile(filePath)

  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      const size = buffer.readUInt16BE(offset + 2)
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      offset += 2 + size
    }
  }

  throw new Error(`Unsupported image format for size detection: ${filePath}`)
}
