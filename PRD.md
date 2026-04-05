# FreshSave - Grocery Waste Recovery System

A mobile-first application that helps grocery store staff reduce waste and recover revenue by intelligently discounting expiring products.

**Experience Qualities**:
1. **Effortless** - Non-technical staff should complete tasks with zero training or confusion
2. **Immediate** - Every action feels instant with clear visual feedback and no waiting
3. **Trustworthy** - Clean, professional design that store managers feel confident deploying

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with clear workflows - add products, view urgency-sorted lists, apply discounts, and print labels. State management is straightforward (product list, discount calculations), but the app serves a critical business function requiring polish and reliability.

## Essential Features

### Dashboard View
- **Functionality**: Displays all products sorted by expiration urgency with key metrics
- **Purpose**: Gives staff immediate visibility into what needs attention today
- **Trigger**: App launch (default view)
- **Progression**: App opens → Stats cards show today's metrics → Product list organized by urgency (Today/Tomorrow/This Week) → Tap product to view details
- **Success criteria**: Staff can identify critical items within 3 seconds of opening the app

### Add Product
- **Functionality**: Quick form to register new expiring products
- **Purpose**: Rapid data entry during inventory walks or receiving
- **Trigger**: Tap floating "+" button from dashboard
- **Progression**: Tap + → Dialog opens → Fill name, category, price, expiry → Save → Product appears in appropriate urgency section → Success animation
- **Success criteria**: Add a product in under 20 seconds; form validates and prevents errors

### Smart Discount Engine
- **Functionality**: Automatically calculates discounts based on days until expiry (3 days = 10%, 2 days = 25%, 1 day = 50%)
- **Purpose**: Removes mental math and ensures consistent pricing strategy
- **Trigger**: Automatic on product creation and daily recalculation
- **Progression**: Product saved → Days until expiry calculated → Discount percentage determined → New price computed → Badge displays discount %
- **Success criteria**: Discounts update correctly and display prominently; calculations are always accurate

### Apply Discount Action
- **Functionality**: Marks product as discounted and ready for label printing
- **Purpose**: Confirms staff intent to apply the suggested discount
- **Trigger**: Tap "Apply Discount" button on product card
- **Progression**: Tap button → Satisfying animation → Button changes to "Print Label" → Product marked as discounted → Stats update
- **Success criteria**: Visual confirmation is immediate and obvious; action is reversible

### Label Generator
- **Functionality**: Creates a printable price label optimized for thermal or standard printers
- **Purpose**: Provides customer-facing price labels without manual writing
- **Trigger**: Tap "Print Label" button on discounted product
- **Progression**: Tap Print → Print dialog opens → Label preview shown → Print confirmation → Product marked as labeled
- **Success criteria**: Label is readable, properly formatted, and prints correctly on common store printers

### Revenue Recovery Tracking
- **Functionality**: Calculates potential revenue recovered from discounted sales vs. total loss
- **Purpose**: Shows staff the business impact of their work
- **Trigger**: Automatic calculation based on discounted products
- **Progression**: Product discounted → Difference between discounted price and $0 (waste) calculated → Running total updated → Displayed in stats
- **Success criteria**: Numbers are encouraging and update in real-time

## Edge Case Handling

- **Expired Products** - Items past expiry date show in separate "Expired" section with remove option (cannot be discounted)
- **No Products** - Empty state with clear "Add Your First Product" prompt and helpful icon
- **Invalid Dates** - Form prevents selecting past dates; shows helpful error message
- **Negative Prices** - Validation ensures prices are positive numbers
- **Network Offline** - All data persists locally; app works completely offline
- **Duplicate Entries** - Allow duplicates (same product name) since batch tracking may be needed
- **Print Failure** - Retry button and manual label info shown if print fails

## Design Direction

The design should feel like a professional retail tool - clean, fast, and confidence-inspiring. Think Apple Store checkout system meets modern inventory management. Staff should feel like they're using premium, reliable software that respects their time. Visual hierarchy must be immediately obvious with critical items (expiring today) demanding attention while tomorrow's items sit comfortably in view. The experience should feel satisfying - applying discounts and printing labels should have a tactile, accomplished feeling.

## Color Selection

A fresh, food-forward palette that balances urgency with approachability.

- **Primary Color**: Fresh lime green `oklch(0.75 0.15 135)` - Represents freshness, growth, and positive action; used for primary CTAs and success states
- **Secondary Colors**: 
  - Crisp white `oklch(0.99 0 0)` for backgrounds - clean, sterile like a well-run store
  - Slate gray `oklch(0.35 0.01 255)` for secondary elements and borders
  - Deep charcoal `oklch(0.25 0.01 255)` for primary text
- **Accent Color**: Vibrant orange `oklch(0.70 0.18 45)` - Urgency and attention; used for "expiring today" indicators and important actions
- **Supporting Colors**:
  - Warning yellow `oklch(0.85 0.15 90)` for tomorrow's items
  - Gentle blue `oklch(0.65 0.12 240)` for informational stats
  - Danger red `oklch(0.60 0.22 25)` for expired items and delete actions

**Foreground/Background Pairings**:
- Primary lime on white: `oklch(0.25 0.01 255)` text - Ratio 10.8:1 ✓
- Orange accent: `oklch(1 0 0)` white text - Ratio 4.9:1 ✓
- Charcoal on white: `oklch(0.25 0.01 255)` on `oklch(0.99 0 0)` - Ratio 14.2:1 ✓
- Stats background blue `oklch(0.95 0.02 240)`: Charcoal text `oklch(0.25 0.01 255)` - Ratio 13.1:1 ✓

## Font Selection

Typography should feel modern, readable, and authoritative - staff need to scan information quickly and trust what they see.

- **Primary Font**: Inter - Clean, highly legible at all sizes, professional without being corporate
- **Fallback**: System UI fonts for maximum performance

**Typographic Hierarchy**:
- H1 (Page Title): Inter Bold / 32px / -0.02em letter spacing / Line height 1.2
- H2 (Section Headers): Inter Semibold / 20px / -0.01em letter spacing / Line height 1.3
- Product Name: Inter Medium / 18px / Normal spacing / Line height 1.4
- Body Text: Inter Regular / 16px / Normal spacing / Line height 1.5
- Price (Large): Inter Bold / 28px / Tabular nums / Line height 1.2
- Price (Small): Inter Medium / 16px / Tabular nums / Line height 1
- Labels/Captions: Inter Medium / 14px / 0.01em letter spacing / Line height 1.3
- Button Text: Inter Semibold / 16px / Normal spacing / Line height 1

## Animations

Animations should provide satisfying feedback for actions while maintaining speed - every animation reinforces that the app is responsive and reliable.

- **Discount Application**: Scale pulse + checkmark appearance (300ms) - celebrates staff action
- **Card Interactions**: Gentle lift on hover/press (150ms) - tactile feedback
- **Stats Counter**: Number increment animation when values change (400ms ease-out) - shows live updates
- **List Additions**: Slide-in from right (250ms) - shows where new items appear
- **Success States**: Subtle green flash + check icon fade-in (200ms) - confirms action
- **Delete/Remove**: Swipe-away animation (300ms) - clear cause and effect
- **Page Transitions**: Crossfade (200ms) - smooth but imperceptible
- **Loading States**: Gentle skeleton pulse (1.5s loop) - indicates progress without anxiety

## Component Selection

**Components**:
- **Card**: Product display with shadcn Card component; add colored left border for urgency indicator (4px solid border-l)
- **Button**: Primary actions use shadcn Button with size="lg" for easy mobile taps; secondary actions use variant="outline"
- **Dialog**: Add product form uses shadcn Dialog for modal overlay; keeps focus on task
- **Form**: React Hook Form + Zod validation with shadcn Form components for inputs
- **Input**: Standard shadcn Input with increased touch targets (min-h-12)
- **Select**: Category selection with shadcn Select component
- **Badge**: Discount percentage display with custom color variants
- **Calendar**: Date picker using shadcn Calendar component for expiry date selection
- **Separator**: Visual dividers between urgency sections
- **Stats Cards**: Custom component using Card base with icon, label, and large number

**Customizations**:
- **Urgency Indicators**: Color-coded left border on cards (red/orange/yellow/blue based on days)
- **Print Label**: Custom component with optimized print stylesheet
- **Floating Action Button**: Custom positioned button with Plus icon from phosphor-icons
- **Empty States**: Custom illustrations with helpful copy
- **Price Display**: Custom component with strikethrough old price and bold new price

**States**:
- **Buttons**: Default (solid bg) → Hover (slightly darker, subtle lift shadow) → Active (scale 0.98) → Disabled (opacity 50%, no interaction)
- **Cards**: Default (white bg, subtle border) → Hover (shadow-md, slight lift) → Selected (primary border)
- **Inputs**: Default (border) → Focus (ring-2 ring-primary) → Error (ring-destructive, error message below) → Filled (border-primary)
- **Product Status**: Pending (neutral) → Discounted (success badge) → Labeled (complete badge) → Expired (danger badge)

**Icon Selection**:
- Plus (add product)
- Calendar (expiry date)
- Tag (discount/price)
- Printer (print label)
- TrendingUp (revenue stats)
- Clock (urgency indicator)
- ShoppingCart (category: general)
- Apple (produce)
- Drop (dairy)
- Fish (meat/seafood)
- Package (packaged goods)
- TrashSimple (remove expired)
- CheckCircle (action complete)

**Spacing**:
- Page padding: p-4 (mobile), p-6 (tablet+)
- Card spacing: p-4 internal, gap-3 between elements
- Section gaps: gap-6 between major sections
- Stats grid: gap-4 between stat cards
- Form fields: gap-4 vertical spacing
- Button groups: gap-2 horizontal

**Mobile**:
- Single column layout throughout (no breakpoint switching needed)
- Bottom-fixed floating action button (Add Product)
- Stats cards: 2-column grid on mobile, 4-column on tablet+
- Touch targets minimum 44px height
- Simplified product cards on mobile: stack info vertically
- Print labels: Full-screen overlay on mobile for preview
- Sticky header with app title
- Generous spacing (never cramped)
