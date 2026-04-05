import { Product } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { calculateDiscountInfo, formatCurrency } from '@/lib/productUtils'
import { Printer } from '@phosphor-icons/react'

interface PrintLabelProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrinted: (productId: string) => void
}

export function PrintLabel({ product, open, onOpenChange, onPrinted }: PrintLabelProps) {
  if (!product) return null
  
  const discountInfo = calculateDiscountInfo(product)
  
  const handlePrint = () => {
    window.print()
    onPrinted(product.id)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="no-print">
          <DialogTitle className="text-2xl font-bold">Print Price Label</DialogTitle>
        </DialogHeader>
        
        <div id="print-label" className="p-8 border-2 border-dashed border-border rounded-lg bg-white text-black">
          <div className="text-center space-y-4">
            <div className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-lg">
              <p className="text-3xl font-black uppercase tracking-wide">SALE</p>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2 leading-tight">{product.name}</h2>
              <p className="text-lg text-gray-600 capitalize">{product.category}</p>
            </div>
            
            <div className="py-4 border-y-2 border-gray-300">
              <p className="text-sm text-gray-500 mb-2">Was</p>
              <p className="text-3xl font-bold line-through text-gray-400">
                {formatCurrency(product.originalPrice)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Now</p>
              <p className="text-6xl font-black text-accent">
                {formatCurrency(discountInfo.discountedPrice)}
              </p>
            </div>
            
            <div className="pt-4">
              <p className="text-2xl font-bold text-accent">
                SAVE {discountInfo.discountPercentage}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 no-print">
          <Button onClick={() => onOpenChange(false)} variant="outline" size="lg" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePrint} size="lg" className="flex-1">
            <Printer size={20} weight="bold" className="mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
