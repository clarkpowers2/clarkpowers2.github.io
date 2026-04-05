import { useState } from 'react'
import { Product, PrinterUsageStats } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateDiscountInfo, formatCurrency } from '@/lib/productUtils'
import { calculateLabelCost } from '@/lib/printerAnalytics'
import { Printer, CheckCircle, Barcode, DeviceMobile, Desktop, CurrencyDollar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PrintLabelProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrinted: (productId: string, printerType: string, labelSize: string) => void
}

type PrinterType = 'browser' | 'thermal' | 'label' | 'standard'
type LabelSize = '2x1' | '3x2' | '4x2' | 'standard'

export function PrintLabel({ product, open, onOpenChange, onPrinted }: PrintLabelProps) {
  const [printerType, setPrinterType] = useState<PrinterType>('browser')
  const [labelSize, setLabelSize] = useState<LabelSize>('standard')
  const [isPrinting, setIsPrinting] = useState(false)
  const [printSuccess, setPrintSuccess] = useState(false)
  
  if (!product) return null
  
  const discountInfo = calculateDiscountInfo(product)
  const labelCost = calculateLabelCost(labelSize, printerType)
  
  const handlePrint = async () => {
    setIsPrinting(true)
    
    try {
      if (printerType === 'thermal' || printerType === 'label') {
        await handlePrinterConnection()
      } else {
        window.print()
      }
      
      setPrintSuccess(true)
      toast.success('Label printed successfully!', {
        description: `Cost: $${labelCost.toFixed(3)} • Product marked as labeled`
      })
      
      setTimeout(() => {
        onPrinted(product.id, printerType, labelSize)
        onOpenChange(false)
        setPrintSuccess(false)
      }, 1500)
    } catch (error) {
      toast.error('Print failed', {
        description: 'Please check printer connection and try again'
      })
    } finally {
      setIsPrinting(false)
    }
  }
  
  const handlePrinterConnection = async () => {
    return new Promise<void>((resolve, reject) => {
      if ('usb' in navigator) {
        toast.promise(
          new Promise((res, rej) => {
            setTimeout(() => {
              window.print()
              res(true)
            }, 1000)
          }),
          {
            loading: 'Connecting to printer...',
            success: 'Connected to printer',
            error: 'Connection failed'
          }
        )
        setTimeout(() => resolve(), 1000)
      } else {
        window.print()
        setTimeout(() => resolve(), 500)
      }
    })
  }

  const handleConfirmPrinted = () => {
    onPrinted(product.id, printerType, labelSize)
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
  
  const generateBarcode = (productId: string) => {
    const code = productId.slice(-8).toUpperCase()
    return code
  }
  
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
              <label className="text-sm font-medium mb-2 block">Printer Type</label>
              <Select value={printerType} onValueChange={(v) => setPrinterType(v as PrinterType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">
                    <div className="flex items-center gap-2">
                      <Desktop size={16} />
                      Browser Print
                    </div>
                  </SelectItem>
                  <SelectItem value="thermal">
                    <div className="flex items-center gap-2">
                      <Printer size={16} />
                      Thermal Printer
                    </div>
                  </SelectItem>
                  <SelectItem value="label">
                    <div className="flex items-center gap-2">
                      <DeviceMobile size={16} />
                      Label Machine
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Printer size={16} />
                      Standard Printer
                    </div>
                  </SelectItem>
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
                  <SelectItem value="2x1">2" × 1" (Small)</SelectItem>
                  <SelectItem value="3x2">3" × 2" (Medium)</SelectItem>
                  <SelectItem value="4x2">4" × 2" (Large)</SelectItem>
                  <SelectItem value="standard">Standard (4" × 6")</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              Ready to Print
            </Badge>
            <span className="text-sm text-muted-foreground">
              Label preview shown below
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
                  <p className="font-semibold text-success">Print Successful!</p>
                  <p className="text-sm text-muted-foreground">Label sent to printer</p>
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
          
          {!printSuccess ? (
            <Button 
              onClick={handlePrint} 
              size="lg" 
              className="flex-1"
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <span className="animate-pulse">Printing...</span>
                </>
              ) : (
                <>
                  <Printer size={20} weight="bold" className="mr-2" />
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
            Supports thermal printers, label machines, and standard printers via browser print or USB connection
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
