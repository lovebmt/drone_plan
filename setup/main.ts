import { defineAppSetup } from '@slidev/types'

const GANTT_STYLE_ID = 'gantt-shadow-font-style'

function scaleFontSize(fontSize: string, multiplier: number) {
  const match = fontSize.trim().match(/^([0-9]+(?:\.[0-9]+)?)([A-Za-z%]+)$/)

  if (!match) return fontSize

  const [, value, unit] = match
  const scaled = Number.parseFloat(value) * multiplier

  return `${scaled}${unit}`
}

function applyGanttFontOverrides() {
  document.querySelectorAll<HTMLElement>('.factory-gantt .mermaid').forEach((host) => {
    const shadowRoot = host.shadowRoot

    if (!shadowRoot) return

    const baseFontSize = getComputedStyle(host).getPropertyValue('--gantt-font-size').trim() || '18px'
    const axisFontSize = scaleFontSize(baseFontSize, 0.9)
    const titleFontSize = scaleFontSize(baseFontSize, 1.15)

    let style = shadowRoot.getElementById(GANTT_STYLE_ID) as HTMLStyleElement | null

    if (!style) {
      style = document.createElement('style')
      style.id = GANTT_STYLE_ID
      shadowRoot.appendChild(style)
    }

    style.textContent = `
      .taskText,
      .taskTextOutsideLeft,
      .taskTextOutsideRight,
      .sectionTitle,
      .sectionTitle tspan {
        font-size: ${baseFontSize} !important;
      }

      .grid .tick text,
      .tick text,
      .vertText {
        font-size: ${axisFontSize} !important;
      }

      .titleText {
        font-size: ${titleFontSize} !important;
      }
    `
  })
}

function scheduleApply() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyGanttFontOverrides()
    })
  })
}

export default defineAppSetup(({ router }) => {
  if (typeof window === 'undefined')
    return

  const observer = new MutationObserver(() => {
    scheduleApply()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  router.afterEach(() => {
    window.setTimeout(() => {
      scheduleApply()
    }, 120)
  })

  window.addEventListener('load', scheduleApply, { once: true })
  window.setTimeout(scheduleApply, 120)
})
