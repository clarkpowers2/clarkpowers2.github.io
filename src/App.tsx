import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product } from '@/lib/types'
import { StatCard } from '@/components/StatCard'
import { ProductCard } from '@/components/ProductCard'
import { AddProductDialog } from '@/components/AddProductDialog'
import { PrintLabel } from '@/components/PrintLabel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Sparkle } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { calculateDiscountInfo, calculateDaysUntilExpiry } from '@/lib/productUtils'
import { motion } from 'framer-motion'

function App() {
  const [products, setProducts] = useKV<Product[]>('fresh-save-products', [])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [printProduct, setPrintProduct] = useState<Product | null>(null)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)

  const stats = useMemo(() => {
    const productList = products || []
    const today = productList.filter(p => {
      const days = calculateDaysUntilExpiry(p.expiryDate)
      return days === 1
    }).length

    const discountedProducts = productList.filter(p => p.status !== 'pending' && p.status !== 'expired')
    const potentialRevenue = discountedProducts.reduce((sum, p) => {
      const discountInfo = calculateDiscountInfo(p)
      return sum + discountInfo.discountedPrice
    }, 0)

    return {
      expiringToday: today,
      totalProducts: productList.length,
      potentialRevenue: potentialRevenue.toFixed(2)
    }
  }, [products])

  const groupedProducts = useMemo(() => {
    const groups = {
      today: [] as Product[],
      tomorrow: [] as Product[],
      thisWeek: [] as Product[],
      expired: [] as Product[]
    }

    const productList = products || []
    productList.forEach(product => {
      const discountInfo = calculateDiscountInfo(product)
      
      if (discountInfo.urgencyLevel === 'expired') {
        groups.expired.push(product)
      } else if (discountInfo.urgencyLevel === 'critical') {
        groups.today.push(product)
      } else if (discountInfo.urgencyLevel === 'high') {
        groups.tomorrow.push(product)
      } else {
        groups.thisWeek.push(product)
      }
    })

    return groups
  }, [products])

  const handleAddProduct = (productData: {
    name: string
    category: Product['category']
    originalPrice: number
    expiryDate: string
  }) => {
    const newProduct: Product = {
      ...productData,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      dateAdded: new Date().toISOString()
    }
    
    setProducts(currentProducts => [...(currentProducts || []), newProduct])
    toast.success('Product added successfully!')
  }

  const handleApplyDiscount = (product: Product) => {
    setProducts(currentProducts =>
      (currentProducts || []).map(p =>
        p.id === product.id ? { ...p, status: 'discounted' as const } : p
      )
    )
    toast.success('Discount applied!', {
      description: 'Ready to print label'
    })
  }

  const handlePrintLabel = (product: Product) => {
    setPrintProduct(product)
    setPrintDialogOpen(true)
  }

  const handlePrinted = (productId: string) => {
    setProducts(currentProducts =>
      (currentProducts || []).map(p =>
        p.id === productId ? { ...p, status: 'labeled' as const } : p
      )
    )
    toast.success('Label printed successfully!')
  }

  const handleRemove = (productId: string) => {
    setProducts(currentProducts => (currentProducts || []).filter(p => p.id !== productId))
    toast.success('Product removed')
  }

  const hasProducts = (products || []).length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Toaster position="top-center" richColors />
      
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkle size={28} weight="fill" className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">FreshSave</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="clock"
            label="Expiring Today"
            value={stats.expiringToday}
            color="accent"
          />
          <StatCard
            icon="package"
            label="Total Products"
            value={stats.totalProducts}
            color="info"
          />
          <StatCard
            icon="dollar"
            label="Revenue Recovery"
            value={`$${stats.potentialRevenue}`}
            color="primary"
          />
          <StatCard
            icon="trending"
            label="Items Discounted"
            value={(products || []).filter(p => p.status !== 'pending' && p.status !== 'expired').length}
            color="warning"
          />
        </div>

        {!hasProducts ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkle size={40} weight="fill" className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No products yet</h2>
            <p className="text-muted-foreground mb-6">
              Add your first expiring product to get started
            </p>
            <Button onClick={() => setAddDialogOpen(true)} size="lg">
              <Plus size={20} weight="bold" className="mr-2" />
              Add Product
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {groupedProducts.today.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-destructive rounded-full" />
                  Expires Today
                </h2>
                <div className="grid gap-4">
                  {groupedProducts.today.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onApplyDiscount={handleApplyDiscount}
                      onPrintLabel={handlePrintLabel}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedProducts.tomorrow.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-accent rounded-full" />
                  Expires Tomorrow
                </h2>
                <div className="grid gap-4">
                  {groupedProducts.tomorrow.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onApplyDiscount={handleApplyDiscount}
                      onPrintLabel={handlePrintLabel}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedProducts.thisWeek.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-info rounded-full" />
                  Expires This Week
                </h2>
                <div className="grid gap-4">
                  {groupedProducts.thisWeek.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onApplyDiscount={handleApplyDiscount}
                      onPrintLabel={handlePrintLabel}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedProducts.expired.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                    <span className="w-1 h-8 bg-muted-foreground rounded-full" />
                    Expired
                  </h2>
                  <div className="grid gap-4">
                    {groupedProducts.expired.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onApplyDiscount={handleApplyDiscount}
                        onPrintLabel={handlePrintLabel}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 no-print">
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus size={24} weight="bold" />
        </Button>
      </div>

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddProduct}
      />

      <PrintLabel
        product={printProduct}
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrinted={handlePrinted}
      />
    </div>
  )
}

export default App
