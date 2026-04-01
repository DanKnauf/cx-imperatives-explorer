# CX Imperatives 2026: Interactive Survey Data Explorer

## Project Spec for Claude Code

---

## 1. Project Overview

Build a public-facing, interactive web application that allows users to explore the **Merkle CX Imperatives 2026** consumer survey dataset. The tool should let users browse questions, filter by brand category or sector, compare response items side by side, and switch between chart types. This is a **proof of concept** intended for CMO review before potential handoff to a production web team.

### Goals

- Provide an intuitive, polished data exploration experience for a non-technical marketing audience
- Allow dynamic slicing of survey cross-tabs by brand category (19 categories) and brand sector (8 sectors)
- Support multiple chart types (bar, horizontal bar, grouped bar, radar, heatmap) per question
- Deliver production-quality UX suitable for a public website (responsive, accessible, performant)
- Use **only open-source, MIT/Apache-licensed libraries** with no commercial license requirements

---

## 2. Recommended Technology Stack

### Framework: Next.js (App Router, Static Export)

- **Why**: React-based, supports static site generation (SSG) for CDN deployment, strong SEO, TypeScript-first, widely adopted. The entire app can be exported as static HTML/JS/CSS with `next export`, requiring no server runtime.
- **License**: MIT
- **Docs**: https://nextjs.org/docs

### Charting: Apache ECharts via `echarts-for-react`

- **Why**: Apache ECharts is the strongest open-source option for this project. It provides 20+ chart types out of the box (bar, line, radar, heatmap, pie, scatter, treemap, sankey, and more), built-in responsive design, rich tooltip/legend interactivity, theming support, and excellent performance with mid-size datasets. It is backed by the Apache Software Foundation and used at enterprise scale. The `echarts-for-react` wrapper provides idiomatic React integration.
- **License**: Apache 2.0 (ECharts), MIT (echarts-for-react)
- **Docs**: https://echarts.apache.org/en/index.html
- **React wrapper**: https://github.com/hustcc/echarts-for-react

### Styling: Tailwind CSS + shadcn/ui

- **Why**: Utility-first CSS that produces clean, maintainable, responsive layouts. shadcn/ui provides accessible, well-designed UI primitives (dropdowns, tabs, cards, dialogs) built on Radix UI, all copy-pasted into the repo (no runtime dependency).
- **License**: MIT
- **Docs**: https://tailwindcss.com / https://ui.shadcn.com

### Data Layer: Static JSON (no database)

- The Excel survey data should be pre-processed at build time into a structured JSON file (or set of JSON files) that the app imports directly. No API server or database is needed. This keeps the deployment simple and the app fast.

### Deployment Target

- **Vercel** (free tier, zero-config for Next.js) or any static hosting (Netlify, AWS S3 + CloudFront, Azure Static Web Apps)
- The build output is pure static HTML/JS/CSS

---

## 3. Alternative Libraries Considered (and Why ECharts Wins)

| Library | License | Pros | Cons for This Project |
|---------|---------|------|-----------------------|
| **Apache ECharts** | Apache 2.0 | 20+ chart types, heatmaps, radar, rich interactivity, theming, great docs, enterprise-proven | Slightly larger bundle than Chart.js (~800KB full, tree-shakeable to ~300KB) |
| **Recharts** | MIT | React-native, declarative, easy to learn | Limited chart types (no heatmap, no radar without hacks), less polished tooltips |
| **Chart.js** | MIT | Lightweight, simple API | Fewer chart types, canvas-based (less crisp on retina), limited cross-tab comparison UX |
| **D3.js** | ISC | Maximum flexibility, SVG-based | Requires building everything from scratch; massive development effort for a PoC |
| **Plotly.js** | MIT | Great for data science, 3D | Very large bundle (~3.5MB), opinionated styling, harder to brand |
| **Nivo** | MIT | Beautiful defaults, React-native | Missing some chart types, smaller community, less battle-tested at scale |

**Verdict**: ECharts gives us the richest set of chart types (especially heatmap and radar, which are critical for cross-tab survey data), built-in interactivity (brush selection, zoom, linked tooltips), and a proven track record in production dashboards, all under a permissive open-source license.

---

## 4. Dataset Structure

### Source File

`989-25_CX_Imperatives_2026_-_Survey_Data_Tables__Topline_.xlsx`

### Sheets and Content

The workbook contains 5 sheets with the following structure:

| Sheet | Questions | Description |
|-------|-----------|-------------|
| **TOC** | n/a | Table of contents listing all survey questions |
| **Screening & Classification** | Q1 through Q10 | Demographics: age/generation, country, region, household size, children, net worth, HNWI status, community type, residential status, CX activities, brand category assignment |
| **CX Activities & Expectations** | Q12 through Q15 | Channel usage by brand category (19 cols), CX importance by brand sector (8 cols), experience delivery agreement by sector, post-experience outcomes by sector |
| **Personalization & High-Touch CX** | Q16 through Q22 | Personalization value types by category, data usage sentiment by category and sector, personalization amount/helpfulness, personalization attitudes (topline), high-touch experience attitudes, valued features |
| **Digital Experiences & AI** | Q23 through Q33 | Technology familiarity (topline), technology usage (topline), tech experience impact by category and sector, AI usage contexts by category and sector, AI chatbot attitudes, AI assistant attitudes, AI agent readiness, AI agent desired activities by category and sector, AI concerns by category and sector, CX improvement priorities by category and sector, future experience preferences by category and sector |

### Cross-Tab Dimensions

Questions are cross-tabulated against two levels of granularity:

**19 Brand Categories** (used in Q12, Q16, Q17, Q18, Q19, Q25, Q26, Q30, Q31, Q32, Q33):
retailer, packaged goods brand, clothing or textile brand, financial services provider, insurance provider, healthcare provider, household (durable) goods brand, outdoor recreation or sporting goods brand, vehicle manufacturer, electronics (hardware) brand, software brand, telecommunications service provider, travel or transportation company, restaurant or foodservice brand, hospitality brand, media brand, entertainment brand, nonprofit organization

**8 Brand Sectors** (used in Q13, Q14, Q15, Q17, Q18, Q19, Q25, Q26, Q30, Q31, Q32, Q33):
RETAIL & CPG, FINSERV & INSURANCE, HEALTHCARE, AUTO & MFG, TECH & TELECOM, TRAVEL & HOSPITALITY, MEDIA & ENTERTAINMENT, NONPROFIT

**Topline only** (some questions like Q1 through Q9, Q20 through Q24, Q27 through Q29):
Single column with overall percentage, no cross-tab breakdown.

### Data Format

Each question block follows this pattern:
- **Row 1**: Question text (sometimes with cross-tab descriptor in the text itself)
- **Row 2**: Column headers (`Column %`, then category/sector names) OR (`[space]`, `%`) for topline
- **Rows 3+**: Response options with decimal percentages (e.g., 0.5464 = 54.64%)
- **Final row**: `NET` row summing to 1.0 (or near 1.0 for multi-select questions)

---

## 5. Data Pre-Processing (Build-Time Script)

Create a Node.js or Python script (`scripts/process-data.py` or `scripts/process-data.ts`) that reads the Excel file and outputs a structured JSON file at `src/data/survey-data.json`.

### Target JSON Schema

```json
{
  "metadata": {
    "title": "CX Imperatives 2026",
    "subtitle": "Consumer Survey Data Tables (Topline)",
    "totalRespondents": 2500,
    "fieldDates": "2025"
  },
  "sections": [
    {
      "id": "screening",
      "title": "Screening & Classification",
      "questions": [
        {
          "id": "q1",
          "questionNumber": "Q1",
          "text": "First, what is your current age?",
          "type": "topline",
          "crossTabDimension": null,
          "responses": [
            { "label": "Gen Z", "values": { "NET": 0.2108 } },
            { "label": "Millennial", "values": { "NET": 0.314 } },
            { "label": "Gen X", "values": { "NET": 0.2968 } },
            { "label": "Baby Boomer", "values": { "NET": 0.1784 } }
          ]
        },
        {
          "id": "q12",
          "questionNumber": "Q12",
          "text": "Which of the following channels have you used?",
          "type": "by_category",
          "crossTabDimension": "Brand Category",
          "crossTabColumns": ["NET", "retailer", "packaged goods brand", "..."],
          "responses": [
            {
              "label": "Physical store or location",
              "values": {
                "NET": 0.5464,
                "retailer": 0.7544,
                "packaged goods brand": 0.6638,
                "...": "..."
              }
            }
          ]
        }
      ]
    }
  ],
  "dimensions": {
    "categories": ["retailer", "packaged goods brand", "..."],
    "sectors": ["RETAIL & CPG", "FINSERV & INSURANCE", "..."]
  }
}
```

### Processing Rules

1. Skip the TOC sheet entirely
2. Parse each question block by detecting rows that start with `Q` followed by a digit
3. Determine cross-tab type from the header row: if `Column %` is present, it is a cross-tab; if the header is `[space], %`, it is topline
4. Strip `NET` summary rows from response data (keep them as a computed field if useful)
5. Convert all percentage decimals to their decimal form (they are already decimals in the source, e.g., 0.5464)
6. Clean up question text: remove pipe codes like `[CX ACTIVITY]`, `[ASSIGNED BRAND TYPE]`, `[Q10 CATEGORY]` and replace with clean contextual labels
7. For Q13, Q14, Q15 which have multiple sub-tables by CX activity, group them under a parent question with an activity selector dimension

---

## 6. Application Architecture

### Directory Structure

```
cx-imperatives-explorer/
  src/
    app/
      layout.tsx              # Root layout with nav, footer, metadata
      page.tsx                # Landing page / section overview
      [sectionId]/
        page.tsx              # Section view with question list
        [questionId]/
          page.tsx            # Individual question deep-dive
    components/
      charts/
        BarChart.tsx           # Horizontal and vertical bar charts
        GroupedBarChart.tsx     # Side-by-side comparison bars
        RadarChart.tsx         # Radar/spider chart for multi-attribute
        HeatmapChart.tsx       # Category x Response heatmap
        PieChart.tsx           # For topline demographic splits
        ChartContainer.tsx     # Wrapper with chart type switcher
      filters/
        CategoryFilter.tsx     # Multi-select for brand categories
        SectorFilter.tsx       # Multi-select for brand sectors
        DimensionToggle.tsx    # Switch between category and sector view
      layout/
        Header.tsx
        Footer.tsx
        Sidebar.tsx            # Section navigation
        Breadcrumbs.tsx
      ui/                      # shadcn/ui components (Button, Select, etc.)
    data/
      survey-data.json         # Pre-processed dataset
    lib/
      chart-config.ts          # ECharts theme, color palettes, defaults
      data-utils.ts            # Helpers for filtering, sorting, formatting
      constants.ts             # Section labels, color maps, etc.
    hooks/
      useChartData.ts          # Custom hook for filtered data selection
      useFilterState.ts        # URL-synced filter state management
  scripts/
    process-data.py            # Excel to JSON converter
  public/
    favicon.ico
    og-image.png               # Social sharing image
  tailwind.config.ts
  next.config.ts
  package.json
  tsconfig.json
```

### Page Structure

**Landing Page** (`/`)
- Hero section with report title, description, key stats
- Four clickable section cards (Screening, CX Activities, Personalization, Digital & AI)
- Each card shows a preview stat or mini-chart

**Section Page** (`/[sectionId]`)
- Left sidebar listing all questions in the section
- Main content area showing the first (or selected) question
- Filter controls at top (category/sector selectors)

**Question Deep-Dive** (`/[sectionId]/[questionId]`)
- Full question text displayed prominently
- Chart type selector (bar, grouped bar, radar, heatmap, table)
- Filter bar for selecting which categories/sectors to compare
- Chart area (responsive, full width)
- Data table toggle (show/hide raw numbers below the chart)
- Share/export controls (download chart as PNG, copy link)

---

## 7. Key UX Features

### 7.1 Chart Type Switcher

For each question, offer contextually appropriate chart types:

| Data Type | Default Chart | Available Alternatives |
|-----------|--------------|----------------------|
| Topline (single %) | Horizontal bar | Pie/donut, vertical bar |
| Cross-tab by category (19 cols) | Grouped horizontal bar | Heatmap, radar (limit to 6-8 selected), table |
| Cross-tab by sector (8 cols) | Grouped bar | Radar, heatmap, table |
| Multi-activity sub-questions | Heatmap | Grouped bar with activity selector |

### 7.2 Interactive Filtering

- **Category/Sector selector**: Multi-select dropdown with "Select All" / "Clear All". Default to showing NET + top 5 categories by value.
- **Sort control**: Sort response items by NET value (default), alphabetical, or by a specific category's value.
- **Highlight mode**: Click a category in the legend to highlight it across all response items; click again to isolate it.

### 7.3 Tooltips and Labels

- Tooltips on hover showing exact percentage, formatted as "54.6%" (one decimal place)
- Axis labels truncated with ellipsis on small screens, full text on hover
- Legend outside the chart, toggleable per series

### 7.4 Responsive Design

- Desktop (1200px+): Side navigation + full chart area
- Tablet (768px-1199px): Collapsible nav, full-width charts
- Mobile (< 768px): Bottom sheet navigation, stacked charts, horizontal scrolling for wide heatmaps

### 7.5 URL State

All filter selections, chart type, and current question should be reflected in the URL query string so users can share specific views:
```
/digital-ai/q30?sectors=RETAIL%20%26%20CPG,HEALTHCARE&chart=radar
```

### 7.6 Data Table View

Every chart should have a toggle to show the underlying data as an accessible HTML table. This serves both as an accessibility fallback and as a "see the numbers" feature for detail-oriented users.

### 7.7 Export

- **Download Chart as PNG**: Use ECharts built-in `saveAsImage` toolbox feature
- **Download Data as CSV**: Generate a CSV of the currently filtered view
- **Copy Share Link**: Copy the current URL (with filters) to clipboard

---

## 8. Theming and Brand Guidelines

### Color Palette

Use a professional, neutral palette with strong accent colors for data series. Suggested starting point (customize to Merkle brand if desired):

```typescript
const BRAND_COLORS = {
  primary: '#1B2A4A',      // Deep navy (headers, primary text)
  secondary: '#3B82F6',    // Blue (primary accent)
  background: '#FAFBFC',   // Light gray background
  surface: '#FFFFFF',       // Card/chart backgrounds
  text: '#1F2937',          // Body text
  textMuted: '#6B7280',    // Secondary text
};

// Data series palette (12 distinct, accessible colors)
const CHART_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#14B8A6', '#6366F1', '#84CC16', '#D946EF',
];
```

### Typography

- Headings: Inter (or system font stack)
- Body: Inter (or system font stack)
- Data labels: Tabular numbers (monospace or tabular-nums font feature)

### Chart Styling

```typescript
// ECharts theme registration
const theme = {
  color: CHART_PALETTE,
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Inter, system-ui, sans-serif' },
  title: {
    textStyle: { fontSize: 16, fontWeight: 600, color: '#1F2937' },
    subtextStyle: { fontSize: 13, color: '#6B7280' },
  },
  tooltip: {
    backgroundColor: '#1F2937',
    textStyle: { color: '#FFFFFF' },
    borderWidth: 0,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },
  grid: { containLabel: true, left: 20, right: 20, top: 60, bottom: 40 },
};
```

---

## 9. Performance Considerations

- **Static JSON import**: The dataset is small (roughly 67 questions, each with 5-20 response items across up to 19 columns). The entire JSON will be under 500KB. Import it statically rather than fetching at runtime.
- **Tree-shake ECharts**: Import only the chart types and components used (bar, radar, heatmap, pie, tooltip, legend, grid) rather than the full ECharts bundle. This can reduce bundle size from ~800KB to ~300KB.
- **Next.js Image Optimization**: Use `next/image` for any static images (logo, og-image).
- **Code splitting**: Next.js App Router handles this automatically per route.
- **Lighthouse target**: Aim for 90+ on Performance, Accessibility, Best Practices, SEO.

### ECharts Tree-Shaking Example

```typescript
import * as echarts from 'echarts/core';
import { BarChart, RadarChart, HeatmapChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, ToolboxComponent, DataZoomComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, RadarChart, HeatmapChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, ToolboxComponent, DataZoomComponent,
  VisualMapComponent, CanvasRenderer,
]);
```

---

## 10. Accessibility Requirements

- All charts must have an `aria-label` describing the data being shown
- The data table toggle provides a screen-reader-accessible alternative to every chart
- Color palette must pass WCAG AA contrast against the chart background
- Keyboard navigation for filter controls, chart type switcher, and section navigation
- Focus management when switching questions or applying filters
- Reduced motion preference respected (disable chart animations when `prefers-reduced-motion` is set)

---

## 11. Security Considerations (for Public Deployment)

- **No server-side code**: Static export means no attack surface for server vulnerabilities
- **No user input stored**: The app is read-only; no forms, no databases, no user accounts
- **CSP headers**: Configure Content Security Policy in Next.js config or hosting platform to restrict script sources
- **Subresource Integrity**: Pin CDN resources (if any) with SRI hashes
- **HTTPS only**: Enforce via hosting platform (Vercel does this by default)

---

## 12. Build and Run Instructions

### Prerequisites

- Node.js 20+
- Python 3.10+ (for data processing script only)
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repo
git clone https://github.com/DanKnauf/cx-imperatives-explorer.git
cd cx-imperatives-explorer

# Install dependencies
pnpm install

# Process the Excel data into JSON
# (place the source .xlsx in scripts/data/)
python scripts/process-data.py

# Run development server
pnpm dev

# Build for production (static export)
pnpm build

# Preview production build locally
pnpm start
```

### Environment Variables

None required. The app is entirely static with no external API calls.

### Deployment to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deployments on push.

---

## 13. Package Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toggle-group": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

All dependencies are MIT or Apache 2.0 licensed.

---

## 14. Data Processing Script Specification

### Input

`scripts/data/989-25_CX_Imperatives_2026_-_Survey_Data_Tables__Topline_.xlsx`

### Output

`src/data/survey-data.json` (schema defined in Section 5)

### Processing Logic (Python with openpyxl)

```python
# Pseudocode for the data processor

# 1. Open workbook in read-only mode
# 2. For each data sheet (skip TOC):
#    a. Scan rows to identify question blocks
#       - A question block starts with a cell matching /^Q\d+\./
#       - The next row is the header row (cross-tab columns or topline marker)
#       - Subsequent rows until the next Q or blank section are response items
#    b. For each question block:
#       - Extract question text, clean piped variables
#       - Determine cross-tab type (topline, by_category, by_sector)
#       - Extract column headers
#       - Extract response label + values for each row
#       - Skip NET rows (label == "NET")
#    c. Group sub-questions (e.g., Q13 by activity) under parent
# 3. Assemble sections array
# 4. Write JSON with 2-space indent
```

### Question Text Cleaning Rules

| Raw Pattern | Replacement |
|-------------|-------------|
| `[CX ACTIVITY]` | Remove or replace with "engage" |
| `[ASSIGNED BRAND TYPE]` | "brands" |
| `[Q10 CATEGORY]` | "your assigned brand category" |
| `[BRAND CATEGORY]` | "your brand category" |
| `[Q10 BRAND]` | "brands" |
| `[PIPE Q10 CATEGORY NAME]` | "brand" |
| `\xa0` (non-breaking space) | Regular space |
| `by Q10. CATEGORY (Brand Category Assigned)` | Remove (metadata, not display text) |
| `by Q10. GROUP (Brand Sector Assigned)` | Remove (metadata, not display text) |

---

## 15. Stretch Goals (Post-PoC)

These features are not required for the initial proof of concept but would add value for a production release:

1. **Cross-question comparison**: Select two questions and view them side by side
2. **Demographic filtering**: Filter all questions by generation (Gen Z vs. Millennial vs. Gen X vs. Boomer) or region, if the data supports it
3. **Animated transitions**: Smooth chart transitions when switching filters or chart types
4. **Print/PDF export**: Generate a formatted PDF report of selected charts
5. **Search**: Full-text search across question text to find relevant data quickly
6. **Embed mode**: iframe-embeddable version of individual charts for use in blog posts or presentations
7. **Dark mode**: Toggle between light and dark themes
8. **AI-powered insights**: Use an LLM API to generate natural-language summaries of notable findings in each chart

---

## 16. Success Criteria

The PoC is considered successful if:

1. All 67 questions from the survey are browsable and visualizable
2. Users can filter by brand category (19) and brand sector (8) on cross-tabulated questions
3. At least 3 chart types are available per cross-tab question (bar, radar, heatmap)
4. The app loads in under 2 seconds on a standard broadband connection
5. The app is fully responsive and usable on mobile devices
6. The CMO can navigate the tool without instructions and understand the data within 5 minutes
7. No commercial licenses are required for any dependency

---

## 17. Key Reference Links

| Resource | URL |
|----------|-----|
| Apache ECharts Documentation | https://echarts.apache.org/en/index.html |
| Apache ECharts Examples Gallery | https://echarts.apache.org/examples/en/index.html |
| echarts-for-react GitHub | https://github.com/hustcc/echarts-for-react |
| Next.js Documentation | https://nextjs.org/docs |
| Next.js Static Export Guide | https://nextjs.org/docs/app/building-your-application/deploying/static-exports |
| shadcn/ui Components | https://ui.shadcn.com |
| Tailwind CSS Documentation | https://tailwindcss.com/docs |
| Vercel Deployment | https://vercel.com/docs |

---

*Document prepared for Claude Code execution. Source dataset: `989-25_CX_Imperatives_2026_-_Survey_Data_Tables__Topline_.xlsx`*
