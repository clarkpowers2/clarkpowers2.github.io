import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, CurrencyDollar, Percent, 
  TrendUp, Tag, Minus, Plus 
} from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/productUtils'

export function PriceCalculator() {
  const [originalPrice, setOriginalPrice] = useState<string>('')
  const [discountPercent, setDiscountPercent] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')

  const calculateResults = () => {
    const price = parseFloat(originalPrice) || 0
    const discount = parseFloat(discountPercent) || 0
    const qty = parseInt(quantity) || 1

    const discountAmount = price * (discount / 100)
    const salePrice = price - discountAmount
    const totalOriginal = price * qty
    const totalSale = salePrice * qty
    const totalSavings = totalOriginal - totalSale

    return {
      price,
      discount,
      qty,
      discountAmount,
      salePrice,
      totalOriginal,
      totalSale,
      totalSavings
    }
  }

  const results = calculateResults()
  const hasValues = results.price > 0

  const quickDiscounts = [10, 25, 30, 40, 50, 60, 75, 90]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator size={24} weight="bold" className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Price Calculator</h2>
            <p className="text-sm text-muted-foreground">
              Calculate discounts and sale prices instantly
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="original-price" className="flex items-center gap-2">
                <Tag size={16} weight="bold" className="text-primary" />
                Original Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="original-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="pl-7 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-percent" className="flex items-center gap-2">
                <Percent size={16} weight="bold" className="text-primary" />
                Discount %
              </Label>
              <div className="relative">
                <Input
                  id="discount-percent"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="pr-7 text-lg font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="flex items-center gap-2">
                <Package size={16} weight="bold" className="text-primary" />
                Quantity
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((prev) => Math.max(1, parseInt(prev || '1') - 1).toString())}
                >
                  <Minus size={16} weight="bold" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((prev) => (parseInt(prev || '1') + 1).toString())}
                >
                  <Plus size={16} weight="bold" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Quick Discounts</Label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {quickDiscounts.map((percent) => (
                <Button
                  key={percent}
                  variant={discountPercent === percent.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountPercent(percent.toString())}
                  className="font-semibold"
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOriginalPrice('')
                setDiscountPercent('')
                setQuantity('1')
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {hasValues && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendUp size={20} weight="bold" className="text-primary" />
            Calculation Results
          </h3>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Original Price</span>
                  <Badge variant="outline">Per Item</Badge>
                </div>
                <p className="text-2xl font-bold line-through text-muted-foreground">
                  {formatCurrency(results.price)}
                </p>
              </div>

              <div className="space-y-3 p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Discount Amount</span>
                  <Badge variant="outline">Per Item</Badge>
                </div>
                <p className="text-2xl font-bold text-destructive">
                  -{formatCurrency(results.discountAmount)}
                </p>
              </div>
            </div>

            <div className="p-6 bg-primary rounded-lg text-primary-foreground">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">New Sale Price</span>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                  Per Item
                </Badge>
              </div>
              <p className="text-4xl font-bold">
                {formatCurrency(results.salePrice)}
              </p>
              <p className="text-sm opacity-90 mt-2">
                {results.discount}% off original price
              </p>
            </div>

            {results.qty > 1 && (
              <>
                <Separator />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CurrencyDollar size={18} weight="bold" className="text-primary" />
                    Total for {results.qty} items
                  </h4>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">Original Total</span>
                      <span className="text-lg font-bold line-through text-muted-foreground">
                        {formatCurrency(results.totalOriginal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">Sale Total</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(results.totalSale)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="text-sm font-medium text-success">Total Savings</span>
                      <span className="text-xl font-bold text-success">
                        {formatCurrency(results.totalSavings)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="p-4 bg-info/10 rounded-lg border border-info/20">
              <p className="text-sm text-info-foreground">
                <strong>Revenue Recovery:</strong> Selling {results.qty} item{results.qty > 1 ? 's' : ''} at {results.discount}% off 
                recovers <strong>{formatCurrency(results.totalSale)}</strong> vs. losing the full value if expired.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function Package({ size, weight, className }: { size: number; weight: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
    >
      <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z" />
    </svg>
  )
}
