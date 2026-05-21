# FreshSave Pro - Production-Ready Revenue Recovery Platform

A demo-ready, stable revenue recovery platform that helps grocery stores reduce waste and recover revenue through intelligent discounting. Built for reliable store demonstrations with local data persistence.

**Experience Qualities**:
1. **Stable & Reliable** - Zero-crash experience with comprehensive error handling and data validation at every touchpoint
2. **Professional** - Polished interface that demonstrates clear ROI and business value immediately upon opening
3. **Intuitive** - Staff can learn the core workflow in under 2 minutes with obvious, guided actions

**Complexity Level**: Light Application (multiple features with robust state management)
This is a production-ready MVP with intelligent discounting, multi-store management, real-time analytics, and persistent data storage. The architecture prioritizes reliability, smooth demo experience, and graceful error handling to ensure the app never crashes during customer presentations.

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
- **Functionality**: Structured category-based discount system with automated expiration logic. Meat gets highest urgency (20% category modifier), Fruit gets high urgency (15% modifier), Dairy gets medium urgency (10% modifier), and Dry Goods get minimal modifier (0%). Base discount automatically triggers based on days until expiry: ≤3 days (15% discount), ≤2 days (30% discount), ≤1 day (50% aggressive discount). Time-of-day modifiers add extra discounting during peak shopping hours.
- **Purpose**: Maximizes revenue recovery through intelligent, automated category-specific discounting that reflects real spoilage risk and market dynamics
- **Trigger**: Automatic calculation on product add and hourly recalculation for dynamic pricing
- **Progression**: Product added → Days until expiry calculated → Category evaluated (Meat/Fruit/Dairy/Dry Goods) → Base discount determined → Category modifier applied → Time-based modifier applied → Final discount calculated → Staff can override if needed
- **Success criteria**: Discounts feel intelligent and appropriate for category; recovery rates improve 15-30% vs. static discounts; meat products receive aggressive discounting earlier than dry goods

### Today's Action List (New)
- **Functionality**: Auto-generated daily dashboard card showing critical items (≤1 day), high priority items (2 days), and medium priority items (3 days). Displays count of items needing discount, items ready for labeling, and total potential revenue at risk.
- **Purpose**: Provides staff with immediate visibility into urgent actions required to prevent waste and recover revenue
- **Trigger**: Automatically generated on dashboard load; updates in real-time as product statuses change
- **Progression**: App loads → System scans all products → Groups by urgency level → Calculates potential revenue → Displays action summary → Staff clicks "View All" → Navigates to products tab filtered by urgency
- **Success criteria**: Staff can see what needs attention within 3 seconds of opening app; zero missed critical items; clear priority hierarchy guides workflow

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

### Automated Email Analytics Dashboard (New)
- **Functionality**: Comprehensive email automation system for weekly analytics reports and daily summaries. Manage email recipients (owners, managers, staff), create custom schedules (daily/weekly/monthly), configure delivery times and days, preview reports before sending, view email history, and test email generation. Supports multiple recipients per schedule with role-based access.
- **Purpose**: Automate delivery of analytics insights to stakeholders, ensuring managers and owners stay informed of performance without needing to log in
- **Trigger**: Accessed via Emails tab; schedules execute automatically based on configuration
- **Progression**: Navigate to Emails tab → Add recipients with roles → Create email schedule (select type, day, time, recipients) → Preview report HTML → Test send → Enable schedule → System auto-generates and logs reports → View history of sent emails
- **Success criteria**: Email schedules execute reliably; recipients receive professional HTML reports with accurate metrics; managers can configure schedules without technical knowledge; report previews match final emails; history provides audit trail

### Auto-Expiry Date Scanning
- **Functionality**: Camera-based barcode and OCR scanning to automatically capture expiry dates and product information from packaging
- **Purpose**: Eliminates manual data entry errors and speeds up product registration
- **Trigger**: Scan button in add product dialog
- **Progression**: Click scan → Select barcode or OCR mode → Grant camera access → Position product → System detects/extracts data → Auto-fills form fields
- **Success criteria**: 90% accuracy on common grocery barcodes; 80% accuracy on expiry date OCR; reduces data entry time from 30s to 5s per product

### Products & Workflow (Core)
- **Functionality**: Add products, view by urgency, apply discounts, print labels - enhanced with store context and barcode/OCR scanning for expiry dates
- **Purpose**: Core operational workflow maintained from original FreshSave with auto-capture capabilities
- **Trigger**: Add product button, product list interactions, scan button in add product dialog
- **Progression**: Click add product → Enter details or scan barcode/expiry date → Camera opens → Barcode detected or image captured → OCR extracts date → Auto-fills form → Complete and save
- **Success criteria**: Original workflow uncompromised; scanning reduces manual entry time by 70%

### Professional Print Label System (Enhanced)
- **Functionality**: Advanced label printing with support for thermal printers, label machines, and standard printers. Offers multiple label sizes (2"×1", 3"×2", 4"×2", standard 4"×6"), printer type selection (browser print, thermal, label machine, standard), real-time preview, barcode generation, on-screen confirmation, and seamless workflow completion.
- **Purpose**: Connect to any physical printer or label machine in the store for professional-quality price labels with clear on-screen confirmation workflow
- **Trigger**: Click "Print Label" button on discounted product
- **Progression**: Click Print Label → Select printer type (thermal/label machine/browser/standard) → Choose label size → Preview label with barcode → Click Print → System connects to printer → Print job sent → Success animation appears → Click "Confirm Printed" button → Product marked as labeled → Ready for shelf placement
- **Success criteria**: Works with all printer types via browser print API or USB connection; supports standard label sizes used in grocery stores; provides clear confirmation that label was printed; generates professional labels with barcodes; smooth workflow from discount to shelf-ready product

### Bulk Printer Mode & Network Integration (New)
- **Functionality**: Enterprise-grade bulk label printing system with network printer discovery, multi-product selection, batch printing, and real-time print queue management. Auto-discovers network printers (Zebra, Brother, Dymo, HP), shows printer status (online/offline/paper-low), allows selection of multiple discounted products via checkboxes, configures copies per label (1-10), label sizes (small/medium/large), and optional barcode/QR code inclusion. Displays real-time print progress with percentage complete and handles printer errors gracefully.
- **Purpose**: Streamline high-volume label printing for stores with many discounted products, eliminating the need to print labels one-by-one and integrating with professional store printer networks
- **Trigger**: Click "Bulk Print Labels" button on Products tab (enabled when discounted products exist)
- **Progression**: Click Bulk Print → Scan network for printers → Select printer from discovered list → Check products to print → Configure copies and label settings → Test printer connection (optional) → Click Print → System sends batch to printer → Real-time progress bar updates → All labels print sequentially → Products automatically marked as labeled → Confirmation toast shows total labels printed
- **Success criteria**: Discovers and connects to 95% of common network printers; prints 50+ labels in under 2 minutes; handles printer errors with clear recovery options; reduces label printing time by 80% for stores with 20+ products; seamless integration with existing workflow

## Edge Case Handling

- **Expired Products** - Separate section with remove option; contribute to "missed opportunities" metric
- **No Products in Store** - Empty state with "Add Product" prompt
- **No Stores Created** - Onboarding flow to create first store
- **Store Switching** - Clear confirmation when switching; unsaved work warnings
- **Staff Attribution** - Falls back to "System" if user not identified
- **Network Offline** - All data persists locally using useKV; syncs when reconnected
- **Invalid Dates** - Form validation prevents past dates
- **Report Generation Failure** - Retry mechanism; shows last successful report
- **Multi-Store Data Conflicts** - Each store has independent data namespace
- **Time Zone Handling** - Store-level time zone settings for accurate expiry calculations
- **Camera Access Denied** - Fallback to manual entry with clear messaging
- **OCR Scan Failure** - Option to retry or switch to manual entry; confidence scores shown
- **Barcode Not Found** - LLM generates realistic product name based on barcode pattern
- **Poor Lighting Conditions** - Visual feedback guides user to improve camera angle/lighting
- **Printer Offline** - Clear error message with troubleshooting steps; option to select different printer
- **Printer Out of Paper** - Real-time status detection with alert before starting bulk print job
- **Network Printer Not Discovered** - Manual IP entry option; retry scan mechanism
- **Print Job Failure Mid-Batch** - Resumes from last successful print; doesn't lose progress
- **No Discounted Products** - Bulk print button disabled with tooltip explaining why
- **Multiple Date Formats** - OCR intelligently parses various date formats (MM/DD/YYYY, DD-MM-YYYY, etc.)
- **Category-Specific Logic** - Discount calculations account for all four categories (Meat, Fruit, Dairy, Dry Goods); missing category defaults to lowest modifier
- **Zero Days Until Expiry** - Products expiring today receive maximum urgency and prominent placement in Today's Action List
- **Manual Discount Overrides** - Custom percentages bypass automatic calculations while maintaining category display
- **Printer Connection Failure** - Clear error message with retry option; fallback to manual confirmation
- **Label Size Mismatch** - Preview adjusts to selected size before printing
- **USB Printer Not Detected** - Graceful fallback to browser print with instruction message
- **Print Job Incomplete** - On-screen confirmation button allows staff to verify before marking as printed
- **Multiple Label Prints** - Can reprint labels if needed; doesn't duplicate product status
- **No Email Recipients** - Schedule creation disabled with clear message; prompts to add recipients first
- **Invalid Email Format** - Form validation prevents malformed email addresses
- **Schedule Conflicts** - Multiple schedules can exist; each executes independently
- **Email Generation Failure** - Graceful error handling with retry option; falls back to manual report generation
- **Empty Data Sets** - Reports include helpful messaging when no data is available for the period
- **Time Zone Differences** - Schedules execute based on browser/system time; considers store time zone for data calculations
- **Recipient Removed Mid-Schedule** - Schedule automatically filters out deleted recipients; warns if no recipients remain

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
- EnvelopeSimple (email analytics)
- TrendUp (positive metrics)
- TrendDown (missed opportunities)
- Calendar (date ranges)
- Funnel (category filters)
- Camera (photo capture)
- Barcode (barcode scanning)
- TextAa (OCR text recognition)
- Scan (scanning indicator)
- CheckCircle (scan success)
- Printer (print label)
- DeviceMobile (mobile/label printer)
- Desktop (desktop printer)

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
