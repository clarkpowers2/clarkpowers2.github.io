import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCategory } from '@/lib/types'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank, Scan } from '@phosphor-icons/react'
import { format, parse } from 'date-fns'
import { ScannerDialog } from '@/components/ScannerDialog'
import { toast } from 'sonner'

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (product: {
    name: string
    category: ProductCategory
    originalPrice: number
    expiryDate: string
  }) => void
}

export function AddProductDialog({ open, onOpenChange, onAdd }: AddProductDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('other')
  const [price, setPrice] = useState('')
  const [expiryDate, setExpiryDate] = useState<Date>()
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price || !expiryDate) {
      return
    }
    
    onAdd({
      name,
      category,
      originalPrice: parseFloat(price),
      expiryDate: format(expiryDate, 'yyyy-MM-dd')
    })
    
    setName('')
    setCategory('other')
    setPrice('')
    setExpiryDate(undefined)
    onOpenChange(false)
  }

  const handleScanComplete = (data: { expiryDate: string; productName?: string; barcode?: string }) => {
    if (data.expiryDate) {
      try {
        const parsedDate = parse(data.expiryDate, 'yyyy-MM-dd', new Date())
        setExpiryDate(parsedDate)
        toast.success('Expiry date scanned!')
      } catch (error) {
        toast.error('Invalid date format')
      }
    }
    
    if (data.productName && !name) {
      setName(data.productName)
    }
    
    setScannerOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Organic Spinach"
              className="h-12"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ProductCategory)}>
              <SelectTrigger id="category" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produce">Produce</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="meat">Meat & Seafood</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="packaged">Packaged Goods</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">Original Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="h-12"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expiry Date</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 justify-start text-left font-normal"
                  >
                    <CalendarBlank size={20} weight="bold" className="mr-2" />
                    {expiryDate ? format(expiryDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const selectedDate = new Date(date)
                      selectedDate.setHours(0, 0, 0, 0)
                      return selectedDate < today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setScannerOpen(true)}
              >
                <Scan size={20} weight="bold" />
              </Button>
            </div>
          </div>
          
          <Button type="submit" size="lg" className="w-full mt-6">
            Add Product
          </Button>
        </form>
      </DialogContent>
      
      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanComplete={handleScanComplete}
      />
    </Dialog>
  )
}
