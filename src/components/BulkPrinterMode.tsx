import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product } from '@/lib/types'
import { PrintJob, BulkPrintSettings } from '@/lib/printerTypes'
import { generateZPL } from '@/lib/printerUtils'
import { calculateDiscountInfo } from '@/lib/productUtils'
import {
  downloadLabelsPdf,
  LabelOutputMethod,
  LabelOutputResolution,
  LabelPrintItem,
  printLabelsInBrowser,
  resolveLabelOutputMethod,
  sendZplToZebra
} from '@/lib/labelOutput'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Printer,
  CircleNotch,
  Stack,
  Tag,
  FilePdf,
  Desktop,
  CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type BulkLabelMode = 'discount' | 'price-change'

interface BulkPrinterModeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onPrintComplete?: (productIds: string[], labelMode: BulkLabelMode) => void
}

export function BulkPrinterMode({ open, onOpenChange, products, onPrintComplete }: BulkPrinterModeProps) {
  const [, setPrintJobs] = useKV<PrintJob[]>('freshsave-pro-print-jobs', [])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [copies, setCopies] = useState(1)
  const [outputMethod, setOutputMethod] = useState<LabelOutputMethod>('auto')
  const [outputResolution, setOutputResolution] = useState<LabelOutputResolution | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printProgress, setPrintProgress] = useState(0)
  const [labelMode, setLabelMode] = useState<BulkLabelMode>('discount')
  const [settings, setSettings] = useState<BulkPrintSettings>({
    printerId: '',
    copies: 1,
    autoPrint: false,
    includeBarcode: true,
    includeQRCode: false,
    labelSize: 'medium',
    orientation: 'portrait'
  })

  const discountedProducts = products.filter(p =>
    p.status === 'discounted' || p.status === 'labeled'
  )
  const recentlyPriceChangedProducts = products.filter(product => (
    product.priceUpdatedAt != null
    && Date.parse(product.priceUpdatedAt) >= Date.now() - 24 * 60 * 60 * 1000
  ))
  const printableProducts = labelMode === 'price-change'
    ? recentlyPriceChangedProducts
    : discountedProducts

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

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedProducts(new Set(printableProducts.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedProducts(new Set())
  }

  const buildPrintItems = (): LabelPrintItem[] => {
    return Array.from(selectedProducts)
      .map(productId => products.find(p => p.id === productId))
      .filter((product): product is Product => Boolean(product))
      .map((product) => {
        const discountInfo = calculateDiscountInfo(product)
        const isPriceChangeLabel = labelMode === 'price-change'

        return {
          product,
          labelType: labelMode,
          includeBarcode: settings.includeBarcode,
          zpl: generateZPL({
            name: product.name,
            originalPrice: product.originalPrice,
            discountedPrice: isPriceChangeLabel ? undefined : discountInfo.discountedPrice,
            discountPercentage: isPriceChangeLabel ? undefined : discountInfo.discountPercentage,
            expiryDate: isPriceChangeLabel ? undefined : product.expiryDate,
            labelType: labelMode,
            barcode: settings.includeBarcode ? `PRD${product.id.slice(-8).toUpperCase()}` : undefined
          })
        }
      })
  }

  const handleBulkPrint = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to print')
      return
    }

    const items = buildPrintItems()
    if (items.length === 0) {
      toast.error('No selected products are available to print')
      return
    }

    setIsPrinting(true)
    setPrintProgress(0)

    const productIds = items.map(item => item.product.id)
    const totalItems = items.length * copies
    const printJob: PrintJob = {
      id: `job-${Date.now()}`,
      productIds,
      printerId: outputMethod,
      status: 'printing',
      createdAt: new Date().toISOString(),
      copies
    }

    setPrintJobs(current => [...(current || []), printJob])

    try {
      if (outputMethod === 'pdf') {
        const resolution: LabelOutputResolution = {
          method: 'pdf',
          zebra: { available: false, reason: 'PDF selected' }
        }

        setOutputResolution(resolution)
        downloadLabelsPdf(expandCopies(items, copies), getBulkFilename(labelMode))
        setPrintProgress(100)

        setPrintJobs(current =>
          (current || []).map(j =>
            j.id === printJob.id
              ? { ...j, status: 'completed' as const, completedAt: new Date().toISOString() }
              : j
          )
        )

        toast.success(`PDF download started for ${totalItems} label${totalItems !== 1 ? 's' : ''}`, {
          description: getModeLabel(resolution)
        })

        onPrintComplete?.(productIds, labelMode)
        setSelectedProducts(new Set())
        return
      }

      const resolution = await resolveLabelOutputMethod(outputMethod)
      setOutputResolution(resolution)

      if (resolution.method === 'zebra') {
        let printed = 0
        for (const item of items) {
          for (let i = 0; i < copies; i++) {
            await sendZplToZebra(item.zpl)
            printed++
            setPrintProgress((printed / totalItems) * 100)
          }
        }
      } else {
        printLabelsInBrowser(expandCopies(items, copies), settings.labelSize)
        setPrintProgress(100)
      }

      setPrintJobs(current =>
        (current || []).map(j =>
          j.id === printJob.id
            ? { ...j, status: 'completed' as const, completedAt: new Date().toISOString() }
            : j
        )
      )

      toast.success(`Started output for ${totalItems} label${totalItems !== 1 ? 's' : ''}`, {
        description: getModeLabel(resolution)
      })

      onPrintComplete?.(productIds, labelMode)
      setSelectedProducts(new Set())
    } catch (error) {
      setPrintJobs(current =>
        (current || []).map(j =>
          j.id === printJob.id
            ? { ...j, status: 'failed' as const, errorMessage: error instanceof Error ? error.message : 'Print failed' }
            : j
        )
      )

      toast.error('Label output failed', {
        description: error instanceof Error ? error.message : 'Check the selected output method and try again'
      })
    } finally {
      setIsPrinting(false)
      setTimeout(() => setPrintProgress(0), 800)
    }
  }

  const handleDownloadPdf = () => {
    const items = buildPrintItems()

    if (items.length === 0) {
      toast.error('Please select products to download')
      return
    }

    try {
      downloadLabelsPdf(expandCopies(items, copies), getBulkFilename(labelMode))
      toast.success(`PDF download started for ${items.length * copies} label${items.length * copies !== 1 ? 's' : ''}`)
    } catch (error) {
      toast.error('PDF download failed', {
        description: error instanceof Error ? error.message : 'Unable to generate PDF'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer size={24} weight="fill" className="text-primary" />
            Bulk Label Output
          </DialogTitle>
          <DialogDescription>
            Select discount or price-change labels and output them through thermal, standard print, or PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
            <Card className="p-4">
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={labelMode === 'discount' ? 'default' : 'outline'}
                  onClick={() => {
                    setLabelMode('discount')
                    setSelectedProducts(new Set())
                  }}
                >
                  Discount Labels
                </Button>
                <Button
                  type="button"
                  variant={labelMode === 'price-change' ? 'default' : 'outline'}
                  onClick={() => {
                    setLabelMode('price-change')
                    setSelectedProducts(new Set(recentlyPriceChangedProducts.map(product => product.id)))
                  }}
                >
                  Recently Changed Prices
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Stack size={20} weight="bold" />
                  Select Products ({selectedProducts.size} selected)
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                {printableProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Tag size={48} weight="light" className="mx-auto mb-4 opacity-30" />
                    <p>
                      {labelMode === 'price-change'
                        ? 'No recent price changes available'
                        : 'No discounted products available'}
                    </p>
                    <p className="text-sm mt-2">
                      {labelMode === 'price-change'
                        ? 'Update prices first, then print all changed shelf labels here'
                        : 'Apply discounts to products first'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {printableProducts.map((product) => {
                      const discountInfo = calculateDiscountInfo(product)
                      const isSelected = selectedProducts.has(product.id)
                      const isPriceChangeLabel = labelMode === 'price-change'

                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleProductSelection(product.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {product.category}
                                    </Badge>
                                    {isPriceChangeLabel ? (
                                      <Badge variant="outline" className="text-xs">
                                        New shelf price
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        {discountInfo.discountPercentage}% OFF
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isPriceChangeLabel ? (
                                    <>
                                      <p className="text-xs text-muted-foreground">
                                        Updated {product.priceUpdatedAt ? new Date(product.priceUpdatedAt).toLocaleDateString() : ''}
                                      </p>
                                      <p className="text-lg font-bold text-primary">
                                        ${product.originalPrice.toFixed(2)}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm line-through text-muted-foreground">
                                        ${product.originalPrice.toFixed(2)}
                                      </p>
                                      <p className="text-lg font-bold text-primary">
                                        ${discountInfo.discountedPrice.toFixed(2)}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Printer size={20} weight="bold" />
                Output Method
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="output-method" className="text-sm font-medium">
                    Method
                  </Label>
                  <Select value={outputMethod} onValueChange={(val) => setOutputMethod(val as LabelOutputMethod)}>
                    <SelectTrigger id="output-method" className="mt-2">
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

                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    {isDetecting ? (
                      <>
                        <CircleNotch size={18} className="animate-spin text-muted-foreground" />
                        <Badge variant="outline">Looking for label printer...</Badge>
                      </>
                    ) : (
                      <>
                        {outputResolution?.method === 'zebra' ? (
                          <CheckCircle size={18} weight="fill" className="text-success" />
                        ) : outputResolution?.method === 'pdf' ? (
                          <FilePdf size={18} weight="bold" className="text-primary" />
                        ) : (
                          <Desktop size={18} weight="bold" className="text-primary" />
                        )}
                        <Badge variant={outputResolution?.method === 'zebra' ? 'default' : 'secondary'}>
                          {outputResolution ? getModeLabel(outputResolution) : 'Using standard print'}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {outputResolution?.fallbackReason || outputResolution?.zebra.deviceName || outputResolution?.zebra.reason || 'Auto checks Zebra Browser Print first, then uses standard print.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Print Settings</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="copies" className="text-sm font-medium">
                    Copies per Label
                  </Label>
                  <Input
                    id="copies"
                    type="number"
                    min={1}
                    max={10}
                    value={copies}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (val >= 1 && val <= 10) {
                        setCopies(val)
                        setSettings(prev => ({ ...prev, copies: val }))
                      }
                    }}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="label-size" className="text-sm font-medium">
                    Label Size
                  </Label>
                  <Select
                    value={settings.labelSize}
                    onValueChange={(val: 'small' | 'medium' | 'large') =>
                      setSettings(prev => ({ ...prev, labelSize: val }))
                    }
                  >
                    <SelectTrigger id="label-size" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (2" x 3")</SelectItem>
                      <SelectItem value="medium">Medium (4" x 6")</SelectItem>
                      <SelectItem value="large">Large (4" x 8")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="barcode"
                    checked={settings.includeBarcode}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, includeBarcode: checked as boolean }))
                    }
                  />
                  <Label htmlFor="barcode" className="text-sm cursor-pointer">
                    Include Barcode
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="qrcode"
                    checked={settings.includeQRCode}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, includeQRCode: checked as boolean }))
                    }
                  />
                  <Label htmlFor="qrcode" className="text-sm cursor-pointer">
                    Include QR Code
                  </Label>
                </div>
              </div>
            </Card>

            <Separator />

            <div className="space-y-2">
              {isPrinting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Outputting...</span>
                    <span className="font-medium">{Math.round(printProgress)}%</span>
                  </div>
                  <Progress value={printProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleBulkPrint}
                disabled={selectedProducts.size === 0 || isPrinting || isDetecting}
                className="w-full"
                size="lg"
              >
                {isPrinting ? (
                  <>
                    <CircleNotch size={20} weight="bold" className="mr-2 animate-spin" />
                    Outputting {Math.round(printProgress)}%
                  </>
                ) : (
                  <>
                    <Printer size={20} weight="bold" className="mr-2" />
                    Print {selectedProducts.size} Label{selectedProducts.size !== 1 ? 's' : ''}
                    {copies > 1 ? ` (x${copies})` : ''}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={selectedProducts.size === 0 || isPrinting}
                className="w-full"
              >
                <FilePdf size={18} weight="bold" className="mr-2" />
                Download Labels (PDF)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const expandCopies = (items: LabelPrintItem[], copies: number): LabelPrintItem[] => {
  return Array.from({ length: copies }).flatMap(() => items)
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

const getBulkFilename = (labelMode: BulkLabelMode): string => {
  const labelType = labelMode === 'price-change' ? 'price-change' : 'discount'
  return `freshsave-${labelType}-labels-${new Date().toISOString().slice(0, 10)}.pdf`
}
