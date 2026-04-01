/**
 * CX Imperatives 2026 – App Configuration
 * ECharts theme, color palette, and global constants
 */

'use strict';

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

const BRAND_COLORS = {
  primary:      '#003057',
  primaryDark:  '#001e3a',
  primaryLight: '#1a4975',
  teal:         '#3ECAC8',
  tealDark:     '#2ab0ae',
  tealLight:    '#e0f7f7',
  coral:        '#FF5C39',
  gold:         '#F7A800',
  bg:           '#F4F6FA',
  surface:      '#FFFFFF',
  border:       '#E2E8F0',
  text:         '#1A202C',
  textMuted:    '#64748B',
  textLight:    '#94A3B8',
};

// 12-color accessible series palette
const CHART_PALETTE = [
  '#3ECAC8', // teal
  '#003057', // navy
  '#FF5C39', // coral
  '#F7A800', // gold
  '#7C3AED', // purple
  '#059669', // green
  '#0EA5E9', // sky blue
  '#D97706', // amber
  '#4F46E5', // indigo
  '#BE185D', // pink
  '#065F46', // dark green
  '#DC2626', // red
  '#0891B2', // cyan
  '#9333EA', // violet
  '#CA8A04', // yellow
  '#16A34A', // lime green
  '#E11D48', // rose
  '#7E22CE', // deep purple
  '#0F766E', // dark teal
];

// ---------------------------------------------------------------------------
// ECharts Theme
// ---------------------------------------------------------------------------

const ECHARTS_THEME = {
  color: CHART_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#1A202C',
  },
  title: {
    textStyle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#003057',
    },
    subtextStyle: {
      fontSize: 12,
      color: '#64748B',
    },
  },
  tooltip: {
    backgroundColor: '#1A202C',
    borderWidth: 0,
    borderRadius: 8,
    textStyle: {
      color: '#FFFFFF',
      fontSize: 12,
    },
    extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.2); padding: 8px 12px;',
  },
  legend: {
    textStyle: {
      fontSize: 12,
      color: '#64748B',
    },
    itemGap: 12,
    icon: 'roundRect',
  },
  grid: {
    containLabel: true,
    left: 16,
    right: 24,
    top: 60,
    bottom: 24,
  },
  axisLabel: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  axisTick: { lineStyle: { color: '#E2E8F0' } },
  axisLine: { lineStyle: { color: '#CBD5E1' } },
  splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
  radar: {
    axisName: { color: '#64748B', fontSize: 11 },
    axisLine: { lineStyle: { color: '#E2E8F0' } },
    splitLine: { lineStyle: { color: '#E2E8F0' } },
    splitArea: {
      areaStyle: {
        color: ['rgba(255,255,255,0.3)', 'rgba(244,246,250,0.3)'],
      },
    },
  },
};

// Register the theme
if (typeof echarts !== 'undefined') {
  echarts.registerTheme('merkle', ECHARTS_THEME);
}

// ---------------------------------------------------------------------------
// Section Metadata
// ---------------------------------------------------------------------------

const SECTION_META = {
  'screening': {
    title: 'Screening & Classification',
    shortTitle: 'Screening',
    description: 'Respondent demographics and brand category assignments',
    color: '#3ECAC8',
  },
  'cx-activities': {
    title: 'CX Activities & Expectations',
    shortTitle: 'CX Activities',
    description: 'Channel usage and experience quality by brand sector',
    color: '#003057',
  },
  'personalization': {
    title: 'Personalization & High-Touch CX',
    shortTitle: 'Personalization',
    description: 'Personalization preferences and data sentiment',
    color: '#FF5C39',
  },
  'digital-ai': {
    title: 'Digital Experiences & AI',
    shortTitle: 'Digital & AI',
    description: 'AI familiarity, chatbots, agents, and future CX',
    color: '#7C3AED',
  },
};

// ---------------------------------------------------------------------------
// Question Type Labels
// ---------------------------------------------------------------------------

const TYPE_LABELS = {
  topline: 'Topline',
  by_category: 'By Category',
  by_sector: 'By Sector',
  dual_crosstab: 'By Category & Sector',
  by_sector_multi_activity: 'By Sector × Activity',
};

// ---------------------------------------------------------------------------
// Chart Type Config
// ---------------------------------------------------------------------------

const CHART_TYPES = {
  bar:      { label: 'Horizontal Bar', icon: 'bar' },
  vbar:     { label: 'Vertical Bar',   icon: 'vbar' },
  radar:    { label: 'Radar',          icon: 'radar' },
  heatmap:  { label: 'Heatmap',        icon: 'heatmap' },
  pie:      { label: 'Pie / Donut',    icon: 'pie' },
  table:    { label: 'Data Table',     icon: 'table' },
};

// Chart types available per question type
const CHART_TYPES_FOR = {
  topline:                    ['bar', 'vbar', 'pie', 'table'],
  by_category:                ['bar', 'vbar', 'heatmap', 'radar', 'table'],
  by_sector:                  ['bar', 'vbar', 'heatmap', 'radar', 'table'],
  dual_crosstab:              ['bar', 'vbar', 'heatmap', 'radar', 'table'],
  by_sector_multi_activity:   ['bar', 'vbar', 'heatmap', 'radar', 'table'],
};

// Default chart type per question type
const DEFAULT_CHART_FOR = {
  topline:                  'bar',
  by_category:              'bar',
  by_sector:                'bar',
  dual_crosstab:            'bar',
  by_sector_multi_activity: 'heatmap',
};

// Max items to show in radar without crowding
const RADAR_MAX_INDICATORS = 10;
const RADAR_MAX_SERIES = 8;

// Default number of columns to show for cross-tab charts
const DEFAULT_VISIBLE_COLS = 6;

// ---------------------------------------------------------------------------
// Exports (global namespace for plain-JS modules)
// ---------------------------------------------------------------------------

window.CX = window.CX || {};
window.CX.CONFIG = {
  BRAND_COLORS,
  CHART_PALETTE,
  ECHARTS_THEME,
  SECTION_META,
  TYPE_LABELS,
  CHART_TYPES,
  CHART_TYPES_FOR,
  DEFAULT_CHART_FOR,
  RADAR_MAX_INDICATORS,
  RADAR_MAX_SERIES,
  DEFAULT_VISIBLE_COLS,
};
