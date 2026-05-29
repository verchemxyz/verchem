/**
 * Native print-to-PDF export.
 *
 * Opens the target element in an isolated window with the page's own
 * stylesheets and triggers the browser print dialog → the user picks
 * "Save as PDF". Unlike the raster (html2canvas) path this produces crisp,
 * selectable vector text — ideal for results full of numbers and formulas —
 * and is immune to the oklch() issue because the browser renders natively.
 */

export interface PrintOptions {
  title?: string
  /** Extra CSS injected into the print window (e.g. page size). */
  extraCss?: string
}

export function printElement(element: HTMLElement | null, options: PrintOptions = {}): boolean {
  if (!element || typeof window === 'undefined') return false

  const { title = 'VerChem', extraCss = '' } = options

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    // Popup blocked — caller can fall back to an inline message.
    return false
  }

  // Carry over every stylesheet/style so Tailwind utilities resolve in the
  // new document exactly as they render on screen.
  const styleNodes = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((n) => n.outerHTML)
    .join('\n')

  const safeTitle = title.replace(/[<>&]/g, '')

  win.document.open()
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  ${styleNodes}
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { background: #ffffff; padding: 24px; }
    ${extraCss}
  </style>
</head>
<body>${element.outerHTML}</body>
</html>`)
  win.document.close()
  win.focus()

  // Print after the carried-over stylesheets have loaded.
  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    win.print()
  }
  win.onload = triggerPrint
  // Fallback in case onload doesn't fire (styles already cached).
  win.setTimeout(triggerPrint, 700)

  return true
}
