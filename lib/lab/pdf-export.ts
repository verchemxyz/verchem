'use client'

import jsPDF from 'jspdf'
import { CanvasExporter } from '@/lib/export/canvas-export'

function safeRecordName(recordNo: string): string {
  return recordNo.replace(/[^A-Za-z0-9._-]/g, '_')
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function printableClone(element: HTMLElement): { clone: HTMLElement; dispose: () => void } {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-pdf-exclude="true"], [data-pdf-jws-text="true"]')
    .forEach((node) => node.remove())
  const width = Math.max(element.getBoundingClientRect().width, element.scrollWidth)
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '0'
  host.style.width = `${width}px`
  host.style.background = '#ffffff'
  host.appendChild(clone)
  document.body.appendChild(host)
  return { clone, dispose: () => host.remove() }
}

function addCanvasPages(pdf: jsPDF, canvas: HTMLCanvasElement, margin: number): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (margin * 2)
  const contentHeight = pageHeight - (margin * 2)
  const sliceHeight = Math.max(1, Math.floor(canvas.width * contentHeight / contentWidth))

  for (let top = 0, page = 0; top < canvas.height; top += sliceHeight, page += 1) {
    if (page > 0) pdf.addPage()
    const height = Math.min(sliceHeight, canvas.height - top)
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = height
    const context = slice.getContext('2d')
    if (!context) throw new Error('Could not prepare a PDF page canvas.')
    context.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height)
    const renderedHeight = height * contentWidth / canvas.width
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, renderedHeight)
  }
}

function addSelectableJwsPages(pdf: jsPDF, compactJws: string, title: string, margin: number): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (margin * 2)
  const titleY = margin + 12
  const textStartY = titleY + 18
  const lineHeight = 7
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6)
  const lines = pdf.splitTextToSize(compactJws, contentWidth) as string[]
  const linesPerPage = Math.max(1, Math.floor((pageHeight - margin - textStartY) / lineHeight) + 1)

  for (let offset = 0; offset < lines.length; offset += linesPerPage) {
    pdf.addPage()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(title, margin, titleY)
    pdf.setFont('courier', 'normal')
    pdf.setFontSize(6)
    pdf.text(lines.slice(offset, offset + linesPerPage), margin, textStartY, { lineHeightFactor: lineHeight / 6 })
  }
}

/**
 * The certificate remains a DOM capture, split across A4 pages without clipping.
 * The complete compact JWS is appended as real PDF text so an auditor can copy
 * it into /verify instead of trusting the rasterized certificate presentation.
 */
export async function downloadLabEvidencePackPdf(
  element: HTMLElement,
  recordNo: string,
  compactJws: string,
  jwsTitle: string
): Promise<void> {
  const printable = printableClone(element)
  try {
    const canvas = await CanvasExporter.elementToCanvas(printable.clone, { scale: 2 })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
    pdf.setProperties({
      title: `VerChem laboratory record ${recordNo}`,
      author: 'VerChem',
      creator: 'VerChem Lab',
      subject: 'Controlled preparation evidence pack with independently verifiable compact JWS',
    })
    addCanvasPages(pdf, canvas, 24)
    addSelectableJwsPages(pdf, compactJws, jwsTitle, 24)
    downloadBlob(pdf.output('blob'), `verchem-lab-${safeRecordName(recordNo)}.pdf`)
  } finally {
    printable.dispose()
  }
}

export function downloadLabEvidencePackJws(compactJws: string, recordNo: string): void {
  downloadBlob(
    new Blob([compactJws], { type: 'application/jose;charset=utf-8' }),
    `verchem-lab-${safeRecordName(recordNo)}.jws`
  )
}
