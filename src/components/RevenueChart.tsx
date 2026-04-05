import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend (7 Days)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.005 255)" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'oklch(0.50 0.01 255)', fontSize: 12 }}
            stroke="oklch(0.88 0.005 255)"
          />
          <YAxis 
            tick={{ fill: 'oklch(0.50 0.01 255)', fontSize: 12 }}
            stroke="oklch(0.88 0.005 255)"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium">{payload[0].payload.date}</p>
                    <p className="text-lg font-bold text-primary">
                      ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : '0.00'}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="oklch(0.55 0.12 200)" 
            strokeWidth={3}
            dot={{ fill: 'oklch(0.55 0.12 200)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
