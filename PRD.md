# FreshSave Pro - Multi-Store Revenue Recovery Platform

A scalable SaaS platform that helps grocery chains reduce waste and recover revenue across multiple store locations through intelligent discounting, analytics, and automation.

**Experience Qualities**:
1. **Professional** - Premium SaaS interface that demonstrates ROI and business value at every touchpoint
2. **Insightful** - Data-driven dashboards that reveal revenue opportunities and performance trends
3. **Scalable** - Multi-tenant architecture supporting chains with multiple locations and staff members

**Complexity Level**: Complex Application (advanced functionality with multiple views)
This is a full-featured SaaS platform with revenue analytics, multi-store management, staff tracking, smart discount automation, and reporting capabilities. The architecture supports multi-tenancy, role-based features, and data aggregation across stores while maintaining the simplicity of the original workflow.

## Essential Features

### Revenue Dashboard
- **Functionality**: Executive overview showing money recovered today/week/month, items sold, and trend charts
- **Purpose**: Demonstrates business value and ROI of the platform
- **Trigger**: Primary navigation tab or app launch for managers
- **Progression**: Navigate to dashboard → View revenue metrics → See comparison charts → Filter by date range → Export reports
- **Success criteria**: Managers can articulate ROI within 10 seconds; data updates in real-time

### Multi-Store Management
- **Functionality**: Create and manage multiple store locations with independent inventories and performance tracking
- **Purpose**: Scales platform for regional chains and franchises
- **Trigger**: Store selector in header or settings panel
- **Progression**: Create store → Set location details → Switch between stores → Compare performance across locations → View chain-wide aggregates
- **Success criteria**: Seamless switching between stores; clear visual indication of active store

### Smart Discount Engine (Enhanced)
- **Functionality**: Dynamic discounts based on category urgency (meat = aggressive), time of day (evening = higher %), and days until expiry
- **Purpose**: Maximizes recovery while matching customer shopping patterns
- **Trigger**: Automatic calculation on product add and every hour
- **Progression**: Product added → Category evaluated → Time-based modifier applied → Final discount calculated → Staff can override if needed
- **Success criteria**: Discounts feel intelligent; recovery rates improve 15-30% vs. static discounts

### Staff Activity Tracking
- **Functionality**: Logs all discount applications and label prints with staff member attribution and timestamps
- **Purpose**: Accountability, performance measurement, and audit trail
- **Trigger**: Automatic on any discount or print action
- **Progression**: Staff applies discount → User identified → Action logged with timestamp → Activity appears in log → Managers review performance
- **Success criteria**: Complete audit trail; identify top performers

### Notification System
- **Functionality**: Daily alerts showing items expiring today and potential revenue at risk
- **Purpose**: Proactive reminders ensure no opportunities are missed
- **Trigger**: Daily at opening time; real-time for critical items
- **Progression**: Morning arrives → Notification generated → Shows in dashboard notification panel → Click to view affected products → Take action
- **Success criteria**: Reduce missed opportunities by 80%

### Weekly Report Generator
- **Functionality**: Automated summary report with total recovered, top categories, missed opportunities, and staff performance
- **Purpose**: Strategic insights for managers to optimize operations
- **Trigger**: Generated automatically Sunday night; viewable on-demand
- **Progression**: Week ends → Report compiled → Summary statistics calculated → Charts generated → View in dashboard or export
- **Success criteria**: Managers use report to make strategic decisions; clear actionable insights

### Products & Workflow (Core)
- **Functionality**: Add products, view by urgency, apply discounts, print labels - enhanced with store context
- **Purpose**: Core operational workflow maintained from original FreshSave
- **Trigger**: Add product button, product list interactions
- **Progression**: Same as original but now scoped to active store and tracked by staff member
- **Success criteria**: Original workflow uncompromised; enhanced with new data capture

## Edge Case Handling

- **Expired Products** - Separate section with remove option; contribute to "missed opportunities" metric
- **No Products in Store** - Empty state with "Add Product" prompt
- **No Stores Created** - Onboarding flow to create first store
- **Store Switching** - Clear confirmation when switching; unsaved work warnings
- **Staff Attribution** - Falls back to "System" if user not identified
- **Network Offline** - All data persists locally; syncs when reconnected
- **Invalid Dates** - Form validation prevents past dates
- **Report Generation Failure** - Retry mechanism; shows last successful report
- **Multi-Store Data Conflicts** - Each store has independent data namespace
- **Time Zone Handling** - Store-level time zone settings for accurate expiry calculations

## Design Direction

The design should evoke a premium SaaS platform - polished, data-driven, and confidence-inspiring. Think Stripe dashboard meets modern retail analytics. Every screen should reinforce value: charts show money recovered, metrics demonstrate ROI, and the interface feels like enterprise-grade software. Visual hierarchy emphasizes business intelligence while maintaining the operational simplicity of the original workflow. Staff should feel empowered by data, managers should feel informed by insights, and executives should see clear business value.

## Color Selection

A sophisticated, business-forward palette that balances analytical authority with the fresh food context.

- **Primary Color**: Deep teal `oklch(0.55 0.12 200)` - Professional, trustworthy, premium SaaS aesthetic; used for primary actions and data visualization
- **Secondary Colors**: 
  - Clean white `oklch(0.99 0 0)` for backgrounds
  - Slate gray `oklch(0.35 0.01 255)` for secondary UI elements
  - Charcoal `oklch(0.20 0.01 255)` for primary text
  - Light gray `oklch(0.96 0.005 255)` for card backgrounds
- **Accent Color**: Vibrant purple `oklch(0.60 0.18 290)` - Innovation and premium features; used for pro features and highlights
- **Data Visualization Colors**:
  - Success green `oklch(0.65 0.15 145)` - revenue recovered, positive metrics
  - Warning amber `oklch(0.75 0.15 75)` - items expiring soon
  - Danger red `oklch(0.60 0.22 25)` - missed opportunities, expired items
  - Info blue `oklch(0.65 0.12 240)` - neutral statistics

**Foreground/Background Pairings**:
- Primary teal on white: `oklch(0.20 0.01 255)` text - Ratio 12.5:1 ✓
- Accent purple: `oklch(1 0 0)` white text - Ratio 5.2:1 ✓
- Success green on light background: `oklch(0.20 0.01 255)` text - Ratio 11.8:1 ✓
- Card background `oklch(0.96 0.005 255)`: Charcoal text - Ratio 14.5:1 ✓

## Font Selection

Typography should convey authority and clarity - managers need to trust the data, staff need to scan information quickly.

- **Primary Font**: Space Grotesk - Modern, distinctive geometric sans with technical precision that elevates the SaaS aesthetic
- **Secondary Font**: Inter - Clean workhorse for body text and data tables
- **Fallback**: System UI fonts for performance

**Typographic Hierarchy**:
- H1 (Dashboard Title): Space Grotesk Bold / 36px / -0.02em letter spacing / Line height 1.1
- H2 (Section Headers): Space Grotesk Semibold / 24px / -0.01em letter spacing / Line height 1.2
- H3 (Card Headers): Space Grotesk Medium / 20px / Normal spacing / Line height 1.3
- Revenue Numbers (Large): Space Grotesk Bold / 48px / Tabular nums / Line height 1
- Stat Numbers: Space Grotesk Semibold / 32px / Tabular nums / Line height 1
- Body Text: Inter Regular / 15px / Normal spacing / Line height 1.6
- Labels/Captions: Inter Medium / 13px / 0.01em letter spacing / Line height 1.4
- Button Text: Inter Semibold / 15px / Normal spacing / Line height 1
- Data Tables: Inter Regular / 14px / Tabular nums / Line height 1.5

## Animations

Animations should feel sophisticated and purposeful - reinforcing the premium SaaS experience while maintaining snappy performance.

- **Revenue Counter**: Animated number increments with easing (600ms) - satisfying value reveal
- **Chart Entrance**: Staggered line/bar animation (800ms) - data storytelling
- **Store Switch**: Crossfade with subtle slide (300ms) - smooth context change
- **Notification Badge**: Gentle pulse (1.5s loop) - draws attention without annoyance
- **Card Interactions**: Subtle lift on hover (150ms) - depth and interactivity
- **Report Generation**: Progress indicator with completion celebration (varies) - process feedback
- **Stat Updates**: Number morph animation (400ms) - live data feel
- **Tab Navigation**: Content slide transition (250ms) - spatial consistency
- **Success Actions**: Checkmark scale-in + color flash (300ms) - confirmation delight

## Component Selection

**Components**:
- **Tabs**: Main navigation between Dashboard, Products, Activity, Reports using shadcn Tabs
- **Charts**: Revenue trends using recharts with custom SaaS styling
- **Store Selector**: shadcn Select with store switching in header
- **Revenue Cards**: Custom stat cards with trend indicators and sparklines
- **Data Table**: Activity log using shadcn Table with sorting
- **Card**: Product and metric displays
- **Button**: Actions with clear hierarchy (primary/secondary/ghost)
- **Dialog**: Modals for add product, store creation, report viewing
- **Badge**: Status indicators and notification counts
- **Separator**: Visual section dividers
- **Calendar**: Date pickers for reports and product expiry
- **Progress**: Revenue goal tracking

**Customizations**:
- **Revenue Dashboard**: Custom 3-column grid with large revenue cards, trend charts, and quick stats
- **Store Performance Cards**: Comparison view with side-by-side metrics
- **Activity Timeline**: Custom timeline component showing staff actions
- **Notification Panel**: Custom dropdown with unread count badge
- **Weekly Report**: Custom report layout with charts and insights
- **Smart Discount Display**: Shows base discount + modifiers (category, time-of-day)

**States**:
- **Navigation Tabs**: Default → Hover (subtle highlight) → Active (underline + bold) → Disabled (opacity 50%)
- **Store Selector**: Shows active store name; dropdown shows all stores with performance indicators
- **Revenue Cards**: Static display with animated numbers on update
- **Charts**: Hover shows tooltip with exact values; click to drill down
- **Activity Rows**: Hover highlights row; shows additional actions

**Icon Selection**:
- ChartLine (revenue dashboard)
- Buildings (multi-store)
- ClockCountdown (time-based discounts)
- UserCircle (staff tracking)
- Bell (notifications)
- FileText (reports)
- TrendUp (positive metrics)
- TrendDown (missed opportunities)
- Calendar (date ranges)
- Funnel (category filters)

**Spacing**:
- Dashboard grid: gap-6 between major sections
- Revenue cards: p-6 internal padding
- Charts: mb-8 bottom margin for breathing room
- Data tables: p-4 cell padding
- Navigation: px-8 horizontal page padding on desktop

**Mobile**:
- Tabs convert to bottom navigation bar on mobile
- Revenue cards stack vertically
- Charts scale to full width with horizontal scroll for detail
- Store selector moves to slide-out menu
- Activity log shows condensed view with expand for details
- Reports optimized for portrait viewing
