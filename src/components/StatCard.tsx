import { Card } from '@/components/ui/card'
import { TrendUp, Clock, Package, CurrencyDollar } from '@phosphor-icons/react'

interface StatCardProps {
  icon: 'trending' | 'clock' | 'package' | 'dollar'
  label: string
  value: string | number
  color?: 'primary' | 'accent' | 'info' | 'warning'
}

export function StatCard({ icon, label, value, color = 'primary' }: StatCardProps) {
  const icons = {
    trending: TrendUp,
    clock: Clock,
    package: Package,
    dollar: CurrencyDollar
  }
  
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning'
  }
  
  const Icon = icons[icon]
  
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  )
}
