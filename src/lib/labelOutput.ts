import { Product } from './types'
import { calculateDiscountInfo, formatCurrency } from './productUtils'

export type LabelOutputMethod = 'auto' | 'zebra' | 'browser' | 'pdf'
export type ResolvedLabelOutputMethod = 'zebra' | 'browser' | 'pdf'
export type LabelType = 'discount' | 'price-change'
export type LabelSize = '2x1' | '3x2' | '4x2' | 'standard' | 'small' | 'medium' | 'large'

export interface LabelPrintItem {
  product: Product
  labelType: LabelType
  zpl: string
  includeBarcode?: boolean
}

export interface ZebraDetectionResult {
  available: boolean
  deviceName?: string
  reason?: string
}

export interface LabelOutputResolution {
  method: ResolvedLabelOutputMethod
  zebra: ZebraDetectionResult
  fallbackReason?: string
}

interface ZebraDevice {
  name?: string
  send: (data: string, success?: () => void, failure?: (error: unknown) => void) => void
}

interface ZebraBrowserPrintApi {
  getDefaultDevice: (
    type: string,
    success: (device?: ZebraDevice | null) => void,
    failure?: (error: unknown) => void
  ) => void
}

declare global {
  interface Window {
    BrowserPrint?: ZebraBrowserPrintApi
  }
}

export const detectZebraBrowserPrint = async (): Promise<ZebraDetectionResult> => {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'Browser environment unavailable' }
  }

  if (!window.BrowserPrint?.getDefaultDevice) {
    return { available: false, reason: 'Zebra Browser Print is not installed or not loaded' }
  }

  try {
    const device = await getDefaultZebraDevice()

    if (!device?.send) {
      return { available: false, reason: 'No default Zebra printer was reported by Browser Print' }
    }

    return { available: true, deviceName: device.name || 'Zebra label printer' }
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : 'Zebra Browser Print did not respond'
    }
  }
}

export const resolveLabelOutputMethod = async (
  preferredMethod: LabelOutputMethod
): Promise<LabelOutputResolution> => {
  if (preferredMethod === 'browser') {
    return { method: 'browser', zebra: { available: false, reason: 'Standard print selected' } }
  }

  if (preferredMethod === 'pdf') {
    return { method: 'pdf', zebra: { available: false, reason: 'PDF selected' } }
  }

  const zebra = await detectZebraBrowserPrint()

  if (zebra.available) {
    return { method: 'zebra', zebra }
  }

  return {
    method: 'browser',
    zebra,
    fallbackReason: preferredMethod === 'zebra'
      ? 'Zebra Browser Print was not available, using standard print instead'
      : 'No Zebra label printer detected, using standard print'
  }
}

export const sendZplToZebra = async (zpl: string): Promise<void> => {
  const device = await getDefaultZebraDevice()

  if (!device?.send) {
    throw new Error('No Zebra printer is available through Browser Print')
  }

  await new Promise<void>((resolve, reject) => {
    device.send(
      zpl,
      () => resolve(),
      (error) => reject(error instanceof Error ? error : new Error(String(error || 'Zebra print failed')))
    )
  })
}

export const printLabelsInBrowser = (items: LabelPrintItem[], labelSize: LabelSize): void => {
  if (typeof window === 'undefined') {
    throw new Error('Browser print is only available in the web app')
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700')

  if (!printWindow) {
    throw new Error('The browser blocked the print window. Allow popups and try again.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPrintableLabelsHtml(items, labelSize))
  printWindow.document.close()
  printWindow.focus()

  window.setTimeout(() => {
    printWindow.print()
  }, 250)
}

export const downloadLabelsPdf = (items: LabelPrintItem[], filename = defaultPdfFilename()): boolean => {
  if (typeof document === 'undefined') {
    throw new Error('PDF download is only available in the web app')
  }

  const pdfBytes = createLabelsPdfBytes(items)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download = filename || defaultPdfFilename()
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    const downloadFired = link.dispatchEvent(clickEvent)

    if (!downloadFired) {
      throw new Error('The browser blocked the PDF download')
    }

    return true
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
}

export const createLabelsPdfBytes = (items: LabelPrintItem[]): Uint8Array => {
  const pageWidth = 288
  const pageHeight = 432
  const objects: string[] = []
  const pageObjectIds: number[] = []
  const fontObjectId = 3 + items.length * 2

  const addObject = (body: string): number => {
    objects.push(body)
    return objects.length
  }

  addObject('<< /Type /Catalog /Pages 2 0 R >>')
  addObject('PAGES_PLACEHOLDER')

  items.forEach((item) => {
    const pageObjectId = objects.length + 1
    const contentObjectId = pageObjectId + 1
    pageObjectIds.push(pageObjectId)

    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`)

    const stream = buildPdfContentStream(item, pageHeight)
    addObject(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`)
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${items.length} >>`
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((body, index) => {
    offsets.push(byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

const getDefaultZebraDevice = async (): Promise<ZebraDevice | null> => {
  if (typeof window === 'undefined' || !window.BrowserPrint?.getDefaultDevice) {
    return null
  }

  return new Promise((resolve, reject) => {
    window.BrowserPrint?.getDefaultDevice(
      'printer',
      (device) => resolve(device || null),
      (error) => reject(error instanceof Error ? error : new Error(String(error || 'Zebra Browser Print failed')))
    )
  })
}

const buildPrintableLabelsHtml = (items: LabelPrintItem[], labelSize: LabelSize): string => {
  const size = getCssLabelSize(labelSize)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>FreshSave Labels</title>
    <style>
      @page { margin: 0.25in; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
      .label-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        break-after: page;
        page-break-after: always;
        padding: 0.12in;
      }
      .label-page:last-child { break-after: auto; page-break-after: auto; }
      .label {
        width: ${size.width};
        min-height: ${size.height};
        border: 2px solid #111;
        padding: ${size.padding};
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.08in;
      }
      .badge {
        align-self: center;
        background: #7c3aed;
        color: white;
        font-weight: 900;
        letter-spacing: 0.02em;
        padding: 0.05in 0.18in;
        border-radius: 6px;
        text-transform: uppercase;
      }
      .shelf-badge {
        align-self: center;
        border: 2px solid #111;
        color: #111;
        font-weight: 900;
        padding: 0.05in 0.14in;
        text-transform: uppercase;
      }
      h1 { margin: 0; font-size: ${size.nameSize}; line-height: 1.05; }
      .category { margin: 0; color: #555; font-size: ${size.metaSize}; text-transform: capitalize; }
      .was { color: #666; font-size: ${size.metaSize}; }
      .was strong { text-decoration: line-through; font-size: ${size.priceSmall}; color: #777; }
      .price { margin: 0; color: #7c3aed; font-weight: 900; font-size: ${size.priceLarge}; line-height: 1; }
      .regular-price { margin: 0; color: #111; font-weight: 900; font-size: ${size.priceLarge}; line-height: 1; }
      .save { color: #7c3aed; font-size: ${size.priceSmall}; font-weight: 900; }
      .meta { color: #555; font-size: ${size.metaSize}; }
      .barcode { font-family: "Courier New", monospace; border-top: 1px solid #ddd; padding-top: 0.06in; color: #333; font-size: ${size.metaSize}; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    ${items.map(renderPrintableLabel).join('')}
  </body>
</html>`
}

const renderPrintableLabel = (item: LabelPrintItem): string => {
  const { product, labelType } = item
  const barcode = item.includeBarcode === false ? '' : `PRD${product.id.slice(-8).toUpperCase()}`

  if (labelType === 'price-change') {
    return `<section class="label-page">
      <div class="label">
        <div class="shelf-badge">New Shelf Price</div>
        <div>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="category">${escapeHtml(product.category)}</p>
        </div>
        <p class="meta">Regular Price</p>
        <p class="regular-price">${formatCurrency(product.originalPrice)}</p>
        ${barcode ? `<div class="barcode">${escapeHtml(barcode)}</div>` : ''}
      </div>
    </section>`
  }

  const discountInfo = calculateDiscountInfo(product)

  return `<section class="label-page">
    <div class="label">
      <div class="badge">Sale</div>
      <div>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="category">${escapeHtml(product.category)}</p>
      </div>
      <div class="was">Was<br /><strong>${formatCurrency(product.originalPrice)}</strong></div>
      <p class="price">${formatCurrency(discountInfo.discountedPrice)}</p>
      <div class="save">SAVE ${discountInfo.discountPercentage}%</div>
      <div class="meta">Expires: ${escapeHtml(new Date(product.expiryDate).toLocaleDateString())}</div>
      ${barcode ? `<div class="barcode">${escapeHtml(barcode)}</div>` : ''}
    </div>
  </section>`
}

const buildPdfContentStream = (item: LabelPrintItem, pageHeight: number): string => {
  const lines = getPdfLabelLines(item)
  let stream = 'BT\n/F1 18 Tf\n'

  lines.forEach((line, index) => {
    const fontSize = index === 0 ? 20 : index === 3 ? 24 : 14
    const y = pageHeight - 64 - index * 34
    stream += `/F1 ${fontSize} Tf\n42 ${y} Td (${escapePdfText(line)}) Tj\n`
  })

  return `${stream}ET`
}

const getPdfLabelLines = (item: LabelPrintItem): string[] => {
  const barcode = item.includeBarcode === false ? '' : `PRD${item.product.id.slice(-8).toUpperCase()}`

  if (item.labelType === 'price-change') {
    return [
      'NEW SHELF PRICE',
      item.product.name,
      `Category: ${item.product.category}`,
      `Regular Price: ${formatCurrency(item.product.originalPrice)}`,
      barcode
    ].filter(Boolean)
  }

  const discountInfo = calculateDiscountInfo(item.product)

  return [
    'SALE',
    item.product.name,
    `Was: ${formatCurrency(item.product.originalPrice)}`,
    `Now: ${formatCurrency(discountInfo.discountedPrice)}`,
    `SAVE ${discountInfo.discountPercentage}%`,
    `Expires: ${new Date(item.product.expiryDate).toLocaleDateString()}`,
    barcode
  ].filter(Boolean)
}

const getCssLabelSize = (labelSize: LabelSize) => {
  switch (labelSize) {
    case '2x1':
      return { width: '2in', height: '1in', padding: '0.08in', nameSize: '14px', metaSize: '9px', priceSmall: '13px', priceLarge: '24px' }
    case '3x2':
    case 'small':
      return { width: '3in', height: '2in', padding: '0.12in', nameSize: '20px', metaSize: '11px', priceSmall: '18px', priceLarge: '34px' }
    case '4x2':
      return { width: '4in', height: '2in', padding: '0.14in', nameSize: '22px', metaSize: '12px', priceSmall: '20px', priceLarge: '38px' }
    case 'large':
      return { width: '4in', height: '8in', padding: '0.28in', nameSize: '34px', metaSize: '18px', priceSmall: '30px', priceLarge: '68px' }
    case 'standard':
    case 'medium':
    default:
      return { width: '4in', height: '6in', padding: '0.24in', nameSize: '30px', metaSize: '16px', priceSmall: '26px', priceLarge: '58px' }
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const escapePdfText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '')

const byteLength = (value: string): number => new TextEncoder().encode(value).length

const defaultPdfFilename = (): string => `freshsave-labels-${new Date().toISOString().slice(0, 10)}.pdf`
