/**
 * Helpers for molecule format export and file download.
 * Uses Ketcher's built-in APIs via the Ketcher instance.
 */

export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadText(
  content: string,
  filename: string,
  mimeType = 'text/plain'
) {
  downloadFile(content, filename, mimeType);
}

export function downloadSvg(svgString: string, filename: string) {
  downloadText(svgString, filename, 'image/svg+xml');
}

export function downloadPng(blob: Blob, filename: string) {
  downloadFile(blob, filename, 'image/png');
}
