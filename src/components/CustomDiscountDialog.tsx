import { useState } from 'react'
import { Product } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { calculateDiscountInfo, formatCurrency } from '@/lib/productUtils'
import { Percent, Sparkle } from '@phosphor-icons/react'

interface CustomDiscountDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (product: Product, customDiscount: number) => void
}

export function CustomDiscountDialog({ product, open, onOpenChange, onApply }: CustomDiscountDialogProps) {
  const [customDiscount, setCustomDiscount] = useState<number>(50)

  if (!product) return null

  const suggestedDiscountInfo = calculateDiscountInfo(product)
  const suggestedDiscount = suggestedDiscountInfo.discountPercentage

  const customDiscountedPrice = product.originalPrice * (1 - customDiscount / 100)

  const handleApply = () => {
    onApply(product, customDiscount)
    onOpenChange(false)
  }

  const handleInputChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= 99) {
      setCustomDiscount(num)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-primary" />
            Custom Discount Override
          </DialogTitle>
          <DialogDescription>
            Set a custom discount percentage for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Smart Suggested Discount</p>
              <p className="text-2xl font-bold text-primary">{suggestedDiscount}%</p>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              Auto-calculated
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-discount" className="text-base font-semibold">
                Custom Discount
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="custom-discount"
                  type="number"
                  min="0"
                  max="99"
                  value={customDiscount}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-20 text-center font-bold"
                />
                <Percent size={20} weight="bold" className="text-muted-foreground" />
              </div>
            </div>

            <Slider
              value={[customDiscount]}
              onValueChange={(value) => setCustomDiscount(value[0])}
              max={99}
              min={0}
              step={5}
              className="w-full"
            />

            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 75].map((preset) => (
                <Button
                  key={preset}
                  variant={customDiscount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomDiscount(preset)}
                >
                  {preset}%
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Original Price</span>
              <span className="text-lg font-medium line-through">{formatCurrency(product.originalPrice)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">New Sale Price</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(customDiscountedPrice)}</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">You save</span>
              <span className="font-semibold text-success">
                {formatCurrency(product.originalPrice - customDiscountedPrice)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="gap-2">
            <Percent size={20} weight="bold" />
            Apply {customDiscount}% Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
