import { execSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const distDir = path.join(rootDir, 'dist')
const outputFile = path.join(distDir, 'UAV-Manufacturing-Complex-Editable.pptx')

const COLORS = {
  bg: 'EAF2FB',
  panel: 'FFFFFF',
  ink: '132A4A',
  muted: '5D718B',
  line: 'D7E6F8',
  accent: '1F7AFF',
  accentSoft: 'DCEEFF',
  greenSoft: 'E7FAF6',
  goldSoft: 'FFF5E6',
  slateSoft: 'F4F8FC',
  teal: '1FB8A6',
  purple: '5E6BFF',
  orange: 'F08A00',
  gold: 'F5B83D',
}

const FONT_HEAD = 'Arial'
const FONT_BODY = 'Arial'

const image = (relativePath) => path.join(rootDir, relativePath)

function runRenderImages() {
  execSync('npm run render:images', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: process.env.PATH || '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    },
  })
}

function addSlideBackground(slide) {
  slide.background = { color: COLORS.bg }
}

function addTitle(slide, text, y = 0.42, size = 27) {
  slide.addText(text, {
    x: 0.45,
    y,
    w: 12.35,
    h: 0.45,
    fontFace: FONT_HEAD,
    fontSize: size,
    bold: true,
    color: COLORS.ink,
    margin: 0,
    fit: 'shrink',
  })
}

function addParagraph(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: options.fontFace || FONT_BODY,
    fontSize: options.fontSize || 15,
    color: options.color || COLORS.muted,
    bold: options.bold || false,
    align: options.align || 'left',
    valign: options.valign || 'top',
    margin: options.margin ?? 0,
    breakLine: options.breakLine || false,
    fit: options.fit || 'shrink',
  })
}

function addPanel(slide, x, y, w, h, options = {}) {
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    rectRadius: options.rectRadius || 0.08,
    line: {
      color: options.lineColor || COLORS.line,
      pt: options.linePt || 1,
    },
    fill: {
      color: options.fillColor || COLORS.panel,
      transparency: options.transparency || 0,
    },
    shadow: options.shadow || {
      type: 'outer',
      color: 'D8E4F2',
      blur: 1,
      angle: 45,
      distance: 1,
      opacity: 0.12,
    },
  })
}

function addAccentCard(slide, { x, y, w, h, title, body, fillColor = COLORS.panel, accentColor = COLORS.accent }) {
  addPanel(slide, x, y, w, h, { fillColor })
  slide.addShape('rect', {
    x,
    y,
    w,
    h: 0.06,
    line: { color: accentColor, pt: 0 },
    fill: { color: accentColor },
  })
  addParagraph(slide, title, x + 0.18, y + 0.17, w - 0.36, 0.26, {
    fontSize: 14.5,
    bold: true,
    color: COLORS.ink,
  })
  addParagraph(slide, body, x + 0.18, y + 0.42, w - 0.36, h - 0.52, {
    fontSize: 12.2,
    color: COLORS.muted,
    fit: 'shrink',
  })
}

function addMetricCard(slide, { x, y, w, h, label, stat, body }) {
  addPanel(slide, x, y, w, h, { fillColor: COLORS.panel })
  addParagraph(slide, label.toUpperCase(), x + 0.18, y + 0.14, w - 0.36, 0.18, {
    fontSize: 9.5,
    bold: true,
    color: COLORS.accent,
  })
  addParagraph(slide, stat, x + 0.18, y + 0.37, w - 0.36, 0.32, {
    fontSize: 18,
    bold: true,
    color: COLORS.ink,
  })
  addParagraph(slide, body, x + 0.18, y + 0.7, w - 0.36, h - 0.8, {
    fontSize: 11.6,
    color: COLORS.muted,
  })
}

function addImagePanel(slide, { x, y, w, h, panel = true, path: imagePath, altText, sizing = 'contain', crop }) {
  if (panel)
    addPanel(slide, x, y, w, h, { fillColor: COLORS.panel })

  const inset = panel ? 0.14 : 0
  const imageOptions = {
    path: imagePath,
    x: x + inset,
    y: y + inset,
    w: w - inset * 2,
    h: h - inset * 2,
    altText,
    sizing: crop
      ? {
          type: 'crop',
          x: crop.x,
          y: crop.y,
          w: crop.w,
          h: crop.h,
        }
      : {
          type: sizing,
          w: w - inset * 2,
          h: h - inset * 2,
        },
  }
  slide.addImage(imageOptions)
}

function addTag(slide, text, x, y, w) {
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h: 0.28,
    rectRadius: 0.06,
    line: { color: COLORS.line, pt: 0.5 },
    fill: { color: COLORS.slateSoft },
  })
  addParagraph(slide, text, x + 0.08, y + 0.045, w - 0.16, 0.16, {
    fontSize: 9.6,
    color: COLORS.accent,
    bold: true,
    align: 'center',
  })
}

function addRoadmapCard(slide, { x, y, w, h, year, title, body, milestone }) {
  addPanel(slide, x, y, w, h, { fillColor: COLORS.panel })
  addParagraph(slide, year, x + 0.12, y + 0.14, w - 0.24, 0.18, {
    fontSize: 9.2,
    bold: true,
    color: COLORS.accent,
  })
  addParagraph(slide, title, x + 0.12, y + 0.34, w - 0.24, 0.45, {
    fontSize: 12.4,
    bold: true,
    color: COLORS.ink,
  })
  addParagraph(slide, body, x + 0.12, y + 0.84, w - 0.24, 0.62, {
    fontSize: 10.6,
    color: COLORS.muted,
  })
  addTag(slide, milestone, x + 0.12, y + h - 0.42, w - 0.24)
}

function addLegendItem(slide, { x, y, color, title, body }) {
  slide.addShape('ellipse', {
    x,
    y: y + 0.06,
    w: 0.12,
    h: 0.12,
    line: { color, pt: 0.5 },
    fill: { color },
  })
  addParagraph(slide, title, x + 0.18, y, 1.4, 0.18, {
    fontSize: 10.8,
    bold: true,
    color: COLORS.ink,
  })
  addParagraph(slide, body, x + 0.18, y + 0.16, 1.4, 0.22, {
    fontSize: 9.3,
    color: COLORS.muted,
  })
}

async function buildDeck() {
  await mkdir(distDir, { recursive: true })
  runRenderImages()

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'Codex'
  pptx.company = 'UAV Manufacturing Complex'
  pptx.subject = 'Editable investor deck export'
  pptx.title = 'UAV Manufacturing Complex'
  pptx.lang = 'en-US'
  pptx.theme = {
    headFontFace: FONT_HEAD,
    bodyFontFace: FONT_BODY,
    lang: 'en-US',
  }
  pptx.defineLayout({ name: 'WIDE_EDIT', width: 13.333, height: 7.5 })
  pptx.layout = 'WIDE_EDIT'

  slide1(pptx.addSlide())
  slide2(pptx.addSlide())
  slide3(pptx.addSlide())
  slide4(pptx.addSlide())
  slide5(pptx.addSlide())
  slide6(pptx.addSlide())
  slide7(pptx.addSlide())
  slide8(pptx.addSlide())

  await pptx.writeFile({ fileName: outputFile })
  console.log(`Editable PowerPoint created at ${outputFile}`)
}

function slide1(slide) {
  addSlideBackground(slide)
  addTitle(slide, 'ASEAN UAV Manufacturing Base', 0.46, 28)
  addParagraph(slide, 'Ho Chi Minh City, May 2026', 0.45, 1.14, 4.5, 0.2, {
    fontSize: 12.5,
    color: COLORS.accent,
    bold: true,
  })
  addParagraph(
    slide,
    'A Vietnam manufacturing base that extends an existing China drone platform into Vietnam and the wider ASEAN market.',
    0.45,
    1.52,
    7.2,
    0.8,
    { fontSize: 17, color: COLORS.muted },
  )

  addMetricCard(slide, {
    x: 0.55, y: 4.35, w: 3.95, h: 1.6,
    label: 'Investment Ask',
    stat: '5-8M USD',
    body: 'To launch a Vietnam assembly, testing, and service base',
  })
  addMetricCard(slide, {
    x: 4.69, y: 4.35, w: 3.95, h: 1.6,
    label: '12-Month Target',
    stat: 'Factory commissioned',
    body: 'First deliveries in Vietnam and pilot ASEAN channels live',
  })
  addMetricCard(slide, {
    x: 8.83, y: 4.35, w: 3.95, h: 1.6,
    label: 'First Full-Year Revenue',
    stat: '8M USD',
    body: 'Built on proven platforms, local assembly, and service revenue',
  })
}

function slide2(slide) {
  addSlideBackground(slide)
  addTitle(slide, 'Why This Expansion Makes Sense')
  addPanel(slide, 0.55, 1.2, 4.8, 0.62, { fillColor: COLORS.accentSoft })
  addParagraph(slide, 'Not a replacement for China. A second base for ASEAN.', 0.78, 1.39, 4.35, 0.18, {
    fontSize: 13.2,
    bold: true,
    color: COLORS.ink,
    align: 'center',
  })
  addParagraph(
    slide,
    'Vietnam gives your group a lower-risk way to expand regional drone manufacturing without rebuilding core capability from zero.',
    0.58,
    2.0,
    5.15,
    0.72,
    { fontSize: 15.3, color: COLORS.muted },
  )
  addParagraph(slide, 'Why it works', 0.58, 2.8, 2.3, 0.2, {
    fontSize: 13,
    bold: true,
    color: COLORS.accent,
  })

  addAccentCard(slide, {
    x: 0.58, y: 3.12, w: 5.1, h: 0.78,
    title: 'Reuse existing platform',
    body: 'Transfer mature drone models, QA discipline, and supplier know-how',
  })
  addAccentCard(slide, {
    x: 0.58, y: 4.0, w: 5.1, h: 0.78,
    title: 'Vietnam cost + access',
    body: 'Competitive labor, industrial zones, and faster local market entry',
  })
  addAccentCard(slide, {
    x: 0.58, y: 4.88, w: 5.1, h: 0.78,
    title: 'ASEAN commercial bridge',
    body: 'Serve Vietnam first, then expand into nearby regional channels',
  })
  addAccentCard(slide, {
    x: 0.58, y: 5.76, w: 5.1, h: 0.78,
    title: 'Risk diversification',
    body: 'Add a second operating base outside a single-country footprint',
  })

  addImagePanel(slide, {
    x: 6.15,
    y: 1.2,
    w: 6.55,
    h: 5.45,
    path: image('public/images/why-vietnam-advantage.svg'),
    altText: 'Vietnam advantage infographic',
  })
}

function slide3(slide) {
  addSlideBackground(slide)
  addTitle(slide, 'Vietnam Hub Strategy')
  addParagraph(
    slide,
    'Southern Vietnam is the right base for final assembly, testing, localization, and ASEAN distribution because it combines ports, airports, supplier density, and outbound reach in one operating zone.',
    0.55,
    1.18,
    12.15,
    0.7,
    { fontSize: 14.5, color: COLORS.muted },
  )
  addParagraph(slide, 'Southern Vietnam Cluster', 0.55, 1.9, 3.4, 0.2, {
    fontSize: 13,
    bold: true,
    color: COLORS.accent,
  })
  addParagraph(slide, 'ASEAN Reach', 6.9, 1.9, 2.2, 0.2, {
    fontSize: 13,
    bold: true,
    color: COLORS.accent,
  })
  addImagePanel(slide, {
    x: 0.55,
    y: 2.2,
    w: 5.95,
    h: 4.2,
    path: image('public/images/osm-south-vietnam-baked.png'),
    altText: 'Southern Vietnam logistics map',
  })
  addImagePanel(slide, {
    x: 6.85,
    y: 2.2,
    w: 5.95,
    h: 4.2,
    path: image('public/images/osm-asean-baked.png'),
    altText: 'ASEAN connectivity map',
  })
}

function slide4(slide) {
  addSlideBackground(slide)
  addTitle(slide, 'Operating Model')
  addParagraph(
    slide,
    'A staged China-plus-Vietnam model reduces startup risk, shortens time to market, and builds regional upside in phases.',
    0.55,
    1.15,
    4.5,
    0.75,
    { fontSize: 15.5, color: COLORS.muted },
  )
  addParagraph(slide, 'Model highlights', 0.55, 2.05, 2.2, 0.2, {
    fontSize: 12,
    bold: true,
    color: COLORS.accent,
  })

  addAccentCard(slide, {
    x: 0.62, y: 2.4, w: 4.45, h: 0.98,
    title: 'Phase 1: transfer and assemble',
    body: 'Core modules from China, final assembly and QA in Vietnam',
  })
  addAccentCard(slide, {
    x: 0.62, y: 3.6, w: 4.45, h: 0.98,
    title: 'Phase 2: local service revenue',
    body: 'Maintenance, training, spare parts, batteries, and support contracts',
  })
  addAccentCard(slide, {
    x: 0.62, y: 4.8, w: 4.45, h: 0.98,
    title: 'Phase 3: regional scale-up',
    body: 'Vietnam localization, channel partners, and software or data upsell',
  })

  addPanel(slide, 5.45, 0.95, 7.45, 4.4, { fillColor: COLORS.panel })
  addParagraph(slide, 'OPERATING ARCHITECTURE', 5.72, 1.18, 3.4, 0.18, {
    fontSize: 10.5, bold: true, color: COLORS.accent,
  })
  addAccentCard(slide, {
    x: 5.7, y: 1.52, w: 6.9, h: 0.92,
    title: 'China Platform',
    body: 'core modules, qualified suppliers, SOPs, and QA templates',
    fillColor: COLORS.accentSoft,
  })
  addParagraph(slide, '↓', 8.95, 2.48, 0.2, 0.25, {
    fontSize: 18, bold: true, color: COLORS.accent, align: 'center',
  })
  addAccentCard(slide, {
    x: 5.7, y: 2.75, w: 6.9, h: 0.92,
    title: 'Vietnam Base',
    body: 'final assembly, testing, localization, after-sales, and service',
    fillColor: COLORS.greenSoft,
  })
  addParagraph(slide, '↓', 8.95, 3.7, 0.2, 0.25, {
    fontSize: 18, bold: true, color: COLORS.accent, align: 'center',
  })
  addAccentCard(slide, {
    x: 5.7, y: 3.98, w: 6.9, h: 0.92,
    title: 'ASEAN Channels',
    body: 'Vietnam first, then regional distributors and service partners',
    fillColor: COLORS.goldSoft,
  })

  addPanel(slide, 5.45, 5.55, 7.45, 1.4, { fillColor: COLORS.panel })
  addParagraph(slide, 'EXECUTION SEQUENCE', 5.72, 5.78, 2.7, 0.18, {
    fontSize: 10.5, bold: true, color: COLORS.accent,
  })
  const stepW = 1.68
  const stepGap = 0.18
  const stepX0 = 5.72
  ;[
    'Transfer BOM, tooling, and QA templates from China',
    'Install line, train team, and localize assembly workflow',
    'Validate pilot builds with local testing and reference projects',
    'Scale sales, service, and channel coverage across ASEAN',
  ].forEach((text, index) => {
    const x = stepX0 + index * (stepW + stepGap)
    addPanel(slide, x, 6.05, stepW, 0.7, { fillColor: COLORS.slateSoft, shadow: undefined })
    slide.addShape('ellipse', {
      x: x + 0.08, y: 6.12, w: 0.24, h: 0.24,
      line: { color: COLORS.accent, pt: 0.5 },
      fill: { color: COLORS.accent },
    })
    addParagraph(slide, String(index + 1), x + 0.08, 6.145, 0.24, 0.08, {
      fontSize: 8.8, bold: true, color: 'FFFFFF', align: 'center',
    })
    addParagraph(slide, text, x + 0.08, 6.38, stepW - 0.16, 0.24, {
      fontSize: 8.8, color: COLORS.muted, fit: 'shrink',
    })
  })
}

function slide5(slide) {
  addSlideBackground(slide)
  addImagePanel(slide, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    panel: false,
    path: image('dist/rendered-images/slide-05.png'),
    altText: '12-month launch plan screenshot',
    sizing: 'contain',
  })
}

function slide6(slide) {
  addSlideBackground(slide)
  addTitle(slide, '5-Year Growth Roadmap')
  const cards = [
    {
      year: 'YEAR 1',
      title: 'Commission the Vietnam base',
      body: 'Legal setup, line install, pilot assembly, and first customer deliveries',
      milestone: 'factory live',
    },
    {
      year: 'YEAR 2',
      title: 'Prove the Vietnam model',
      body: 'Reference customers, service network, and stable domestic operations',
      milestone: 'repeatable domestic sales',
    },
    {
      year: 'YEAR 3',
      title: 'Scale ASEAN exports',
      body: 'Cambodia, Thailand, Indonesia, and nearby partner channels',
      milestone: 'export mix 30-40%',
    },
    {
      year: 'YEAR 4',
      title: 'Improve margin and recurring revenue',
      body: 'More localization, maintenance plans, training, and software contracts',
      milestone: 'stronger operating economics',
    },
    {
      year: 'YEAR 5',
      title: 'Run a dual-base regional platform',
      body: 'Vietnam as ASEAN hub, China as core platform and supply anchor',
      milestone: 'export-led manufacturing',
    },
  ]
  const w = 2.34
  const gap = 0.14
  const startX = 0.55
  cards.forEach((card, index) => {
    addRoadmapCard(slide, {
      x: startX + index * (w + gap),
      y: 1.65,
      w,
      h: 4.7,
      ...card,
    })
  })
}

function slide7(slide) {
  addSlideBackground(slide)
  addTitle(slide, 'Capital Plan')
  addPanel(slide, 0.58, 1.15, 5.15, 0.76, { fillColor: COLORS.accentSoft })
  addParagraph(slide, '5-8M USD', 0.8, 1.29, 1.55, 0.22, {
    fontSize: 17, bold: true, color: COLORS.ink,
  })
  addParagraph(
    slide,
    'To open a de-risked Vietnam manufacturing base built on an existing China drone platform.',
    0.8,
    1.52,
    4.55,
    0.22,
    { fontSize: 11.8, color: COLORS.muted },
  )

  addParagraph(slide, 'Funding focus', 0.58, 2.18, 2.2, 0.2, {
    fontSize: 12.4, bold: true, color: COLORS.accent,
  })
  addAccentCard(slide, {
    x: 0.62, y: 2.5, w: 5.1, h: 0.78,
    title: 'Factory + line setup',
    body: '2-3M',
  })
  addAccentCard(slide, {
    x: 0.62, y: 3.4, w: 5.1, h: 0.78,
    title: 'Working capital + imported kits/components',
    body: '1.5-2.5M',
  })
  addAccentCard(slide, {
    x: 0.62, y: 4.3, w: 5.1, h: 0.78,
    title: 'Team, certification, and channel build',
    body: '1.5-2.5M',
  })

  addParagraph(slide, 'First-year revenue logic', 6.05, 1.24, 3.2, 0.2, {
    fontSize: 12.4, bold: true, color: COLORS.accent,
  })
  addPanel(slide, 6.0, 1.55, 6.75, 3.35, { fillColor: COLORS.panel })
  addParagraph(slide, 'ILLUSTRATIVE YEAR-1 REVENUE MIX', 6.28, 1.8, 3.9, 0.16, {
    fontSize: 10.2, bold: true, color: COLORS.accent,
  })

  const barX = 6.32
  const barY = 2.2
  const barW = 5.95
  const barH = 0.42
  const segments = [
    { label: '60%', title: 'Hardware', body: 'Main platform revenue', color: COLORS.accent, pct: 0.6 },
    { label: '20%', title: 'Service', body: 'maintenance, training, support', color: COLORS.teal, pct: 0.2 },
    { label: '10%', title: 'Software', body: 'data, workflow, value-added tools', color: COLORS.purple, pct: 0.1 },
    { label: '10%', title: 'Parts + batteries', body: 'spares, accessories, replacement cycles', color: COLORS.orange, pct: 0.1 },
  ]

  let cursorX = barX
  segments.forEach((segment) => {
    const width = barW * segment.pct
    slide.addShape('roundRect', {
      x: cursorX,
      y: barY,
      w: width,
      h: barH,
      rectRadius: 0.04,
      line: { color: segment.color, pt: 0 },
      fill: { color: segment.color },
    })
    addParagraph(slide, segment.label, cursorX, barY + 0.08, width, 0.12, {
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    })
    cursorX += width
  })

  const legendStartX = 6.28
  const legendStartY = 2.95
  const legendGapX = 3.12
  const legendGapY = 0.7
  segments.forEach((segment, index) => {
    addLegendItem(slide, {
      x: legendStartX + (index % 2) * legendGapX,
      y: legendStartY + Math.floor(index / 2) * legendGapY,
      color: segment.color,
      title: segment.title,
      body: segment.body,
    })
  })

  addParagraph(
    slide,
    'Around 8M USD in the first full operating year, with revenue anchored by hardware and margin expansion supported by service, software, and recurring parts demand.',
    6.05,
    5.18,
    6.55,
    0.78,
    { fontSize: 13.2, color: COLORS.ink, bold: true },
  )
}

function slide8(slide) {
  addSlideBackground(slide)
  addParagraph(slide, 'Thank You\n谢谢', 2.1, 1.75, 9.1, 1.1, {
    fontSize: 29,
    bold: true,
    color: COLORS.ink,
    align: 'center',
    valign: 'mid',
    fit: 'shrink',
  })
  addParagraph(
    slide,
    'We welcome your questions and next-step discussion on the Vietnam manufacturing base opportunity.',
    1.65,
    3.2,
    10.0,
    0.45,
    {
      fontSize: 17,
      color: COLORS.muted,
      align: 'center',
    },
  )
  addParagraph(
    slide,
    '欢迎继续交流，并讨论越南制造基地项目的下一步合作。',
    2.05,
    4.0,
    9.2,
    0.42,
    {
      fontSize: 16,
      color: COLORS.accent,
      align: 'center',
    },
  )
}

buildDeck().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
