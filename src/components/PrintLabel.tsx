import { useEffect, useState } from 'react'
import { Product } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateDiscountInfo, formatCurrency } from '@/lib/productUtils'
import { calculateLabelCost } from '@/lib/printerAnalytics'
import { generateZPL } from '@/lib/printerUtils'
import {
  downloadLabelsPdf,
  LabelOutputMethod,
  LabelOutputResolution,
  LabelSize,
  printLabelsInBrowser,
  resolveLabelOutputMethod,
  sendZplToZebra
} from '@/lib/labelOutput'
import { Printer, CheckCircle, Barcode, Desktop, CurrencyDollar, FilePdf, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PrintLabelProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrinted: (productId: string, printerType: string, labelSize: string) => void
}

export function PrintLabel({ product, open, onOpenChange, onPrinted }: PrintLabelProps) {
  const [outputMethod, setOutputMethod] = useState<LabelOutputMethod>('auto')
  const [labelSize, setLabelSize] = useState<LabelSize>('standard')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [printSuccess, setPrintSuccess] = useState(false)
  const [outputResolution, setOutputResolution] = useState<LabelOutputResolution | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setIsDetecting(true)

    resolveLabelOutputMethod(outputMethod)
      .then((resolution) => {
        if (!cancelled) setOutputResolution(resolution)
      })
      .finally(() => {
        if (!cancelled) setIsDetecting(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, outputMethod])

  if (!product) return null

  const discountInfo = calculateDiscountInfo(product)
  const labelCost = calculateLabelCost(labelSize, getAnalyticsPrinterType(outputResolution?.method ?? 'browser'))
  const printItem = {
    product,
    labelType: 'discount' as const,
    includeBarcode: true,
    zpl: generateZPL({
      name: product.name,
      originalPrice: product.originalPrice,
      discountedPrice: discountInfo.discountedPrice,
      discountPercentage: discountInfo.discountPercentage,
      expiryDate: product.expiryDate,
      labelType: 'discount',
      barcode: `PRD${product.id.slice(-8).toUpperCase()}`
    })
  }

  const handlePrint = async () => {
    setIsPrinting(true)

    try {
      if (outputMethod === 'pdf') {
        const resolution: LabelOutputResolution = {
          method: 'pdf',
          zebra: { available: false, reason: 'PDF selected' }
        }

        setOutputResolution(resolution)
        downloadLabelsPdf([printItem], `${safeFilename(product.name)}-label.pdf`)
        setPrintSuccess(true)
        toast.success('PDF download started', {
          description: `${getModeLabel(resolution)} • Cost: $${labelCost.toFixed(3)}`
        })

        setTimeout(() => {
          onPrinted(product.id, getAnalyticsPrinterType(resolution.method), labelSize)
          onOpenChange(false)
          setPrintSuccess(false)
        }, 1200)
        return
      }

      const resolution = await resolveLabelOutputMethod(outputMethod)
      setOutputResolution(resolution)

      if (resolution.method === 'zebra') {
        await sendZplToZebra(printItem.zpl)
      } else {
        printLabelsInBrowser([printItem], labelSize)
      }

      setPrintSuccess(true)
      toast.success('Label output started', {
        description: `${getModeLabel(resolution)} • Cost: $${labelCost.toFixed(3)}`
      })

      setTimeout(() => {
        onPrinted(product.id, getAnalyticsPrinterType(resolution.method), labelSize)
        onOpenChange(false)
        setPrintSuccess(false)
      }, 1200)
    } catch (error) {
      toast.error('Label output failed', {
        description: error instanceof Error ? error.message : 'Check the selected output method and try again'
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = () => {
    try {
      downloadLabelsPdf([printItem], `${safeFilename(product.name)}-label.pdf`)
      toast.success('PDF download started')
    } catch (error) {
      toast.error('PDF download failed', {
        description: error instanceof Error ? error.message : 'Unable to generate PDF'
      })
    }
  }

  const handleConfirmPrinted = () => {
    onPrinted(product.id, getAnalyticsPrinterType(outputResolution?.method ?? 'browser'), labelSize)
    onOpenChange(false)
    setPrintSuccess(false)
  }

  const getLabelDimensions = () => {
    switch (labelSize) {
      case '2x1':
        return 'max-w-[2in] h-[1in]'
      case '3x2':
        return 'max-w-[3in] h-[2in]'
      case '4x2':
        return 'max-w-[4in] h-[2in]'
      default:
        return 'max-w-md'
    }
  }

  const generateBarcode = (productId: string) => productId.slice(-8).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="no-print">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Printer size={28} weight="bold" className="text-primary" />
            Print Price Label
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 no-print">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Output Method</label>
              <Select value={outputMethod} onValueChange={(v) => setOutputMethod(v as LabelOutputMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="zebra">Zebra Thermal</SelectItem>
                  <SelectItem value="browser">Standard Print</SelectItem>
                  <SelectItem value="pdf">Download PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Label Size</label>
              <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x1">2" x 1" (Small)</SelectItem>
                  <SelectItem value="3x2">3" x 2" (Medium)</SelectItem>
                  <SelectItem value="4x2">4" x 2" (Large)</SelectItem>
                  <SelectItem value="standard">Standard (4" x 6")</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {isDetecting ? (
              <Badge variant="outline" className="gap-1.5">
                <CircleNotch size={14} className="animate-spin" />
                Looking for label printer...
              </Badge>
            ) : (
              <Badge variant={outputResolution?.method === 'zebra' ? 'default' : 'secondary'}>
                {outputResolution ? getModeLabel(outputResolution) : 'Using standard print'}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {outputResolution?.fallbackReason || outputResolution?.zebra.deviceName || outputResolution?.zebra.reason || 'Label preview shown below'}
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-xs">
              <CurrencyDollar size={14} className="text-muted-foreground" />
              <span className="font-medium">${labelCost.toFixed(3)}</span>
              <span className="text-muted-foreground">per label</span>
            </div>
          </div>
        </div>

        <div className={`mx-auto ${getLabelDimensions()}`}>
          <div id="print-label" className="p-6 border-2 border-dashed border-border rounded-lg bg-white text-black print:border-0 print:p-8">
            <div className="text-center space-y-3">
              <div className="inline-block px-4 py-1.5 bg-purple-600 text-white rounded-md">
                <p className="text-2xl font-black uppercase tracking-wider">SALE</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-1 leading-tight">{product.name}</h2>
                <p className="text-base text-gray-600 capitalize">{product.category}</p>
              </div>

              <div className="py-3 border-y-2 border-gray-300">
                <p className="text-xs text-gray-500 mb-1">Was</p>
                <p className="text-2xl font-bold line-through text-gray-400">
                  {formatCurrency(product.originalPrice)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Now</p>
                <p className="text-5xl font-black text-purple-600">
                  {formatCurrency(discountInfo.discountedPrice)}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xl font-bold text-purple-600">
                  SAVE {discountInfo.discountPercentage}%
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Barcode size={16} />
                  <span className="font-mono">{generateBarcode(product.id)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Expires: {new Date(product.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {printSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="no-print p-4 bg-success/10 border-2 border-success rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={32} weight="fill" className="text-success" />
                <div className="flex-1">
                  <p className="font-semibold text-success">Label Output Started</p>
                  <p className="text-sm text-muted-foreground">FreshSave sent the label to the selected output method</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 no-print">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isPrinting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleDownloadPdf}
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isPrinting}
          >
            <FilePdf size={20} weight="bold" className="mr-2" />
            Download Labels (PDF)
          </Button>

          {!printSuccess ? (
            <Button
              onClick={handlePrint}
              size="lg"
              className="flex-1"
              disabled={isPrinting || isDetecting}
            >
              {isPrinting ? (
                <>
                  <CircleNotch size={20} weight="bold" className="mr-2 animate-spin" />
                  Outputting...
                </>
              ) : (
                <>
                  <Desktop size={20} weight="bold" className="mr-2" />
                  Print Label
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConfirmPrinted}
              size="lg"
              className="flex-1 bg-success hover:bg-success/90"
            >
              <CheckCircle size={20} weight="bold" className="mr-2" />
              Confirm Printed
            </Button>
          )}
        </div>

        <div className="no-print pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Auto uses Zebra Browser Print when available, then standard browser print, with PDF download always available.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const getModeLabel = (resolution: LabelOutputResolution): string => {
  switch (resolution.method) {
    case 'zebra':
      return 'Thermal printer connected'
    case 'pdf':
      return 'Download PDF selected'
    case 'browser':
    default:
      return 'Using standard print'
  }
}

const getAnalyticsPrinterType = (method: string): 'thermal' | 'standard' | 'browser' => {
  if (method === 'zebra') return 'thermal'
  if (method === 'pdf') return 'standard'
  return 'browser'
}

const safeFilename = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'freshsave-label'
