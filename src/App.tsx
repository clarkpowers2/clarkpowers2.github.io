import { useState, useMemo, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, Store, Activity, Notification, PrinterUsageStats, PatternSummary } from '@/lib/types'
import { calculateRevenueMetrics, calculatePotentialRevenue, generateRevenueChartData } from '@/lib/analytics'
import { createPrinterUsageRecord } from '@/lib/printerAnalytics'
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
import { BulkPrinterMode } from '@/components/BulkPrinterMode'
import { BulkPriceUpdateDialog } from '@/components/BulkPriceUpdateDialog'
import { WeeklyReportGenerator } from '@/components/WeeklyReportGenerator'
import { EmailAnalytics } from '@/components/EmailAnalytics'
import { AuthScreen } from '@/components/AuthScreen'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import {
  Plus, ChartLine, Package, ClockCountdown, Storefront,
  CurrencyDollar, ShoppingCart, WarningCircle, Bell, Calculator, Brain, Scan, Receipt, Printer, FileText, EnvelopeSimple, GearSix, LockKey, CreditCard, QrCode, CopySimple, DeviceMobile
} from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { calculateDiscountInfo, calculateDaysUntilExpiry } from '@/lib/productUtils'
import { motion } from 'framer-motion'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth'

type InsForgeStoreRow = {
  id: string
  name: string
  trial_started_at: string | null
  trial_start_date?: string | null
  trial_end_date?: string | null
  subscription_status: string
  created_at: string
}

type InsForgeProductRow = {
  id: string
  store_id: string
  name: string
  category: Product['category']
  original_price: string | number
  expiry_date: string
  discount_percentage: string | number | null
  sale_price: string | number | null
  is_manual_entry: boolean
  status: string
  created_at: string
  updated_at: string
  price_updated_at: string | null
  price_change_reason: string | null
}

type InsForgePatternProductRow = {
  category: Product['category']
  original_price: string | number
  discount_percentage: string | number | null
  status: string
  created_at: string
  updated_at: string
  price_updated_at: string | null
}

type BulkPriceUpdateResultRow = {
  id: string
  old_price: string | number
  new_price: string | number
  price_updated_at: string
}

const BRANDING_PRICE_ID = 'price_1TrRGf11fUBPJ3CnzLh8TAMH'
const BRANDING_CHECKOUT_ENVIRONMENT = 'test'
const STAFF_APP_STORE_URL = 'https://apps.apple.com/app/id6775850115'

function mapInsForgeStore(row: InsForgeStoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    location: row.subscription_status,
    createdAt: row.created_at,
    subscriptionStatus: row.subscription_status,
    trialStartedAt: row.trial_started_at,
    trialStartDate: row.trial_start_date ?? null,
    trialEndDate: row.trial_end_date ?? null,
  }
}

function mapInsForgeProduct(row: InsForgeProductRow): Product {
  const status = row.status === 'active' ? 'pending' : row.status
  const discountPercentage = row.discount_percentage == null
    ? undefined
    : Number(row.discount_percentage)

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    originalPrice: Number(row.original_price),
    expiryDate: row.expiry_date,
    status: status as Product['status'],
    dateAdded: row.created_at,
    storeId: row.store_id,
    customDiscountPercentage: discountPercentage,
    priceUpdatedAt: row.price_updated_at ?? undefined,
    priceChangeReason: row.price_change_reason ?? undefined,
  }
}

function mapProductStatusToInsForge(status: Product['status']) {
  return status === 'pending' ? 'active' : status
}

function isBrandingSubscriptionActive(status?: string | null): boolean {
  return status === 'active' || status === 'trialing'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPatternSummary(rows: InsForgePatternProductRow[]): PatternSummary[] {
  const byCategory = new Map<Product['category'], PatternSummary>()

  rows.forEach((row) => {
    if (!row.category) return

    const current = byCategory.get(row.category) ?? {
      category: row.category,
      discountedCount: 0,
      expiredLostCount: 0,
      expiredLostRevenue: 0,
    }

    if (row.discount_percentage != null) {
      current.discountedCount += 1
    }

    if (row.status === 'expired' && row.discount_percentage == null) {
      current.expiredLostCount += 1
      current.expiredLostRevenue += Number(row.original_price) || 0
    }

    byCategory.set(row.category, current)
  })

  return Array.from(byCategory.values())
    .sort((a, b) => (
      b.discountedCount - a.discountedCount
      || b.expiredLostRevenue - a.expiredLostRevenue
      || a.category.localeCompare(b.category)
    ))
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [patternSummary, setPatternSummary] = useState<PatternSummary[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [activities, setActivities] = useKV<Activity[]>('freshsave-pro-activities', [])
  const [notifications, setNotifications] = useKV<Notification[]>('freshsave-pro-notifications', [])
  const [printerUsageStats, setPrinterUsageStats] = useKV<PrinterUsageStats[]>('freshsave-pro-printer-usage', [])
  const [currentStoreId, setCurrentStoreId] = useState<string>('')
  const [storesLoading, setStoresLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)

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
  const [bulkPrinterOpen, setBulkPrinterOpen] = useState(false)
  const [bulkPriceUpdateOpen, setBulkPriceUpdateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [settingsStoreName, setSettingsStoreName] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const managerLabel = user?.name || user?.email || 'Current Manager'

  const loadStores = useCallback(async () => {
    setStoresLoading(true)

    try {
      const { data, error } = await insforge.database
        .from('stores')
        .select('*')

      if (error) {
        throw new Error(error.message)
      }

      const fetchedStores = ((data ?? []) as InsForgeStoreRow[]).map(mapInsForgeStore)
      setStores(fetchedStores)
      setCurrentStoreId(current => {
        if (current && fetchedStores.some(store => store.id === current)) {
          return current
        }
        return fetchedStores[0]?.id ?? ''
      })
      return fetchedStores
    } catch (error) {
      console.error('Error loading manager stores from InsForge:', error)
      toast.error('Failed to load your stores from InsForge')
      setStores([])
      setCurrentStoreId('')
      return []
    } finally {
      setStoresLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setStores([])
      setProducts([])
      setPatternSummary([])
      setCurrentStoreId('')
      setStoresLoading(false)
      return
    }

    loadStores()
  }, [authLoading, user, loadStores])

  const loadProducts = useCallback(async (storeId: string) => {
    setProductsLoading(true)

    try {
      const { data, error } = await insforge.database
        .from('products')
        .select('*')
        .eq('store_id', storeId)

      if (error) {
        throw new Error(error.message)
      }

      const fetchedProducts = ((data ?? []) as InsForgeProductRow[])
        .filter(row => row.status !== 'removed')
        .map(mapInsForgeProduct)

      setProducts(fetchedProducts)
    } catch (error) {
      console.error('Error loading products from InsForge:', error)
      toast.error('Failed to load products from InsForge')
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const loadPatternSummary = useCallback(async (storeId: string) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    try {
      const { data, error } = await insforge.database
        .from('products')
        .select('category, original_price, discount_percentage, status, created_at, updated_at, price_updated_at')
        .eq('store_id', storeId)
        .gte('updated_at', since.toISOString())

      if (error) {
        throw new Error(error.message)
      }

      setPatternSummary(buildPatternSummary((data ?? []) as InsForgePatternProductRow[]))
    } catch (error) {
      console.error('Error loading 30-day pattern summary from InsForge:', error)
      setPatternSummary([])
    }
  }, [])

  useEffect(() => {
    if (!currentStoreId) {
      setProducts([])
      setPatternSummary([])
      return
    }

    loadProducts(currentStoreId)
    loadPatternSummary(currentStoreId)
  }, [currentStoreId, loadProducts, loadPatternSummary])

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
  const brandingUnlocked = isBrandingSubscriptionActive(currentStore?.subscriptionStatus)
  const brandedStoreName = brandingUnlocked ? currentStore?.name || 'FreshSave' : 'FreshSave'

  useEffect(() => {
    setSettingsStoreName(currentStore?.name ?? '')
  }, [currentStore?.id, currentStore?.name])

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

  const recentlyPriceChangedProducts = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000
    return storeProducts.filter(product => (
      product.priceUpdatedAt != null && Date.parse(product.priceUpdatedAt) >= since
    ))
  }, [storeProducts])

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

  const notablePattern = useMemo(() => {
    return patternSummary.find(summary => (
      summary.discountedCount >= 2 || summary.expiredLostCount >= 2
    ))
  }, [patternSummary])

  const handleCreateStore = async (storeData: { name: string; location: string }) => {
    try {
      const { error } = await insforge.database
        .from('stores')
        .insert([{ name: storeData.name }])

      if (error) {
        throw new Error(error.message)
      }

      const fetchedStores = await loadStores()
      const createdStore = [...fetchedStores]
        .reverse()
        .find(store => store.name === storeData.name)

      if (createdStore) {
        setCurrentStoreId(createdStore.id)
      }

      toast.success('Store created successfully!')
    } catch (error) {
      console.error('Error creating store:', error)
      toast.error('Failed to create store. Please try again.')
    }
  }

  const handleAddProduct = async (productData: {
    name: string
    category: Product['category']
    originalPrice: number
    expiryDate: string
  }) => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    try {
      const { error } = await insforge.database
        .from('products')
        .insert([{
          store_id: currentStoreId,
          name: productData.name,
          category: productData.category,
          original_price: productData.originalPrice,
          expiry_date: productData.expiryDate,
          status: 'active',
          is_manual_entry: false,
        }])

      if (error) {
        throw new Error(error.message)
      }

      await loadProducts(currentStoreId)
      await loadPatternSummary(currentStoreId)

      const activity: Activity = {
        id: `activity-${Date.now()}`,
        storeId: currentStoreId,
        productId: `product-added-${Date.now()}`,
        productName: productData.name,
        action: 'product_added',
        staffMember: managerLabel,
        timestamp: new Date().toISOString()
      }
      setActivities(current => [...(current || []), activity])

      toast.success('Product added successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product. Please try again.')
    }
  }

  const handleApplyDiscount = async (product: Product) => {
    try {
      const discountInfo = calculateDiscountInfo(product)
      const discountedAt = new Date().toISOString()

      const { error } = await insforge.database
        .from('products')
        .update({
          discount_percentage: discountInfo.discountPercentage,
          sale_price: discountInfo.discountedPrice,
          status: 'discounted',
          updated_at: discountedAt,
        })
        .eq('id', product.id)

      if (error) {
        throw new Error(error.message)
      }

      setProducts(current =>
        (current || []).map(p =>
          p.id === product.id ? {
            ...p,
            status: 'discounted' as const,
            customDiscountPercentage: discountInfo.discountPercentage,
            discountedBy: managerLabel,
            discountedAt
          } : p
        )
      )
      await loadPatternSummary(currentStoreId)

      const activity: Activity = {
        id: `activity-${Date.now()}`,
        storeId: currentStoreId,
        productId: product.id,
        productName: product.name,
        action: 'discount_applied',
        staffMember: managerLabel,
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
    } catch (error) {
      console.error('Error applying discount:', error)
      toast.error('Failed to apply discount. Please try again.')
    }
  }

  const handleCustomDiscount = (product: Product) => {
    setCustomDiscountProduct(product)
    setCustomDiscountDialogOpen(true)
  }

  const handleApplyCustomDiscount = async (product: Product, customDiscount: number) => {
    const customDiscountedPrice = product.originalPrice * (1 - customDiscount / 100)
    const discountedAt = new Date().toISOString()

    try {
      const { error } = await insforge.database
        .from('products')
        .update({
          discount_percentage: customDiscount,
          sale_price: customDiscountedPrice,
          status: 'discounted',
          updated_at: discountedAt,
        })
        .eq('id', product.id)

      if (error) {
        throw new Error(error.message)
      }

      setProducts(current =>
        (current || []).map(p =>
          p.id === product.id ? {
            ...p,
            customDiscountPercentage: customDiscount,
            status: 'discounted' as const,
            discountedBy: managerLabel,
            discountedAt
          } : p
        )
      )
      await loadPatternSummary(currentStoreId)

      const activity: Activity = {
        id: `activity-${Date.now()}`,
        storeId: currentStoreId,
        productId: product.id,
        productName: product.name,
        action: 'discount_applied',
        staffMember: managerLabel,
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
    } catch (error) {
      console.error('Error applying custom discount:', error)
      toast.error('Failed to apply custom discount. Please try again.')
    }
  }

  const handleAIDiscount = (product: Product) => {
    setAiDiscountProduct(product)
    setAiDiscountDialogOpen(true)
  }

  const handleBulkPriceUpdate = async (
    changes: Array<{ id: string; newPrice: number }>,
    reason: string
  ) => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    if (changes.length === 0) {
      toast.info('No price changes to save')
      return
    }

    const previousProductsById = new Map(storeProducts.map(product => [product.id, product]))
    const trimmedReason = reason.trim()

    try {
      const { data, error } = await insforge.database.rpc('bulk_update_product_prices', {
        price_changes: changes.map(change => ({
          id: change.id,
          new_price: change.newPrice,
        })),
        reason: trimmedReason || null,
      })

      if (error) {
        throw new Error(error.message)
      }

      const updatedRows = (data ?? []) as BulkPriceUpdateResultRow[]
      if (updatedRows.length === 0) {
        toast.info('No prices changed')
        return
      }

      const updatesById = new Map(
        updatedRows.map(row => [
          row.id,
          {
            newPrice: Number(row.new_price),
            priceUpdatedAt: row.price_updated_at,
          },
        ])
      )

      setProducts(current =>
        (current || []).map(product => {
          const update = updatesById.get(product.id)
          if (!update) return product

          return {
            ...product,
            originalPrice: update.newPrice,
            priceUpdatedAt: update.priceUpdatedAt,
            priceChangeReason: trimmedReason || undefined,
          }
        })
      )

      await loadProducts(currentStoreId)
      await loadPatternSummary(currentStoreId)

      const timestamp = new Date().toISOString()
      const newActivities: Activity[] = updatedRows.flatMap(row => {
        const product = previousProductsById.get(row.id)
        if (!product) return []

        return [{
          id: `activity-${row.id}-${Date.now()}`,
          storeId: currentStoreId,
          productId: row.id,
          productName: product.name,
          action: 'price_changed' as const,
          staffMember: managerLabel,
          timestamp,
          metadata: {
            originalPrice: Number(row.old_price),
            newPrice: Number(row.new_price),
            reason: trimmedReason || undefined,
          },
        }]
      })

      if (newActivities.length > 0) {
        setActivities(current => [...(current || []), ...newActivities])
      }

      toast.success('Prices updated', {
        description: `${updatedRows.length} shelf price${updatedRows.length === 1 ? '' : 's'} saved.`
      })
    } catch (error) {
      console.error('Error updating prices:', error)
      toast.error('Failed to update prices. Please try again.')
      throw error
    }
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

  const handleSaveStoreSettings = async () => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    if (!brandingUnlocked) {
      toast.error('Custom branding is locked', {
        description: 'Upgrade Store Branding to save a custom store name.'
      })
      return
    }

    const trimmedName = settingsStoreName.trim()
    if (!trimmedName) {
      toast.error('Store name is required')
      return
    }

    setSettingsSaving(true)

    try {
      const { error } = await insforge.database
        .from('stores')
        .update({ name: trimmedName })
        .eq('id', currentStoreId)

      if (error) {
        throw new Error(error.message)
      }

      setStores(current =>
        current.map(store =>
          store.id === currentStoreId ? { ...store, name: trimmedName } : store
        )
      )

      toast.success('Store settings saved')
    } catch (error) {
      console.error('Error saving store settings:', error)
      toast.error('Failed to save store settings. Please try again.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleCopyStaffAppLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(STAFF_APP_STORE_URL)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = STAFF_APP_STORE_URL
        textArea.setAttribute('readonly', '')
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      toast.success('App Store link copied')
    } catch (error) {
      console.error('Error copying staff app link:', error)
      toast.error('Could not copy link', {
        description: 'Select the App Store link and copy it manually.'
      })
    }
  }

  const handlePrintStaffInvite = () => {
    const qrCode = document.getElementById('staff-app-store-qr')
    const qrMarkup = qrCode?.outerHTML

    if (!qrMarkup) {
      toast.error('QR code is not ready yet')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Could not open print page', {
        description: 'Allow pop-ups for FreshSave and try again.'
      })
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>FreshSave Staff App QR Code</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              color: #111827;
              background: #ffffff;
            }
            main {
              width: min(7.5in, 92vw);
              text-align: center;
              padding: 0.5in;
            }
            h1 {
              margin: 0 0 0.18in;
              font-size: 30px;
              line-height: 1.15;
            }
            p {
              margin: 0.08in 0;
              font-size: 16px;
              line-height: 1.35;
            }
            .qr {
              display: inline-flex;
              margin: 0.3in 0 0.22in;
              padding: 0.18in;
              border: 2px solid #111827;
              border-radius: 16px;
            }
            .qr svg {
              width: min(4.25in, 72vw);
              height: min(4.25in, 72vw);
            }
            .url {
              margin-top: 0.18in;
              font-size: 13px;
              overflow-wrap: anywhere;
              color: #374151;
            }
            @page { margin: 0.35in; }
            @media print {
              body { min-height: auto; }
              main { padding: 0; }
            }
          </style>
        </head>
        <body>
          <main>
            <h1>Scan to download the FreshSave Staff app</h1>
            <p>Open your phone camera and scan this code.</p>
            <div class="qr">${qrMarkup}</div>
            <p class="url">${escapeHtml(STAFF_APP_STORE_URL)}</p>
          </main>
          <script>
            window.addEventListener('load', () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleStartBrandingCheckout = async () => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    setBillingLoading(true)

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}`
      const checkoutRequest = {
        mode: 'subscription',
        lineItems: [{ priceId: BRANDING_PRICE_ID, quantity: 1 }],
        successUrl: `${returnUrl}?checkout=success`,
        cancelUrl: `${returnUrl}?checkout=cancel`,
        subject: { type: 'store', id: currentStoreId },
        customerEmail: user?.email ?? null,
        metadata: {
          feature: 'store_branding',
        },
        idempotencyKey: `store:${currentStoreId}:branding-monthly`,
      }

      const { data, error } = await insforge.payments.stripe.createCheckoutSession(
        BRANDING_CHECKOUT_ENVIRONMENT,
        checkoutRequest as Parameters<typeof insforge.payments.stripe.createCheckoutSession>[1]
      )

      if (error) {
        throw new Error(error.message)
      }

      const checkoutUrl = data?.checkoutSession?.url
      if (!checkoutUrl) {
        throw new Error('Stripe did not return a checkout URL.')
      }

      window.location.assign(checkoutUrl)
    } catch (error) {
      console.error('Error creating branding checkout session:', error)
      toast.error('Could not start checkout', {
        description: error instanceof Error ? error.message : 'Please try again in a moment.'
      })
      setBillingLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!currentStoreId) {
      toast.error('Please select a store first')
      return
    }

    setBillingLoading(true)

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?billing=return`
      const { data, error } = await insforge.payments.stripe.createCustomerPortalSession(
        BRANDING_CHECKOUT_ENVIRONMENT,
        {
          subject: { type: 'store', id: currentStoreId },
          returnUrl,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      const portalUrl = data?.customerPortalSession?.url
      if (!portalUrl) {
        throw new Error('Stripe did not return a billing portal URL.')
      }

      window.location.assign(portalUrl)
    } catch (error) {
      console.error('Error creating billing portal session:', error)
      toast.error('Could not open billing', {
        description: error instanceof Error ? error.message : 'Please try again in a moment.'
      })
      setBillingLoading(false)
    }
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

  const handlePrinted = async (productId: string, printerType: string, labelSize: string) => {
    const product = storeProducts.find(p => p.id === productId)

    if (product) {
      const printerTypeMapping: Record<string, 'thermal' | 'label-machine' | 'standard' | 'browser'> = {
        'thermal': 'thermal',
        'label': 'label-machine',
        'standard': 'standard',
        'browser': 'browser'
      }

      const usageRecord = createPrinterUsageRecord(
        currentStoreId,
        product,
        printerTypeMapping[printerType] || 'browser',
        labelSize
      )

      setPrinterUsageStats(current => [...(current || []), usageRecord])
    }

    const labeledAt = new Date().toISOString()

    try {
      const { error } = await insforge.database
        .from('products')
        .update({
          status: mapProductStatusToInsForge('labeled'),
          updated_at: labeledAt,
        })
        .eq('id', productId)

      if (error) {
        throw new Error(error.message)
      }

      setProducts(current =>
        (current || []).map(p =>
          p.id === productId ? {
            ...p,
            status: 'labeled' as const,
            labeledBy: managerLabel,
            labeledAt
          } : p
        )
      )
      await loadPatternSummary(currentStoreId)

      if (product) {
        const activity: Activity = {
          id: `activity-${Date.now()}`,
          storeId: currentStoreId,
          productId: product.id,
          productName: product.name,
          action: 'label_printed',
          staffMember: managerLabel,
          timestamp: new Date().toISOString(),
          metadata: {
            labelType: 'discount',
          }
        }
        setActivities(current => [...(current || []), activity])
      }

      toast.success('Label printed successfully!')
    } catch (error) {
      console.error('Error marking product as labeled:', error)
      toast.error('Failed to update product label status. Please try again.')
    }
  }

  const handlePriceChangeLabelsPrinted = (productIds: string[]) => {
    const printedProducts = productIds
      .map(productId => storeProducts.find(product => product.id === productId))
      .filter((product): product is Product => Boolean(product))

    if (printedProducts.length === 0) return

    const timestamp = new Date().toISOString()

    const usageRecords = printedProducts.map(product =>
      createPrinterUsageRecord(currentStoreId, product, 'browser', 'standard')
    )
    setPrinterUsageStats(current => [...(current || []), ...usageRecords])

    const labelActivities: Activity[] = printedProducts.map(product => ({
      id: `activity-price-label-${product.id}-${Date.now()}`,
      storeId: currentStoreId,
      productId: product.id,
      productName: product.name,
      action: 'label_printed',
      staffMember: managerLabel,
      timestamp,
      metadata: {
        labelType: 'price-change',
        newPrice: product.originalPrice,
      },
    }))

    setActivities(current => [...(current || []), ...labelActivities])
    toast.success('Price change labels printed', {
      description: `${printedProducts.length} shelf label${printedProducts.length === 1 ? '' : 's'} logged.`
    })
  }

  const handleRemove = async (productId: string) => {
    const product = storeProducts.find(p => p.id === productId)

    try {
      const { error } = await insforge.database
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        throw new Error(error.message)
      }

      setProducts(current => (current || []).filter(p => p.id !== productId))
      await loadPatternSummary(currentStoreId)

      if (product) {
        const activity: Activity = {
          id: `activity-${Date.now()}`,
          storeId: currentStoreId,
          productId: product.id,
          productName: product.name,
          action: 'product_removed',
          staffMember: managerLabel,
          timestamp: new Date().toISOString()
        }
        setActivities(current => [...(current || []), activity])
      }

      toast.success('Product removed')
    } catch (error) {
      console.error('Error removing product:', error)
      toast.error('Failed to remove product. Please try again.')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Storefront size={40} weight="bold" className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Checking session</h1>
          <p className="text-muted-foreground">
            Restoring your manager login...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <AuthScreen />
      </>
    )
  }

  if (storesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Storefront size={40} weight="bold" className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Loading stores</h1>
          <p className="text-muted-foreground">
            Fetching your manager stores from InsForge...
          </p>
        </div>
      </div>
    )
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
            Create your first store to start recovering revenue from expiring products.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Signed in as {managerLabel}
          </p>
          <Button onClick={() => setCreateStoreDialogOpen(true)} size="lg">
            <Plus size={20} weight="bold" className="mr-2" />
            Create First Store
          </Button>
          <Button onClick={() => signOut()} variant="link" className="mt-3">
            Sign out
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
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Storefront size={24} weight="fill" className="text-primary sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">FreshSave Pro</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Multi-Store Revenue Recovery</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {unreadNotifications.length > 0 && (
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                  <Bell size={18} weight="bold" className="sm:w-5 sm:h-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                    {unreadNotifications.length}
                  </Badge>
                </Button>
              )}

              <Select value={currentStoreId} onValueChange={setCurrentStoreId}>
                <SelectTrigger className="w-[140px] sm:w-[200px] h-9 sm:h-10">
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
                className="hidden sm:flex"
              >
                <Plus size={16} weight="bold" className="mr-2" />
                New Store
              </Button>
              <Button
                onClick={() => setCreateStoreDialogOpen(true)}
                variant="outline"
                size="icon"
                className="sm:hidden h-9 w-9"
              >
                <Plus size={18} weight="bold" />
              </Button>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-4 sm:grid-cols-9 gap-1">
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <ChartLine size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Package size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Receipt size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 sm:gap-2 text-xs sm:text-sm relative">
              <Bell size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Alerts</span>
              {unreadNotifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Calculator size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <EnvelopeSimple size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <ClockCountdown size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <GearSix size={16} weight="bold" className="shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TodaysActionList
              products={storeProducts}
              onViewProducts={() => setActiveTab('products')}
            />

            {notablePattern && (
              <Card className="p-5 border-accent bg-accent/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Brain size={22} weight="bold" className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold">Cosmo noticed</h3>
                      <Badge variant="secondary" className="capitalize">
                        {notablePattern.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notablePattern.discountedCount >= 2
                        ? `${notablePattern.category} has been discounted ${notablePattern.discountedCount} times in the last 30 days.`
                        : `${notablePattern.category} has ${notablePattern.expiredLostCount} expired items with $${notablePattern.expiredLostRevenue.toFixed(2)} in lost revenue over the last 30 days.`}
                    </p>
                  </div>
                </div>
              </Card>
            )}

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
            {productsLoading ? (
              <Card className="p-8 text-center border-dashed">
                <Package size={40} weight="fill" className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Loading products from InsForge...</p>
              </Card>
            ) : storeProducts.length === 0 ? (
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Product Inventory</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Manage markdowns, shelf prices, and labels
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      onClick={() => setBulkPriceUpdateOpen(true)}
                      size="lg"
                      variant="outline"
                    >
                      <CurrencyDollar size={20} weight="bold" className="mr-2" />
                      Update Prices
                    </Button>
                    <Button
                      onClick={() => setBulkPrinterOpen(true)}
                      size="lg"
                      variant="default"
                      disabled={
                        storeProducts.filter(p => p.status === 'discounted' || p.status === 'labeled').length === 0
                        && recentlyPriceChangedProducts.length === 0
                      }
                    >
                      <Printer size={20} weight="bold" className="mr-2" />
                      Bulk Print Labels
                    </Button>
                  </div>
                </div>

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

          <TabsContent value="report">
            <WeeklyReportGenerator
              products={storeProducts}
              activities={storeActivities}
              printerUsageStats={(printerUsageStats || []).filter(s => s.storeId === currentStoreId)}
              storeId={currentStoreId}
              storeName={brandedStoreName}
            />
          </TabsContent>

          <TabsContent value="emails">
            <EmailAnalytics
              stores={stores || []}
              currentStoreId={currentStoreId}
              products={products || []}
              activities={activities || []}
              printerUsageStats={printerUsageStats || []}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog activities={storeActivities} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 max-w-2xl">
              <div className="flex items-start gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <GearSix size={28} weight="bold" className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Store Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage store branding and billing.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Store Branding</p>
                        <Badge variant={brandingUnlocked ? 'default' : 'secondary'}>
                          {brandingUnlocked ? currentStore?.subscriptionStatus || 'active' : 'Locked'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {brandingUnlocked
                          ? 'Custom branding is unlocked for this store.'
                          : 'Free stores continue to use the default FreshSave branding.'}
                      </p>
                    </div>
                    {brandingUnlocked ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleManageBilling}
                        disabled={billingLoading}
                      >
                        <CreditCard size={18} weight="bold" className="mr-2" />
                        {billingLoading ? 'Opening...' : 'Manage Billing'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleStartBrandingCheckout}
                        disabled={billingLoading}
                      >
                        <LockKey size={18} weight="bold" className="mr-2" />
                        {billingLoading ? 'Opening...' : 'Upgrade - Unlock Custom Branding'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-name">Store name</Label>
                  <Input
                    id="store-name"
                    value={brandingUnlocked ? settingsStoreName : brandedStoreName}
                    onChange={(event) => setSettingsStoreName(event.target.value)}
                    placeholder="Enter store name"
                    disabled={settingsSaving || !brandingUnlocked}
                  />
                  {!brandingUnlocked && (
                    <p className="text-xs text-muted-foreground">
                      Subscribe to Store Branding to save and display a custom store name.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveStoreSettings} disabled={settingsSaving || !brandingUnlocked}>
                    {settingsSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Display branding: {brandedStoreName}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Signed in as {managerLabel}. Billing access is granted only from verified InsForge Stripe webhooks.
                </p>
              </div>
            </Card>

            <Card className="p-6 max-w-2xl">
              <div className="flex items-start gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <DeviceMobile size={28} weight="bold" className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Invite Staff</h2>
                  <p className="text-sm text-muted-foreground">
                    Share the FreshSave Staff iOS app with your team.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-app-store-link">App Store link</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="staff-app-store-link"
                        value={STAFF_APP_STORE_URL}
                        readOnly
                        className="font-mono text-sm"
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <Button type="button" onClick={handleCopyStaffAppLink} className="shrink-0">
                        <CopySimple size={18} weight="bold" className="mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <QrCode size={22} weight="bold" className="mt-0.5 text-primary" />
                      <div className="space-y-2">
                        <p className="font-semibold">Break room QR flyer</p>
                        <p className="text-sm text-muted-foreground">
                          Print a scan-ready sign so staff can open the App Store page from their phone camera.
                        </p>
                        <Button type="button" variant="outline" onClick={handlePrintStaffInvite}>
                          <Printer size={18} weight="bold" className="mr-2" />
                          Print QR Code
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
                  <QRCodeSVG
                    id="staff-app-store-qr"
                    value={STAFF_APP_STORE_URL}
                    size={180}
                    level="M"
                    includeMargin
                    title="FreshSave Staff App Store link"
                  />
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Scan to download the Staff app
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2 sm:gap-3 no-print z-50">
        <Button
          onClick={() => setAiChatBotOpen(!aiChatBotOpen)}
          size="lg"
          variant={aiChatBotOpen ? "default" : "secondary"}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Brain size={20} weight="bold" className="sm:w-6 sm:h-6" />
        </Button>
        <Button
          onClick={() => setScannerDialogOpen(true)}
          size="lg"
          variant="secondary"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          disabled={!currentStoreId}
        >
          <Scan size={20} weight="bold" className="sm:w-6 sm:h-6" />
        </Button>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="lg"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          disabled={!currentStoreId}
        >
          <Plus size={20} weight="bold" className="sm:w-6 sm:h-6" />
        </Button>
      </div>

      <AIChatBot
        products={storeProducts}
        patternSummary={patternSummary}
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

      <BulkPrinterMode
        open={bulkPrinterOpen}
        onOpenChange={setBulkPrinterOpen}
        products={storeProducts}
        onPrintComplete={(productIds, labelMode) => {
          if (labelMode === 'price-change') {
            handlePriceChangeLabelsPrinted(productIds)
            return
          }

          productIds.forEach(id => handlePrinted(id, 'browser', 'standard'))
        }}
      />

      <BulkPriceUpdateDialog
        open={bulkPriceUpdateOpen}
        onOpenChange={setBulkPriceUpdateOpen}
        products={storeProducts}
        onSave={handleBulkPriceUpdate}
      />
    </div>
  )
}

export default App
