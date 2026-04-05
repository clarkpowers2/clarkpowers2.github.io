import { Card } from '@/components/ui/card'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface RevenueCardProps {
  title: string
  value: string
  trend?: number
  subtitle?: string
  icon: React.ReactNode
}

export function RevenueCard({ title, value, trend, subtitle, icon }: RevenueCardProps) {
  const isPositive = trend !== undefined && trend >= 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendUp size={16} weight="bold" /> : <TrendDown size={16} weight="bold" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight mb-1"
        >
          {value}
        </motion.div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  )
}
