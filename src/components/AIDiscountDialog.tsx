import { useState, useEffect } from 'react'
import { Product, AIDiscountSuggestion } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { calculateDiscountInfo, formatCurrency } from '@/lib/productUtils'
import { Sparkle, Percent, Brain, TrendUp, Clock, Tag } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AIDiscountDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (product: Product, customDiscount: number) => void
}

export function AIDiscountDialog({ product, open, onOpenChange, onApply }: AIDiscountDialogProps) {
  const [customDiscount, setCustomDiscount] = useState<number>(50)
  const [aiSuggestion, setAiSuggestion] = useState<AIDiscountSuggestion | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product && open) {
      generateAISuggestion()
    }
  }, [product, open])

  const generateAISuggestion = async () => {
    if (!product) return
    
    setLoading(true)
    
    try {
      const discountInfo = calculateDiscountInfo(product)
      const currentHour = new Date().getHours()
      const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'
      
      const promptText = `You are a retail pricing expert for a grocery store. Analyze this product and suggest an optimal discount percentage to maximize revenue recovery while ensuring the product sells before expiration.

Product Details:
- Name: ${product.name}
- Category: ${product.category}
- Original Price: $${product.originalPrice}
- Days Until Expiry: ${discountInfo.daysUntilExpiry}
- Time of Day: ${timeOfDay}
- Auto-calculated Discount: ${discountInfo.discountPercentage}%

Provide your recommendation as a JSON object with:
- suggestedDiscount: number (the percentage discount you recommend, 5-90)
- reasoning: string (brief explanation of your recommendation in 1-2 sentences)
- confidence: number (0-100, how confident you are in this recommendation)
- factors: object with keys: categoryRisk (high/medium/low), timeOfDay (peak/moderate/slow), marketDemand (high/medium/low)

Consider:
- Meat/dairy need aggressive discounts (50-75%) when close to expiry
- Evening hours should have higher discounts (add 10-15%)
- Produce can handle moderate discounts (30-50%)
- Bakery items need quick turnover (40-60%)
- Same-day expiry should be 60-90% off

Return only the JSON object.`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const suggestion: AIDiscountSuggestion = JSON.parse(response)
      
      setAiSuggestion(suggestion)
      setCustomDiscount(suggestion.suggestedDiscount)
    } catch (error) {
      console.error('AI suggestion error:', error)
      toast.error('AI assist temporarily unavailable')
      const fallback = calculateDiscountInfo(product)
      setCustomDiscount(fallback.discountPercentage)
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  const suggestedDiscountInfo = calculateDiscountInfo(product)
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain size={24} weight="fill" className="text-accent" />
            AI-Powered Discount Assistant
          </DialogTitle>
          <DialogDescription>
            Smart pricing recommendations for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <Card className="p-6">
              <div className="flex items-center justify-center gap-3">
                <Sparkle size={24} weight="fill" className="text-accent animate-pulse" />
                <p className="text-muted-foreground">AI analyzing optimal pricing...</p>
              </div>
            </Card>
          ) : aiSuggestion ? (
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkle size={20} weight="fill" className="text-accent" />
                      <h3 className="font-semibold text-lg">AI Recommendation</h3>
                    </div>
                    <p className="text-3xl font-bold text-accent">{aiSuggestion.suggestedDiscount}% OFF</p>
                  </div>
                  <Badge variant="outline" className="border-accent text-accent">
                    {aiSuggestion.confidence}% confident
                  </Badge>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiSuggestion.reasoning}
                </p>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-start gap-2">
                    <Tag size={18} weight="bold" className="text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Category Risk</p>
                      <p className="font-medium capitalize text-sm">{aiSuggestion.factors.categoryRisk}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={18} weight="bold" className="text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time of Day</p>
                      <p className="font-medium capitalize text-sm">{aiSuggestion.factors.timeOfDay}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendUp size={18} weight="bold" className="text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Market Demand</p>
                      <p className="font-medium capitalize text-sm">{aiSuggestion.factors.marketDemand}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={18} weight="bold" className="text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Days Left</p>
                      <p className="font-medium text-sm">{suggestedDiscountInfo.daysUntilExpiry}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Auto-Calculated Discount</p>
              <p className="text-2xl font-bold text-primary">{suggestedDiscountInfo.discountPercentage}%</p>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              System Default
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-discount" className="text-base font-semibold">
                Final Discount
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
