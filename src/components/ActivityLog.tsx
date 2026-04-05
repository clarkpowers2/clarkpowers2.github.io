import { Card } from '@/components/ui/card'
import { Activity } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { Tag, Printer, Plus, Trash, ShoppingCart } from '@phosphor-icons/react'

interface ActivityLogProps {
  activities: Activity[]
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const getActionIcon = (action: Activity['action']) => {
    switch (action) {
      case 'discount_applied':
        return <Tag size={16} weight="bold" className="text-primary" />
      case 'label_printed':
        return <Printer size={16} weight="bold" className="text-info" />
      case 'product_added':
        return <Plus size={16} weight="bold" className="text-success" />
      case 'product_sold':
        return <ShoppingCart size={16} weight="bold" className="text-accent" />
      case 'product_removed':
        return <Trash size={16} weight="bold" className="text-destructive" />
    }
  }

  const getActionText = (activity: Activity) => {
    switch (activity.action) {
      case 'discount_applied':
        return `applied ${activity.metadata?.discountPercentage}% discount to`
      case 'label_printed':
        return 'printed label for'
      case 'product_added':
        return 'added'
      case 'product_sold':
        return 'sold'
      case 'product_removed':
        return 'removed'
    }
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No activity yet
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5">{getActionIcon(activity.action)}</div>
            <div className="flex-1">
              <p>
                <span className="font-medium">{activity.staffMember}</span>{' '}
                <span className="text-muted-foreground">{getActionText(activity)}</span>{' '}
                <span className="font-medium">{activity.productName}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
