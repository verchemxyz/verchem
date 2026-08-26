'use client'

import { PDFExporter } from '@/lib/export/pdf-export'

/** Export the same certificate DOM rendered on screen, preserving its signed-data presentation. */
export async function downloadLabEvidencePackPdf(element: HTMLElement, recordNo: string): Promise<void> {
  const safeRecordNo = recordNo.replace(/[^A-Za-z0-9._-]/g, '_')
  await PDFExporter.exportElementToPDF(element, `verchem-lab-${safeRecordNo}.pdf`, {
    title: `VerChem laboratory record ${recordNo}`,
    author: 'VerChem',
    creator: 'VerChem Lab-QC',
    orientation: 'portrait',
    format: 'a4',
    margin: 24,
    pageNumbers: false,
  })
}
