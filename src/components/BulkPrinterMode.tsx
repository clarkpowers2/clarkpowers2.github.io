import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product } from '@/lib/types'
import { NetworkPrinter, PrintJob, BulkPrintSettings } from '@/lib/printerTypes'
import { 
  discoverNetworkPrinters, 
  sendToPrinter, 
  testPrinterConnection,
  getPrinterStatusColor,
  getPrinterStatusBadgeVariant,
  generateZPL
} from '@/lib/printerUtils'
import { calculateDiscountInfo } from '@/lib/productUtils'
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
  CheckCircle, 
  XCircle, 
  CircleNotch,
  WifiHigh,
  WifiX,
  Stack,
  Tag
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface BulkPrinterModeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onPrintComplete?: (productIds: string[]) => void
}

export function BulkPrinterMode({ open, onOpenChange, products, onPrintComplete }: BulkPrinterModeProps) {
  const [printers, setPrinters] = useKV<NetworkPrinter[]>('freshsave-pro-printers', [])
  const [printJobs, setPrintJobs] = useKV<PrintJob[]>('freshsave-pro-print-jobs', [])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [copies, setCopies] = useState(1)
  const [isScanning, setIsScanning] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printProgress, setPrintProgress] = useState(0)
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

  useEffect(() => {
    if (open && (!printers || printers.length === 0)) {
      scanForPrinters()
    }
  }, [open])

  useEffect(() => {
    if (printers && printers.length > 0 && !selectedPrinter) {
      const defaultPrinter = printers.find(p => p.isDefault)
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.id)
        setSettings(prev => ({ ...prev, printerId: defaultPrinter.id }))
      }
    }
  }, [printers, selectedPrinter])

  const scanForPrinters = async () => {
    setIsScanning(true)
    try {
      const discovered = await discoverNetworkPrinters()
      setPrinters(discovered)
      toast.success(`Found ${discovered.length} network printers`)
    } catch (error) {
      toast.error('Failed to scan for printers')
    } finally {
      setIsScanning(false)
    }
  }

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
    setSelectedProducts(new Set(discountedProducts.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedProducts(new Set())
  }

  const handleBulkPrint = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to print')
      return
    }

    if (!selectedPrinter) {
      toast.error('Please select a printer')
      return
    }

    const printer = printers?.find(p => p.id === selectedPrinter)
    if (!printer) {
      toast.error('Selected printer not found')
      return
    }

    setIsPrinting(true)
    setPrintProgress(0)

    const productsToPrint = Array.from(selectedProducts)
    const totalItems = productsToPrint.length * copies

    try {
      const isOnline = await testPrinterConnection(printer)
      if (!isOnline) {
        toast.error(`Printer "${printer.name}" is offline`)
        setIsPrinting(false)
        return
      }

      const printJob: PrintJob = {
        id: `job-${Date.now()}`,
        productIds: productsToPrint,
        printerId: printer.id,
        status: 'printing',
        createdAt: new Date().toISOString(),
        copies
      }

      setPrintJobs(current => [...(current || []), printJob])

      let printed = 0

      for (const productId of productsToPrint) {
        const product = products.find(p => p.id === productId)
        if (!product) continue

        const discountInfo = calculateDiscountInfo(product)

        const labelData = generateZPL({
          name: product.name,
          originalPrice: product.originalPrice,
          discountedPrice: discountInfo.discountedPrice,
          discountPercentage: discountInfo.discountPercentage,
          expiryDate: product.expiryDate,
          barcode: settings.includeBarcode ? `PRD${product.id.slice(-8)}` : undefined
        })

        for (let i = 0; i < copies; i++) {
          const result = await sendToPrinter(printer, labelData, 1)
          
          if (!result.success) {
            toast.error(`Print failed: ${result.error}`)
            setPrintJobs(current =>
              (current || []).map(j =>
                j.id === printJob.id
                  ? { ...j, status: 'failed' as const, errorMessage: result.error }
                  : j
              )
            )
            setIsPrinting(false)
            return
          }

          printed++
          setPrintProgress((printed / totalItems) * 100)
        }
      }

      setPrintJobs(current =>
        (current || []).map(j =>
          j.id === printJob.id
            ? { ...j, status: 'completed' as const, completedAt: new Date().toISOString() }
            : j
        )
      )

      toast.success(`Successfully printed ${totalItems} labels!`)
      
      if (onPrintComplete) {
        onPrintComplete(productsToPrint)
      }

      setSelectedProducts(new Set())
    } catch (error) {
      toast.error('Print job failed')
    } finally {
      setIsPrinting(false)
      setPrintProgress(0)
    }
  }

  const testPrint = async () => {
    if (!selectedPrinter) {
      toast.error('Please select a printer')
      return
    }

    const printer = printers?.find(p => p.id === selectedPrinter)
    if (!printer) return

    toast.info('Testing printer connection...')
    
    const isOnline = await testPrinterConnection(printer)
    if (isOnline) {
      toast.success(`Printer "${printer.name}" is ready!`)
    } else {
      toast.error(`Printer "${printer.name}" is offline`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer size={24} weight="fill" className="text-primary" />
            Bulk Printer Mode
          </DialogTitle>
          <DialogDescription>
            Select products and print labels in bulk to your network printer
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
            <Card className="p-4">
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
                {discountedProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Tag size={48} weight="light" className="mx-auto mb-4 opacity-30" />
                    <p>No discounted products available</p>
                    <p className="text-sm mt-2">Apply discounts to products first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {discountedProducts.map((product) => {
                      const discountInfo = calculateDiscountInfo(product)
                      const isSelected = selectedProducts.has(product.id)

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
                                    <Badge variant="outline" className="text-xs">
                                      {discountInfo.discountPercentage}% OFF
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm line-through text-muted-foreground">
                                    ${product.originalPrice.toFixed(2)}
                                  </p>
                                  <p className="text-lg font-bold text-primary">
                                    ${discountInfo.discountedPrice.toFixed(2)}
                                  </p>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Printer size={20} weight="bold" />
                  Network Printers
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={scanForPrinters}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <CircleNotch size={16} weight="bold" className="mr-2 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {!printers || printers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer size={40} weight="light" className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No printers found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={scanForPrinters}
                    >
                      Scan for Printers
                    </Button>
                  </div>
                ) : (
                  printers.map((printer) => (
                    <div
                      key={printer.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPrinter === printer.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedPrinter(printer.id)
                        setSettings(prev => ({ ...prev, printerId: printer.id }))
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {printer.status === 'online' ? (
                          <WifiHigh size={20} weight="bold" className="text-success mt-0.5" />
                        ) : (
                          <WifiX size={20} weight="bold" className="text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{printer.name}</p>
                          <p className="text-xs text-muted-foreground">{printer.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={getPrinterStatusBadgeVariant(printer.status)}
                              className="text-xs capitalize"
                            >
                              {printer.status.replace('-', ' ')}
                            </Badge>
                            {printer.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                      <SelectItem value="small">Small (2" × 3")</SelectItem>
                      <SelectItem value="medium">Medium (4" × 6")</SelectItem>
                      <SelectItem value="large">Large (4" × 8")</SelectItem>
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
                    <span className="text-muted-foreground">Printing...</span>
                    <span className="font-medium">{Math.round(printProgress)}%</span>
                  </div>
                  <Progress value={printProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleBulkPrint}
                disabled={selectedProducts.size === 0 || !selectedPrinter || isPrinting}
                className="w-full"
                size="lg"
              >
                {isPrinting ? (
                  <>
                    <CircleNotch size={20} weight="bold" className="mr-2 animate-spin" />
                    Printing {Math.round(printProgress)}%
                  </>
                ) : (
                  <>
                    <Printer size={20} weight="bold" className="mr-2" />
                    Print {selectedProducts.size} Label{selectedProducts.size !== 1 ? 's' : ''} 
                    {copies > 1 ? ` (×${copies})` : ''}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={testPrint}
                disabled={!selectedPrinter || isPrinting}
                className="w-full"
              >
                Test Printer Connection
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
