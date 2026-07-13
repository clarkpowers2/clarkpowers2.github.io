import { useEffect, useMemo, useState } from 'react'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/productUtils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowsClockwise, CurrencyDollar } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BulkPriceUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSave: (changes: Array<{ id: string; newPrice: number }>, reason: string) => Promise<void>
}

export function BulkPriceUpdateDialog({ open, onOpenChange, products, onSave }: BulkPriceUpdateDialogProps) {
  const editableProducts = useMemo(
    () => products.filter(product => product.status !== 'expired' && product.status !== 'sold'),
    [products]
  )
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    setDraftPrices(
      Object.fromEntries(
        editableProducts.map(product => [product.id, product.originalPrice.toFixed(2)])
      )
    )
    setReason('')
  }, [open, editableProducts])

  const changes = useMemo(() => {
    return editableProducts.flatMap(product => {
      const parsed = Number.parseFloat(draftPrices[product.id] ?? '')
      if (!Number.isFinite(parsed) || parsed <= 0) return []

      const rounded = Math.round(parsed * 100) / 100
      if (rounded === Math.round(product.originalPrice * 100) / 100) return []

      return [{ id: product.id, product, newPrice: rounded }]
    })
  }, [draftPrices, editableProducts])

  const handleSave = async () => {
    if (changes.length === 0) {
      toast.info('No price changes to save')
      return
    }

    const invalidRows = editableProducts.filter(product => {
      const parsed = Number.parseFloat(draftPrices[product.id] ?? '')
      return !Number.isFinite(parsed) || parsed <= 0
    })

    if (invalidRows.length > 0) {
      toast.error('Fix invalid prices before saving')
      return
    }

    setIsSaving(true)
    try {
      await onSave(
        changes.map(change => ({ id: change.id, newPrice: change.newPrice })),
        reason
      )
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CurrencyDollar size={24} weight="bold" className="text-primary" />
            Update Prices
          </DialogTitle>
          <DialogDescription>
            Edit regular shelf prices in bulk. This does not apply expiry markdowns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex flex-col">
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="price-change-reason">Reason</Label>
                <Input
                  id="price-change-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Vendor increase, weekly pricing update..."
                  disabled={isSaving}
                />
              </div>
              <Badge variant={changes.length > 0 ? 'default' : 'secondary'} className="justify-center px-4 py-2">
                {changes.length} changed
              </Badge>
            </div>
          </Card>

          <ScrollArea className="h-[52vh] rounded-md border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b bg-muted/60 px-4 py-3 text-sm font-medium">
                <span>Product</span>
                <span>Current</span>
                <span>New price</span>
                <span>Change</span>
              </div>

              {editableProducts.map(product => {
                const parsed = Number.parseFloat(draftPrices[product.id] ?? '')
                const isValid = Number.isFinite(parsed) && parsed > 0
                const newPrice = isValid ? Math.round(parsed * 100) / 100 : null
                const delta = newPrice == null ? null : newPrice - product.originalPrice

                return (
                  <div key={product.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className="capitalize">{product.category}</Badge>
                        {product.status !== 'pending' && (
                          <Badge variant="secondary" className="capitalize">{product.status}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center font-medium">
                      {formatCurrency(product.originalPrice)}
                    </div>

                    <div>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={draftPrices[product.id] ?? ''}
                        onChange={(event) => {
                          const value = event.target.value
                          setDraftPrices(current => ({ ...current, [product.id]: value }))
                        }}
                        disabled={isSaving}
                        className={!isValid ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                    </div>

                    <div className="flex items-center">
                      {delta == null || delta === 0 ? (
                        <span className="text-sm text-muted-foreground">No change</span>
                      ) : (
                        <Badge variant={delta > 0 ? 'default' : 'secondary'} className="gap-1">
                          <ArrowsClockwise size={14} weight="bold" />
                          {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || changes.length === 0}>
              {isSaving ? 'Saving...' : `Save ${changes.length} Price Change${changes.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
