import { Notification, Product } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, BellRinging, WarningCircle, TrendUp, 
  Package, CheckCircle, X 
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface StaffAlertsPanelProps {
  notifications: Notification[]
  products: Product[]
  onDismiss: (notificationId: string) => void
  onViewProducts: (productIds: string[]) => void
}

export function StaffAlertsPanel({ 
  notifications, 
  products,
  onDismiss, 
  onViewProducts 
}: StaffAlertsPanelProps) {
  const unreadNotifications = notifications.filter(n => !n.read)
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive'
      case 'high': return 'text-warning'
      case 'medium': return 'text-info'
      default: return 'text-muted-foreground'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'outline'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getIcon = (type: string, priority?: string) => {
    const iconProps = { 
      size: 20, 
      weight: 'bold' as const,
      className: getPriorityColor(priority)
    }
    
    switch (type) {
      case 'daily_expiring':
      case 'staff_alert':
        return <BellRinging {...iconProps} />
      case 'revenue_opportunity':
        return <TrendUp {...iconProps} />
      case 'missed_opportunity':
        return <WarningCircle {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  if (unreadNotifications.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} weight="fill" className="text-success" />
          </div>
          <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
          <p className="text-sm text-muted-foreground">
            No pending alerts at the moment
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {unreadNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            layout
          >
            <Card className={`p-4 border-l-4 ${
              notification.priority === 'critical' 
                ? 'border-l-destructive bg-destructive/5' 
                : notification.priority === 'high'
                ? 'border-l-warning bg-warning/5'
                : 'border-l-primary'
            }`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getIcon(notification.type, notification.priority)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {notification.priority && (
                        <Badge variant={getPriorityBadge(notification.priority)} className="capitalize">
                          {notification.priority}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDismiss(notification.id)}
                      >
                        <X size={16} weight="bold" />
                      </Button>
                    </div>
                  </div>

                  {notification.count !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={16} weight="bold" className="text-muted-foreground" />
                      <span className="font-medium">{notification.count} items</span>
                    </div>
                  )}

                  {notification.potentialRevenue !== undefined && (
                    <div className="text-sm font-semibold text-success">
                      Potential revenue: ${notification.potentialRevenue.toFixed(2)}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                    
                    {notification.productIds && notification.productIds.length > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onViewProducts(notification.productIds || [])}
                      >
                        View affected products →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
