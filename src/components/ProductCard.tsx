import { Product } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateDiscountInfo, formatCurrency, getUrgencyColor, getUrgencyBadgeColor, getCategoryIcon } from '@/lib/productUtils'
import { Tag, Printer, CheckCircle, Trash, Sparkle, Brain } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import * as PhosphorIcons from '@phosphor-icons/react'

interface ProductCardProps {
  product: Product
  onApplyDiscount: (product: Product) => void
  onCustomDiscount: (product: Product) => void
  onAIDiscount?: (product: Product) => void
  onPrintLabel: (product: Product) => void
  onRemove: (productId: string) => void
}

export function ProductCard({ product, onApplyDiscount, onCustomDiscount, onAIDiscount, onPrintLabel, onRemove }: ProductCardProps) {
  const discountInfo = calculateDiscountInfo(product)
  const urgencyColorClass = getUrgencyColor(discountInfo.urgencyLevel)
  const badgeColorClass = getUrgencyBadgeColor(discountInfo.urgencyLevel)
  
  const iconName = getCategoryIcon(product.category)
  const CategoryIcon = (PhosphorIcons as any)[iconName] || PhosphorIcons.Package
  
  const isExpired = discountInfo.urgencyLevel === 'expired'
  
  const urgencyLabels = {
    critical: 'Expires Today',
    high: 'Expires Tomorrow',
    medium: 'Expires in 3 Days',
    low: `Expires in ${discountInfo.daysUntilExpiry} Days`,
    expired: 'Expired'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`border-l-4 ${urgencyColorClass} ${isExpired ? 'opacity-60' : ''}`}>
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-muted rounded-lg">
              <CategoryIcon size={24} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
            </div>
            <Badge className={badgeColorClass}>
              {urgencyLabels[discountInfo.urgencyLevel]}
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original Price</p>
              <p className={`text-lg font-medium ${product.status !== 'pending' ? 'line-through text-muted-foreground' : ''}`}>
                {formatCurrency(product.originalPrice)}
              </p>
            </div>
            
            {!isExpired && product.status !== 'pending' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sale Price</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(discountInfo.discountedPrice)}
                </p>
              </div>
            )}
            
            {!isExpired && discountInfo.discountPercentage > 0 && (
              <div className="ml-auto">
                <Badge variant="outline" className="text-accent border-accent">
                  {discountInfo.discountPercentage}% OFF
                  {product.customDiscountPercentage !== undefined && (
                    <Sparkle size={14} weight="fill" className="ml-1 inline" />
                  )}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {isExpired ? (
              <Button
                onClick={() => onRemove(product.id)}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <Trash size={20} weight="bold" className="mr-2" />
                Remove
              </Button>
            ) : product.status === 'pending' ? (
              <>
                <Button
                  onClick={() => onApplyDiscount(product)}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Tag size={20} weight="bold" className="mr-2" />
                  Apply Discount
                </Button>
                {onAIDiscount && (
                  <Button
                    onClick={() => onAIDiscount(product)}
                    size="lg"
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Brain size={20} weight="bold" />
                  </Button>
                )}
                <Button
                  onClick={() => onCustomDiscount(product)}
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Sparkle size={20} weight="bold" />
                </Button>
              </>
            ) : product.status === 'discounted' ? (
              <Button
                onClick={() => onPrintLabel(product)}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <Printer size={20} weight="bold" className="mr-2" />
                Print Label
              </Button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 text-success py-2">
                <CheckCircle size={20} weight="bold" />
                <span className="font-semibold">Label Printed</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
