import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, Store, Activity, Notification } from '@/lib/types'
import { calculateRevenueMetrics, calculatePotentialRevenue, generateRevenueChartData } from '@/lib/analytics'
import { RevenueCard } from '@/components/RevenueCard'
import { RevenueChart } from '@/components/RevenueChart'
import { ActivityLog } from '@/components/ActivityLog'
import { ProductCard } from '@/components/ProductCard'
import { AddProductDialog } from '@/components/AddProductDialog'
import { CreateStoreDialog } from '@/components/CreateStoreDialog'
import { PrintLabel } from '@/components/PrintLabel'
import { CustomDiscountDialog } from '@/components/CustomDiscountDialog'
import { AIDiscountDialog } from '@/components/AIDiscountDialog'
import { StaffAlertsPanel } from '@/components/StaffAlertsPanel'
import { PriceCalculator } from '@/components/PriceCalculator'
import { ScannerDialog } from '@/components/ScannerDialog'
import { AIChatBot } from '@/components/AIChatBot'
import { TodaysActionList } from '@/components/TodaysActionList'
import { RealtimeAudit } from '@/components/RealtimeAudit'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, ChartLine, Package, ClockCountdown, Storefront,
  CurrencyDollar, ShoppingCart, WarningCircle, Bell, Calculator, Brain, Scan, Receipt
} from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { calculateDiscountInfo, calculateDaysUntilExpiry } from '@/lib/productUtils'
import { motion } from 'framer-motion'

function App() {
  const [products, setProducts] = useKV<Product[]>('freshsave-pro-products', [])
  const [stores, setStores] = useKV<Store[]>('freshsave-pro-stores', [])
  const [activities, setActivities] = useKV<Activity[]>('freshsave-pro-activities', [])
  const [notifications, setNotifications] = useKV<Notification[]>('freshsave-pro-notifications', [])
  const [currentStoreId, setCurrentStoreId] = useState<string>('')
  
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [createStoreDialogOpen, setCreateStoreDialogOpen] = useState(false)
  const [printProduct, setPrintProduct] = useState<Product | null>(null)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [customDiscountProduct, setCustomDiscountProduct] = useState<Product | null>(null)
  const [customDiscountDialogOpen, setCustomDiscountDialogOpen] = useState(false)
  const [aiDiscountProduct, setAiDiscountProduct] = useState<Product | null>(null)
  const [aiDiscountDialogOpen, setAiDiscountDialogOpen] = useState(false)
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false)
  const [aiChatBotOpen, setAiChatBotOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (!stores || stores.length === 0) {
      const demoStore: Store = {
        id: 'store-demo-1',
        name: 'FreshMart Downtown',
        location: '123 Main St',
        createdAt: new Date().toISOString()
      }
      
      setStores([demoStore])
      setCurrentStoreId(demoStore.id)
      
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const demoProducts: Product[] = [
        {
          id: 'product-demo-1',
          name: 'Organic Chicken Breast',
          category: 'meat',
          originalPrice: 9.99,
          expiryDate: formatDate(today),
          status: 'pending',
          dateAdded: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          storeId: demoStore.id
        },
        {
          id: 'product-demo-2',
          name: 'Fresh Whole Milk',
          category: 'dairy',
          originalPrice: 4.99,
          expiryDate: formatDate(tomorrow),
          status: 'pending',
          dateAdded: new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          storeId: demoStore.id
        },
        {
          id: 'product-demo-3',
          name: 'Mixed Berry Pack',
          category: 'fruit',
          originalPrice: 3.49,
          expiryDate: formatDate(tomorrow),
          status: 'pending',
          dateAdded: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          storeId: demoStore.id
        }
      ]
      
      setProducts(demoProducts)
      
      toast.success('Welcome to FreshSave Pro!', {
        description: 'Demo data loaded. Start by applying discounts to expiring items.'
      })
    } else if (!currentStoreId && stores.length > 0) {
      setCurrentStoreId(stores[0].id)
    }
  }, [stores, currentStoreId, setStores, setProducts])

  useEffect(() => {
    if (!currentStoreId) return

    const storeProducts = (products || []).filter(p => p.storeId === currentStoreId)
    const expiringToday = storeProducts.filter(p => {
      const days = calculateDaysUntilExpiry(p.expiryDate)
      return days === 1 && p.status === 'pending'
    })

    if (expiringToday.length > 0) {
      const existingNotif = (notifications || []).find(
        n => n.storeId === currentStoreId && n.type === 'daily_expiring' && !n.read
      )

      if (!existingNotif) {
        const potential = expiringToday.reduce((sum, p) => {
          const info = calculateDiscountInfo(p)
          return sum + info.discountedPrice
        }, 0)

        const notification: Notification = {
          id: `notif-${Date.now()}`,
          storeId: currentStoreId,
          type: 'daily_expiring',
          title: 'Items Expiring Today',
          message: `${expiringToday.length} items need immediate attention`,
          count: expiringToday.length,
          potentialRevenue: potential,
          timestamp: new Date().toISOString(),
          read: false
        }

        setNotifications(current => [...(current || []), notification])
      }
    }
  }, [currentStoreId, products, notifications, setNotifications])

  const currentStore = stores?.find(s => s.id === currentStoreId)
  const storeProducts = useMemo(() => 
    (products || []).filter(p => p.storeId === currentStoreId),
    [products, currentStoreId]
  )

  const revenueMetrics = useMemo(() => 
    calculateRevenueMetrics(storeProducts),
    [storeProducts]
  )

  const potentialRevenue = useMemo(() => 
    calculatePotentialRevenue(storeProducts),
    [storeProducts]
  )

  const revenueChartData = useMemo(() => 
    generateRevenueChartData(storeProducts, 7),
    [storeProducts]
  )

  const storeActivities = useMemo(() => 
    (activities || []).filter(a => a.storeId === currentStoreId),
    [activities, currentStoreId]
  )

  const unreadNotifications = useMemo(() => 
    (notifications || []).filter(n => n.storeId === currentStoreId && !n.read),
    [notifications, currentStoreId]
  )

  const groupedProducts = useMemo(() => {
    const groups = {
      today: [] as Product[],
      tomorrow: [] as Product[],
      thisWeek: [] as Product[],
      expired: [] as Product[]
    }

    storeProducts.forEach(product => {
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
  }, [storeProducts])

  const handleCreateStore = (storeData: { name: string; location: string }) => {
    const newStore: Store = {
      id: `store-${Date.now()}`,
      name: storeData.name,
      location: storeData.location,
      createdAt: new Date().toISOString()
    }
    
    setStores(current => [...(current || []), newStore])
    setCurrentStoreId(newStore.id)
    toast.success('Store created successfully!')
  }

  const handleAddProduct = (productData: {
    name: string
    category: Product['category']
    originalPrice: number
    expiryDate: string
  }) => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    const newProduct: Product = {
      ...productData,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      dateAdded: new Date().toISOString(),
      storeId: currentStoreId
    }
    
    setProducts(current => [...(current || []), newProduct])

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      storeId: currentStoreId,
      productId: newProduct.id,
      productName: newProduct.name,
      action: 'product_added',
      staffMember: 'Current User',
      timestamp: new Date().toISOString()
    }
    setActivities(current => [...(current || []), activity])

    toast.success('Product added successfully!')
  }

  const handleApplyDiscount = (product: Product) => {
    const discountInfo = calculateDiscountInfo(product)
    
    setProducts(current =>
      (current || []).map(p =>
        p.id === product.id ? { 
          ...p, 
          status: 'discounted' as const,
          discountedBy: 'Current User',
          discountedAt: new Date().toISOString()
        } : p
      )
    )

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      storeId: currentStoreId,
      productId: product.id,
      productName: product.name,
      action: 'discount_applied',
      staffMember: 'Current User',
      timestamp: new Date().toISOString(),
      metadata: {
        originalPrice: product.originalPrice,
        discountedPrice: discountInfo.discountedPrice,
        discountPercentage: discountInfo.discountPercentage
      }
    }
    setActivities(current => [...(current || []), activity])

    toast.success('Discount applied!', {
      description: `${discountInfo.discountPercentage}% off - Ready to print label`
    })
  }

  const handleCustomDiscount = (product: Product) => {
    setCustomDiscountProduct(product)
    setCustomDiscountDialogOpen(true)
  }

  const handleApplyCustomDiscount = (product: Product, customDiscount: number) => {
    const customDiscountedPrice = product.originalPrice * (1 - customDiscount / 100)
    
    setProducts(current =>
      (current || []).map(p =>
        p.id === product.id ? { 
          ...p,
          customDiscountPercentage: customDiscount,
          status: 'discounted' as const,
          discountedBy: 'Current User',
          discountedAt: new Date().toISOString()
        } : p
      )
    )

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      storeId: currentStoreId,
      productId: product.id,
      productName: product.name,
      action: 'discount_applied',
      staffMember: 'Current User',
      timestamp: new Date().toISOString(),
      metadata: {
        originalPrice: product.originalPrice,
        discountedPrice: customDiscountedPrice,
        discountPercentage: customDiscount
      }
    }
    setActivities(current => [...(current || []), activity])

    toast.success('Custom discount applied!', {
      description: `${customDiscount}% off (Manual Override) - Ready to print label`
    })
  }

  const handleAIDiscount = (product: Product) => {
    setAiDiscountProduct(product)
    setAiDiscountDialogOpen(true)
  }

  const handleDismissNotification = (notificationId: string) => {
    setNotifications(current =>
      (current || []).map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const handleViewAffectedProducts = (productIds: string[]) => {
    setActiveTab('products')
    toast.info(`Showing ${productIds.length} affected products`)
  }

  const handleScanComplete = (data: { expiryDate: string; productName?: string; barcode?: string }) => {
    if (data.expiryDate) {
      setAddDialogOpen(true)
    }
  }

  const handlePrintLabel = (product: Product) => {
    setPrintProduct(product)
    setPrintDialogOpen(true)
  }

  const handlePrinted = (productId: string) => {
    setProducts(current =>
      (current || []).map(p =>
        p.id === productId ? { 
          ...p, 
          status: 'labeled' as const,
          labeledBy: 'Current User',
          labeledAt: new Date().toISOString()
        } : p
      )
    )

    const product = storeProducts.find(p => p.id === productId)
    if (product) {
      const activity: Activity = {
        id: `activity-${Date.now()}`,
        storeId: currentStoreId,
        productId: product.id,
        productName: product.name,
        action: 'label_printed',
        staffMember: 'Current User',
        timestamp: new Date().toISOString()
      }
      setActivities(current => [...(current || []), activity])
    }

    toast.success('Label printed successfully!')
  }

  const handleRemove = (productId: string) => {
    setProducts(current => (current || []).filter(p => p.id !== productId))
    
    const product = storeProducts.find(p => p.id === productId)
    if (product) {
      const activity: Activity = {
        id: `activity-${Date.now()}`,
        storeId: currentStoreId,
        productId: product.id,
        productName: product.name,
        action: 'product_removed',
        staffMember: 'Current User',
        timestamp: new Date().toISOString()
      }
      setActivities(current => [...(current || []), activity])
    }

    toast.success('Product removed')
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <CreateStoreDialog
          open={createStoreDialogOpen}
          onOpenChange={setCreateStoreDialogOpen}
          onCreate={handleCreateStore}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Storefront size={40} weight="bold" className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to FreshSave Pro</h1>
          <p className="text-muted-foreground mb-6">
            Create your first store to start recovering revenue from expiring products
          </p>
          <Button onClick={() => setCreateStoreDialogOpen(true)} size="lg">
            <Plus size={20} weight="bold" className="mr-2" />
            Create First Store
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Toaster position="top-center" richColors />
      
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Storefront size={28} weight="fill" className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">FreshSave Pro</h1>
                <p className="text-xs text-muted-foreground">Multi-Store Revenue Recovery</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {unreadNotifications.length > 0 && (
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} weight="bold" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                    {unreadNotifications.length}
                  </Badge>
                </Button>
              )}

              <Select value={currentStoreId} onValueChange={setCurrentStoreId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setCreateStoreDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Plus size={16} weight="bold" className="mr-2" />
                New Store
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <ChartLine size={16} weight="bold" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package size={16} weight="bold" />
              Products
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Receipt size={16} weight="bold" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell size={16} weight="bold" />
              Alerts
              {unreadNotifications.length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator size={16} weight="bold" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <ClockCountdown size={16} weight="bold" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TodaysActionList 
              products={storeProducts}
              onViewProducts={() => setActiveTab('products')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RevenueCard
                title="Revenue Today"
                value={`$${revenueMetrics.today.toFixed(2)}`}
                subtitle={`${revenueMetrics.itemsSoldToday} items sold`}
                icon={<CurrencyDollar size={24} weight="bold" className="text-primary" />}
              />
              <RevenueCard
                title="Revenue This Week"
                value={`$${revenueMetrics.week.toFixed(2)}`}
                subtitle={`${revenueMetrics.itemsSoldWeek} items sold`}
                icon={<ShoppingCart size={24} weight="bold" className="text-success" />}
              />
              <RevenueCard
                title="Revenue This Month"
                value={`$${revenueMetrics.month.toFixed(2)}`}
                subtitle={`${revenueMetrics.itemsSoldMonth} items sold`}
                icon={<ChartLine size={24} weight="bold" className="text-info" />}
              />
              <RevenueCard
                title="Potential Revenue"
                value={`$${potentialRevenue.toFixed(2)}`}
                subtitle={`${storeProducts.filter(p => p.status !== 'expired' && p.status !== 'sold').length} active items`}
                icon={<Package size={24} weight="bold" className="text-warning" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={revenueChartData} />
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
                {revenueMetrics.topCategories.length > 0 ? (
                  <div className="space-y-3">
                    {revenueMetrics.topCategories.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">{cat.count} items</p>
                        </div>
                        <p className="text-lg font-bold">${cat.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No revenue data yet
                  </p>
                )}
              </Card>
            </div>

            {unreadNotifications.length > 0 && (
              <Card className="p-6 border-warning bg-warning/5">
                <div className="flex items-start gap-3">
                  <WarningCircle size={24} weight="bold" className="text-warning mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Daily Alerts</h3>
                    <div className="space-y-2">
                      {unreadNotifications.map((notif) => (
                        <div key={notif.id} className="text-sm">
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-muted-foreground">{notif.message}</p>
                          {notif.potentialRevenue && (
                            <p className="text-xs text-success font-medium mt-1">
                              Potential revenue: ${notif.potentialRevenue.toFixed(2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <ActivityLog activities={storeActivities} />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {storeProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={40} weight="fill" className="text-muted-foreground" />
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
              <>
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
                          onCustomDiscount={handleCustomDiscount}
                          onAIDiscount={handleAIDiscount}
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
                          onCustomDiscount={handleCustomDiscount}
                          onAIDiscount={handleAIDiscount}
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
                          onCustomDiscount={handleCustomDiscount}
                          onAIDiscount={handleAIDiscount}
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
                            onCustomDiscount={handleCustomDiscount}
                            onAIDiscount={handleAIDiscount}
                            onPrintLabel={handlePrintLabel}
                            onRemove={handleRemove}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="audit">
            <RealtimeAudit products={storeProducts} />
          </TabsContent>

          <TabsContent value="alerts">
            <StaffAlertsPanel
              notifications={notifications || []}
              products={storeProducts}
              onDismiss={handleDismissNotification}
              onViewProducts={handleViewAffectedProducts}
            />
          </TabsContent>

          <TabsContent value="calculator">
            <PriceCalculator />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog activities={storeActivities} />
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 no-print">
        <Button
          onClick={() => setAiChatBotOpen(!aiChatBotOpen)}
          size="lg"
          variant={aiChatBotOpen ? "default" : "secondary"}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Brain size={24} weight="bold" />
        </Button>
        <Button
          onClick={() => setScannerDialogOpen(true)}
          size="lg"
          variant="secondary"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          disabled={!currentStoreId}
        >
          <Scan size={24} weight="bold" />
        </Button>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          disabled={!currentStoreId}
        >
          <Plus size={24} weight="bold" />
        </Button>
      </div>

      <AIChatBot
        products={storeProducts}
        isOpen={aiChatBotOpen}
        onClose={() => setAiChatBotOpen(false)}
      />

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddProduct}
      />

      <CreateStoreDialog
        open={createStoreDialogOpen}
        onOpenChange={setCreateStoreDialogOpen}
        onCreate={handleCreateStore}
      />

      <PrintLabel
        product={printProduct}
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrinted={handlePrinted}
      />

      <CustomDiscountDialog
        product={customDiscountProduct}
        open={customDiscountDialogOpen}
        onOpenChange={setCustomDiscountDialogOpen}
        onApply={handleApplyCustomDiscount}
      />

      <AIDiscountDialog
        product={aiDiscountProduct}
        open={aiDiscountDialogOpen}
        onOpenChange={setAiDiscountDialogOpen}
        onApply={handleApplyCustomDiscount}
      />

      <ScannerDialog
        open={scannerDialogOpen}
        onOpenChange={setScannerDialogOpen}
        onScanComplete={handleScanComplete}
      />
    </div>
  )
}

export default App
