import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { EmailRecipient, EmailSchedule, EmailReport, calculateNextScheduledTime, generateWeeklyEmailReport, generateDailyEmailReport } from '@/lib/emailScheduler'
import { Product, Activity, PrinterUsageStats, Store } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnvelopeSimple, Plus, Trash, Eye, CalendarBlank, Clock, CheckCircle, WarningCircle, User } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface EmailAnalyticsProps {
  stores: Store[]
  currentStoreId: string
  products: Product[]
  activities: Activity[]
  printerUsageStats: PrinterUsageStats[]
}

export function EmailAnalytics({ stores, currentStoreId, products, activities, printerUsageStats }: EmailAnalyticsProps) {
  const [recipients, setRecipients] = useKV<EmailRecipient[]>('freshsave-pro-email-recipients', [])
  const [schedules, setSchedules] = useKV<EmailSchedule[]>('freshsave-pro-email-schedules', [])
  const [emailReports, setEmailReports] = useKV<EmailReport[]>('freshsave-pro-email-reports', [])
  
  const [addRecipientOpen, setAddRecipientOpen] = useState(false)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [previewReportOpen, setPreviewReportOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    role: 'manager' as EmailRecipient['role'],
    receiveWeeklyReport: true,
    receiveDailySummary: false
  })
  
  const [newSchedule, setNewSchedule] = useState({
    type: 'weekly' as 'weekly' | 'daily' | 'monthly',
    dayOfWeek: 0,
    dayOfMonth: 1,
    timeOfDay: '09:00',
    recipientIds: [] as string[]
  })

  const currentStore = stores.find(s => s.id === currentStoreId)
  const storeProducts = products.filter(p => p.storeId === currentStoreId)
  const storeActivities = activities.filter(a => a.storeId === currentStoreId)
  const storePrinterStats = printerUsageStats.filter(s => s.storeId === currentStoreId)
  const storeSchedules = (schedules || []).filter(s => s.storeId === currentStoreId)
  const storeReports = (emailReports || []).filter(r => r.storeId === currentStoreId).sort((a, b) => 
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )

  const handleAddRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) {
      toast.error('Please fill in all fields')
      return
    }

    const recipient: EmailRecipient = {
      id: `recipient-${Date.now()}`,
      name: newRecipient.name,
      email: newRecipient.email,
      role: newRecipient.role,
      storeIds: [currentStoreId],
      receiveWeeklyReport: newRecipient.receiveWeeklyReport,
      receiveDailySummary: newRecipient.receiveDailySummary
    }

    setRecipients(current => [...(current || []), recipient])
    setNewRecipient({
      name: '',
      email: '',
      role: 'manager',
      receiveWeeklyReport: true,
      receiveDailySummary: false
    })
    setAddRecipientOpen(false)
    toast.success('Recipient added successfully')
  }

  const handleRemoveRecipient = (recipientId: string) => {
    setRecipients(current => (current || []).filter(r => r.id !== recipientId))
    setSchedules(current => 
      (current || []).map(s => ({
        ...s,
        recipientIds: s.recipientIds.filter(id => id !== recipientId)
      }))
    )
    toast.success('Recipient removed')
  }

  const handleAddSchedule = () => {
    if (newSchedule.recipientIds.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    const schedule: EmailSchedule = {
      id: `schedule-${Date.now()}`,
      storeId: currentStoreId,
      type: newSchedule.type,
      dayOfWeek: newSchedule.type === 'weekly' ? newSchedule.dayOfWeek : undefined,
      dayOfMonth: newSchedule.type === 'monthly' ? newSchedule.dayOfMonth : undefined,
      timeOfDay: newSchedule.timeOfDay,
      enabled: true,
      recipientIds: newSchedule.recipientIds
    }

    const nextScheduled = calculateNextScheduledTime(schedule)
    schedule.nextScheduled = nextScheduled.toISOString()

    setSchedules(current => [...(current || []), schedule])
    setNewSchedule({
      type: 'weekly',
      dayOfWeek: 0,
      dayOfMonth: 1,
      timeOfDay: '09:00',
      recipientIds: []
    })
    setAddScheduleOpen(false)
    toast.success('Email schedule created')
  }

  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    setSchedules(current =>
      (current || []).map(s =>
        s.id === scheduleId ? { ...s, enabled } : s
      )
    )
    toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled')
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(current => (current || []).filter(s => s.id !== scheduleId))
    toast.success('Schedule deleted')
  }

  const handleGenerateTestReport = () => {
    if (!currentStore) return

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const html = generateWeeklyEmailReport(
      currentStore,
      storeProducts,
      storeActivities,
      storePrinterStats,
      weekStart
    )

    setPreviewHtml(html)
    setPreviewReportOpen(true)
  }

  const handleSendTestEmail = (scheduleId: string) => {
    const schedule = (schedules || []).find(s => s.id === scheduleId)
    if (!schedule || !currentStore) return

    const recipientEmails = (recipients || [])
      .filter(r => schedule.recipientIds.includes(r.id))
      .map(r => r.email)

    if (recipientEmails.length === 0) {
      toast.error('No recipients found for this schedule')
      return
    }

    let html = ''
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    if (schedule.type === 'weekly') {
      html = generateWeeklyEmailReport(currentStore, storeProducts, storeActivities, storePrinterStats, weekStart)
    } else {
      html = generateDailyEmailReport(currentStore, storeProducts, storeActivities)
    }

    const report: EmailReport = {
      id: `report-${Date.now()}`,
      scheduleId: schedule.id,
      storeId: currentStoreId,
      storeName: currentStore.name,
      reportType: schedule.type,
      generatedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: 'sent',
      recipientEmails,
      subject: `${schedule.type === 'weekly' ? 'Weekly' : 'Daily'} Analytics Report - ${currentStore.name}`,
      htmlContent: html,
      metadata: {
        totalRecovered: 0,
        itemsSold: 0,
        missedOpportunities: 0,
        printerCosts: 0
      }
    }

    setEmailReports(current => [...(current || []), report])

    toast.success(`Test email generated and saved`, {
      description: `Recipients: ${recipientEmails.join(', ')}`
    })

    setPreviewHtml(html)
    setPreviewReportOpen(true)
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <EnvelopeSimple size={28} weight="bold" className="text-primary" />
            Automated Email Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule weekly reports and daily summaries to your team
          </p>
        </div>
        <Button onClick={handleGenerateTestReport} variant="outline">
          <Eye size={18} weight="bold" className="mr-2" />
          Preview Report
        </Button>
      </div>

      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Email Schedules</h3>
              <Button onClick={() => setAddScheduleOpen(true)} size="sm">
                <Plus size={16} weight="bold" className="mr-2" />
                Add Schedule
              </Button>
            </div>

            {storeSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <EnvelopeSimple size={48} weight="thin" className="mx-auto mb-4 opacity-50" />
                <p>No email schedules configured</p>
                <p className="text-sm mt-1">Create your first schedule to automate reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storeSchedules.map(schedule => {
                  const scheduleRecipients = (recipients || []).filter(r => 
                    schedule.recipientIds.includes(r.id)
                  )
                  
                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={schedule.enabled ? "default" : "secondary"}>
                              {schedule.type}
                            </Badge>
                            {schedule.enabled ? (
                              <CheckCircle size={16} weight="fill" className="text-success" />
                            ) : (
                              <WarningCircle size={16} weight="fill" className="text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <CalendarBlank size={14} weight="bold" />
                              {schedule.type === 'weekly' && schedule.dayOfWeek !== undefined
                                ? `Every ${dayNames[schedule.dayOfWeek]}`
                                : schedule.type === 'monthly' && schedule.dayOfMonth
                                ? `Day ${schedule.dayOfMonth} of each month`
                                : 'Every day'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} weight="bold" />
                              {schedule.timeOfDay}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={14} weight="bold" />
                              {scheduleRecipients.length} recipient{scheduleRecipients.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {schedule.nextScheduled && (
                            <p className="text-xs text-muted-foreground">
                              Next: {new Date(schedule.nextScheduled).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendTestEmail(schedule.id)}
                          >
                            <EnvelopeSimple size={14} weight="bold" className="mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash size={14} weight="bold" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>

          {storeSchedules.length > 0 && (
            <Card className="p-6 bg-info/5 border-info">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle size={18} weight="bold" className="text-info" />
                How It Works
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Emails are automatically generated based on your schedule</li>
                <li>• Reports include revenue metrics, top categories, and staff performance</li>
                <li>• Recipients receive professional HTML emails with charts and insights</li>
                <li>• All reports are saved in the History tab for reference</li>
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Email Recipients</h3>
              <Button onClick={() => setAddRecipientOpen(true)} size="sm">
                <Plus size={16} weight="bold" className="mr-2" />
                Add Recipient
              </Button>
            </div>

            {!recipients || recipients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User size={48} weight="thin" className="mx-auto mb-4 opacity-50" />
                <p>No recipients configured</p>
                <p className="text-sm mt-1">Add team members to receive automated reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recipients.map(recipient => (
                  <motion.div
                    key={recipient.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{recipient.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {recipient.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {recipient.receiveWeeklyReport && (
                          <Badge variant="secondary" className="text-xs">
                            Weekly Reports
                          </Badge>
                        )}
                        {recipient.receiveDailySummary && (
                          <Badge variant="secondary" className="text-xs">
                            Daily Summary
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      <Trash size={16} weight="bold" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Report History</h3>

            {storeReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarBlank size={48} weight="thin" className="mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Reports will appear here after they are sent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storeReports.slice(0, 10).map(report => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {report.reportType}
                        </Badge>
                        <Badge variant={report.status === 'sent' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{report.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generated: {new Date(report.generatedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recipients: {report.recipientEmails.join(', ')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewHtml(report.htmlContent)
                        setPreviewReportOpen(true)
                      }}
                    >
                      <Eye size={14} weight="bold" className="mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addRecipientOpen} onOpenChange={setAddRecipientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Recipient</DialogTitle>
            <DialogDescription>
              Add a team member to receive automated analytics reports
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Name</Label>
              <Input
                id="recipient-name"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-email">Email</Label>
              <Input
                id="recipient-email"
                type="email"
                value={newRecipient.email}
                onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-role">Role</Label>
              <Select
                value={newRecipient.role}
                onValueChange={(value: EmailRecipient['role']) => 
                  setNewRecipient({ ...newRecipient, role: value })
                }
              >
                <SelectTrigger id="recipient-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports">Receive Weekly Reports</Label>
              <Switch
                id="weekly-reports"
                checked={newRecipient.receiveWeeklyReport}
                onCheckedChange={(checked) => 
                  setNewRecipient({ ...newRecipient, receiveWeeklyReport: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="daily-summary">Receive Daily Summary</Label>
              <Switch
                id="daily-summary"
                checked={newRecipient.receiveDailySummary}
                onCheckedChange={(checked) => 
                  setNewRecipient({ ...newRecipient, receiveDailySummary: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRecipientOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipient}>Add Recipient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addScheduleOpen} onOpenChange={setAddScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Schedule</DialogTitle>
            <DialogDescription>
              Set up automated delivery of analytics reports
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-type">Report Type</Label>
              <Select
                value={newSchedule.type}
                onValueChange={(value: 'weekly' | 'daily' | 'monthly') => 
                  setNewSchedule({ ...newSchedule, type: value })
                }
              >
                <SelectTrigger id="schedule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newSchedule.type === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select
                  value={newSchedule.dayOfWeek.toString()}
                  onValueChange={(value) => 
                    setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger id="day-of-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newSchedule.type === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-month">Day of Month</Label>
                <Input
                  id="day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={newSchedule.dayOfMonth}
                  onChange={(e) => 
                    setNewSchedule({ ...newSchedule, dayOfMonth: parseInt(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="time-of-day">Time</Label>
              <Input
                id="time-of-day"
                type="time"
                value={newSchedule.timeOfDay}
                onChange={(e) => setNewSchedule({ ...newSchedule, timeOfDay: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              {!recipients || recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recipients available. Add recipients first.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {recipients.map(recipient => (
                    <div key={recipient.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`recipient-${recipient.id}`}
                        checked={newSchedule.recipientIds.includes(recipient.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSchedule({
                              ...newSchedule,
                              recipientIds: [...newSchedule.recipientIds, recipient.id]
                            })
                          } else {
                            setNewSchedule({
                              ...newSchedule,
                              recipientIds: newSchedule.recipientIds.filter(id => id !== recipient.id)
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`recipient-${recipient.id}`} className="text-sm cursor-pointer">
                        {recipient.name} ({recipient.email})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSchedule}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewReportOpen} onOpenChange={setPreviewReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Report Preview</DialogTitle>
            <DialogDescription>
              This is how your email report will look to recipients
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border rounded-lg p-4 bg-muted/20"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
