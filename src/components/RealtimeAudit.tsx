import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calculator, 
  TrendUp, 
  TrendDown, 
  Receipt, 
  CheckCircle,
  Tag,
  Package,
  CurrencyDollar,
  ChartBar,
  Plus,
  Minus,
  Percent
} from '@phosphor-icons/react'
import { Product } from '@/lib/types'
import { calculateDiscountInfo } from '@/lib/productUtils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface RealtimeAuditProps {
  products: Product[]
}

interface ManualEntry {
  id: string
  productName: string
  originalPrice: number
  discountPercentage: number
  discountedPrice: number
  timestamp: Date
}

export function RealtimeAudit({ products }: RealtimeAuditProps) {
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])
  const [manualProductName, setManualProductName] = useState('')
  const [manualOriginalPrice, setManualOriginalPrice] = useState('')
  const [manualDiscount, setManualDiscount] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)

  const auditData = useMemo(() => {
    const discountedProducts = products.filter(p => 
      p.status === 'discounted' || p.status === 'labeled' || p.status === 'sold'
    )

    let totalOriginalValue = 0
    let totalDiscountedValue = 0
    let totalSavingsGiven = 0
    let categoryBreakdown: Record<string, { count: number; savings: number; revenue: number }> = {}

    discountedProducts.forEach(product => {
      const info = calculateDiscountInfo(product)
      const savings = product.originalPrice - info.discountedPrice

      totalOriginalValue += product.originalPrice
      totalDiscountedValue += info.discountedPrice
      totalSavingsGiven += savings

      if (!categoryBreakdown[product.category]) {
        categoryBreakdown[product.category] = { count: 0, savings: 0, revenue: 0 }
      }
      categoryBreakdown[product.category].count++
      categoryBreakdown[product.category].savings += savings
      categoryBreakdown[product.category].revenue += info.discountedPrice
    })

    manualEntries.forEach(entry => {
      const savings = entry.originalPrice - entry.discountedPrice
      totalOriginalValue += entry.originalPrice
      totalDiscountedValue += entry.discountedPrice
      totalSavingsGiven += savings

      const category = 'manual'
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, savings: 0, revenue: 0 }
      }
      categoryBreakdown[category].count++
      categoryBreakdown[category].savings += savings
      categoryBreakdown[category].revenue += entry.discountedPrice
    })

    const averageDiscountPercentage = totalOriginalValue > 0 
      ? ((totalSavingsGiven / totalOriginalValue) * 100)
      : 0

    return {
      totalItems: discountedProducts.length + manualEntries.length,
      systemItems: discountedProducts.length,
      manualItems: manualEntries.length,
      totalOriginalValue,
      totalDiscountedValue,
      totalSavingsGiven,
      averageDiscountPercentage,
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
    }
  }, [products, manualEntries])

  const handleAddManualEntry = () => {
    const originalPrice = parseFloat(manualOriginalPrice)
    const discountPercentage = parseFloat(manualDiscount)

    if (!manualProductName || isNaN(originalPrice) || isNaN(discountPercentage)) {
      toast.error('Invalid input', {
        description: 'Please fill all fields with valid values'
      })
      return
    }

    if (originalPrice <= 0 || discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Invalid values', {
        description: 'Price must be positive, discount between 0-100%'
      })
      return
    }

    const discountedPrice = originalPrice * (1 - discountPercentage / 100)

    const newEntry: ManualEntry = {
      id: `manual-${Date.now()}`,
      productName: manualProductName,
      originalPrice,
      discountPercentage,
      discountedPrice,
      timestamp: new Date()
    }

    setManualEntries(prev => [newEntry, ...prev])
    
    setManualProductName('')
    setManualOriginalPrice('')
    setManualDiscount('')
    setShowManualForm(false)

    toast.success('Manual entry added!', {
      description: `${discountPercentage}% discount - $${discountedPrice.toFixed(2)}`
    })
  }

  const handleRemoveManualEntry = (id: string) => {
    setManualEntries(prev => prev.filter(e => e.id !== id))
    toast.success('Entry removed')
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Receipt size={28} weight="bold" className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Real-time Discount Audit</h2>
              <p className="text-sm text-muted-foreground">Live tracking of all discounts applied</p>
            </div>
          </div>
          <Badge className="bg-success text-success-foreground text-base px-4 py-2">
            <CheckCircle size={18} weight="bold" className="mr-2" />
            Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Package size={20} weight="bold" className="text-info" />
              <span className="text-sm font-medium text-muted-foreground">Total Items</span>
            </div>
            <p className="text-3xl font-bold">{auditData.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {auditData.systemItems} system + {auditData.manualItems} manual
            </p>
          </Card>

          <Card className="p-4 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyDollar size={20} weight="bold" className="text-success" />
              <span className="text-sm font-medium text-muted-foreground">Revenue Generated</span>
            </div>
            <p className="text-3xl font-bold text-success">${auditData.totalDiscountedValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              from ${auditData.totalOriginalValue.toFixed(2)} original
            </p>
          </Card>

          <Card className="p-4 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={20} weight="bold" className="text-warning" />
              <span className="text-sm font-medium text-muted-foreground">Total Savings Given</span>
            </div>
            <p className="text-3xl font-bold text-warning">${auditData.totalSavingsGiven.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              customer discounts
            </p>
          </Card>

          <Card className="p-4 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Percent size={20} weight="bold" className="text-accent" />
              <span className="text-sm font-medium text-muted-foreground">Avg Discount</span>
            </div>
            <p className="text-3xl font-bold text-accent">{auditData.averageDiscountPercentage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              across all items
            </p>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBar size={20} weight="bold" className="text-primary" />
              Category Breakdown
            </h3>
            <ScrollArea className="h-72">
              <div className="space-y-3 pr-4">
                {auditData.categoryBreakdown.length > 0 ? (
                  auditData.categoryBreakdown.map((cat) => (
                    <Card key={cat.category} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold capitalize">{cat.category}</h4>
                        <Badge variant="outline">{cat.count} items</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium text-success">${cat.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Savings Given:</span>
                          <span className="font-medium text-warning">${cat.savings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Discount:</span>
                          <span className="font-medium text-accent">
                            {((cat.savings / (cat.revenue + cat.savings)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">No discounted items yet</p>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator size={20} weight="bold" className="text-accent" />
                Manual Discount Entry
              </h3>
              {!showManualForm && (
                <Button
                  onClick={() => setShowManualForm(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus size={16} weight="bold" className="mr-2" />
                  Add Entry
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showManualForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Card className="p-4 bg-accent/5 border-accent/30">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="manual-product-name">Product Name</Label>
                        <Input
                          id="manual-product-name"
                          value={manualProductName}
                          onChange={(e) => setManualProductName(e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="manual-original-price">Original Price ($)</Label>
                          <Input
                            id="manual-original-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={manualOriginalPrice}
                            onChange={(e) => setManualOriginalPrice(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-discount">Discount (%)</Label>
                          <Input
                            id="manual-discount"
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={manualDiscount}
                            onChange={(e) => setManualDiscount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {manualOriginalPrice && manualDiscount && (
                        <Card className="p-3 bg-background/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discounted Price:</span>
                            <span className="font-bold text-success">
                              ${(parseFloat(manualOriginalPrice) * (1 - parseFloat(manualDiscount) / 100)).toFixed(2)}
                            </span>
                          </div>
                        </Card>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={handleAddManualEntry} className="flex-1">
                          <Plus size={16} weight="bold" className="mr-2" />
                          Add to Audit
                        </Button>
                        <Button
                          onClick={() => {
                            setShowManualForm(false)
                            setManualProductName('')
                            setManualOriginalPrice('')
                            setManualDiscount('')
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {manualEntries.length > 0 ? (
                  manualEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Card className="p-3 bg-accent/5 border-accent/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                Manual
                              </Badge>
                              <span className="text-sm font-medium">{entry.productName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Original: </span>
                                <span className="font-medium">${entry.originalPrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Discount: </span>
                                <span className="font-medium text-accent">{entry.discountPercentage}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Final: </span>
                                <span className="font-medium text-success">${entry.discountedPrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Saved: </span>
                                <span className="font-medium text-warning">
                                  ${(entry.originalPrice - entry.discountedPrice).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleRemoveManualEntry(entry.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Minus size={16} weight="bold" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <Calculator size={40} weight="bold" className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">No manual entries yet</p>
                    <p className="text-xs text-muted-foreground">
                      Add manual discount entries to include them in the audit totals
                    </p>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendUp size={16} weight="bold" className="text-success" />
            <span>Revenue recovery rate: {auditData.totalOriginalValue > 0 
              ? ((auditData.totalDiscountedValue / auditData.totalOriginalValue) * 100).toFixed(1)
              : 0}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendDown size={16} weight="bold" className="text-warning" />
            <span>Discount rate: {auditData.averageDiscountPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
