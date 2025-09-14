# InsiderTrack Pro Design Guidelines

## Design Approach: Financial Data Dashboard (Design System)
**Selected System**: Material Design with financial industry adaptations
**Justification**: This is a utility-focused, information-dense application requiring trust, clarity, and efficient data consumption. Financial professionals need quick access to complex data with minimal cognitive load.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (default):
- Background: 210 15% 8%
- Surface: 210 15% 12% 
- Primary: 210 80% 55% (professional blue)
- Success: 120 60% 45% (buy signals)
- Warning: 35 85% 55% (hold/caution)
- Danger: 0 70% 50% (sell signals)
- Text: 210 10% 92%

**Light Mode**:
- Background: 210 20% 98%
- Surface: 210 15% 95%
- Primary: 210 80% 45%
- Text: 210 15% 15%

### B. Typography
**Primary**: Inter (Google Fonts) - excellent readability for data
**Monospace**: JetBrains Mono (Google Fonts) - for ticker symbols, prices, dates
**Hierarchy**: h1(2xl), h2(xl), h3(lg), body(base), caption(sm), data(xs mono)

### C. Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16
- Dense data: p-2, gap-2
- Component spacing: p-4, m-4
- Section breaks: p-6, mb-8
- Page margins: p-8, container max-width

### D. Component Library
**Navigation**: Fixed sidebar with collapsible sections (Watchlists, Analysis, Alerts)
**Data Tables**: Sortable columns, row hover states, sticky headers
**Cards**: Elevated surfaces for individual stock/insider profiles
**Charts**: Clean line charts for price movements, bar charts for volume
**Forms**: Floating labels, validation states
**Alerts**: Toast notifications for new filings, price alerts

**Key Financial Components**:
- Stock ticker badges with real-time prices
- Insider transaction cards with buy/sell indicators
- Risk assessment meters with color coding
- Filing timeline with expandable details
- Portfolio tracking widgets

### E. Data Visualization
**Chart Colors**: Use primary blue for main data, success/danger for gains/losses
**Tables**: Zebra striping, compact row height, right-aligned numbers
**Icons**: Heroicons for UI, custom financial icons for transaction types

## Interaction Patterns
- Hover states reveal additional data without navigation
- Click-through drilling from overview to detailed analysis
- Real-time updates with subtle animations (pulse for new data)
- Keyboard shortcuts for power users (J/K navigation, S for search)

## Trust & Credibility
- Clean, professional aesthetic avoiding flashy elements
- Clear data sources and timestamps
- Conservative use of color - let data quality speak
- Consistent spacing and typography for cognitive ease