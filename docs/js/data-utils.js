/**
 * CX Imperatives 2026 – Data Utilities
 * Filtering, sorting, formatting, and data shape helpers
 */

'use strict';

window.CX = window.CX || {};

window.CX.DataUtils = (() => {

  // -------------------------------------------------------------------------
  // Formatting
  // -------------------------------------------------------------------------

  /** Format a 0–1 decimal as a percentage string, e.g. 0.5464 → "54.6%" */
  const fmt = (val, decimals = 1) => {
    if (val == null || isNaN(val)) return '–';
    return (val * 100).toFixed(decimals) + '%';
  };

  /** Format for display in tooltips (always 1 decimal) */
  const fmtTooltip = (val) => fmt(val, 1);

  /** Format for axis labels (0 decimals when ≥ 10%) */
  const fmtAxis = (val) => {
    if (val == null) return '';
    const pct = val * 100;
    return pct >= 10 ? pct.toFixed(0) + '%' : pct.toFixed(1) + '%';
  };

  // -------------------------------------------------------------------------
  // Question helpers
  // -------------------------------------------------------------------------

  /**
   * Resolve the effective question type and data for the current state.
   * For dual_crosstab questions, picks by_category or by_sector based on dimension.
   * For by_sector_multi_activity, picks the selected activity.
   */
  const resolveQuestionData = (question, state) => {
    const { dimension = 'by_category', activityIndex = 0 } = state;

    if (question.type === 'dual_crosstab') {
      const key = dimension === 'by_sector' ? 'bySector' : 'byCategory';
      const data = question[key];
      return {
        type: dimension === 'by_sector' ? 'by_sector' : 'by_category',
        crossTabColumns: data?.crossTabColumns || [],
        responses: data?.responses || [],
        netValues: data?.netValues || {},
        columnN: data?.columnN || {},
      };
    }

    if (question.type === 'by_sector_multi_activity') {
      const activity = question.activities?.[activityIndex] || question.activities?.[0] || {};
      return {
        type: 'by_sector',
        crossTabColumns: question.crossTabColumns || [],
        responses: activity.responses || [],
        netValues: activity.netValues || {},
        columnN: activity.columnN || {},
        activityLabel: activity.activity || '',
      };
    }

    return {
      type: question.type,
      crossTabColumns: question.crossTabColumns || [],
      responses: question.responses || [],
      netValues: question.netValues || {},
      columnN: question.columnN || {},
    };
  };

  /**
   * Filter responses by visible columns.
   * Returns { labels, columns, matrix } where matrix[r][c] is value.
   */
  const buildMatrix = (resolved, visibleCols) => {
    const { responses, crossTabColumns } = resolved;
    const cols = (visibleCols && visibleCols.length > 0)
      ? crossTabColumns.filter(c => visibleCols.includes(c))
      : crossTabColumns;

    const labels = responses.map(r => r.label);
    const matrix = responses.map(r =>
      cols.map(col => {
        const val = r.values?.[col];
        return (val != null && !isNaN(Number(val))) ? Number(val) : null;
      })
    );

    return { labels, columns: cols, matrix };
  };

  /**
   * Sort responses array based on sort mode.
   * sortMode: 'net_desc' | 'net_asc' | 'alpha' | 'original'
   */
  const sortResponses = (responses, sortMode) => {
    if (!responses || !sortMode || sortMode === 'original') return [...responses];

    const sorted = [...responses];
    switch (sortMode) {
      case 'net_desc':
        return sorted.sort((a, b) => {
          const av = a.values?.NET ?? -Infinity;
          const bv = b.values?.NET ?? -Infinity;
          return Number(bv) - Number(av);
        });
      case 'net_asc':
        return sorted.sort((a, b) => {
          const av = a.values?.NET ?? Infinity;
          const bv = b.values?.NET ?? Infinity;
          return Number(av) - Number(bv);
        });
      case 'alpha':
        return sorted.sort((a, b) => a.label.localeCompare(b.label));
      default:
        return sorted;
    }
  };

  // -------------------------------------------------------------------------
  // Default visible columns
  // -------------------------------------------------------------------------

  /**
   * Compute default visible columns for a question.
   * Always include NET + top N by NET value.
   */
  const defaultVisibleCols = (crossTabColumns, responses, maxCols) => {
    const limit = maxCols ?? window.CX.CONFIG.DEFAULT_VISIBLE_COLS;
    if (!crossTabColumns || crossTabColumns.length === 0) return [];

    // Always include NET
    const hasCols = crossTabColumns.filter(c => c !== 'NET');

    // Rank remaining cols by their average value across all responses
    const ranked = hasCols.map(col => {
      const vals = responses
        .map(r => r.values?.[col])
        .filter(v => v != null && !isNaN(Number(v)))
        .map(Number);
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { col, avg };
    });
    ranked.sort((a, b) => b.avg - a.avg);

    const topCols = ranked.slice(0, limit - 1).map(r => r.col);
    const result = crossTabColumns.includes('NET') ? ['NET', ...topCols] : topCols;
    return result;
  };

  // -------------------------------------------------------------------------
  // CSV Export
  // -------------------------------------------------------------------------

  const buildCsv = (resolved, visibleCols, questionText) => {
    const { labels, columns, matrix } = buildMatrix(resolved, visibleCols);
    const header = [questionText ? `"${questionText.replace(/"/g, '""')}"` : 'Response', ...columns].join(',');
    const rows = labels.map((label, r) => {
      const cells = [
        `"${label.replace(/"/g, '""')}"`,
        ...matrix[r].map(v => v != null ? (v * 100).toFixed(2) + '%' : ''),
      ];
      return cells.join(',');
    });
    return [header, ...rows].join('\n');
  };

  const downloadCsv = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------------------
  // Key Insights (for home page)
  // -------------------------------------------------------------------------

  const extractInsights = (surveyData) => {
    const insights = [];

    // Find a few notable stats
    const tryGet = (sectionId, qId, responseLabel) => {
      const section = surveyData.sections.find(s => s.id === sectionId);
      if (!section) return null;
      const q = section.questions.find(q => q.id === qId || q.questionNumber === qId);
      if (!q) return null;
      // Support dual_crosstab (responses nested under byCategory/bySector)
      const responses = q.responses
        || q.byCategory?.responses
        || q.bySector?.responses
        || [];
      const r = responses.find(r =>
        r.label.toLowerCase().includes(responseLabel.toLowerCase())
      );
      return r?.values?.NET ?? null;
    };

    // Q23: tech familiarity (Mobile Apps)
    const mobileApps = tryGet('digital-ai', 'Q23', 'Mobile App');
    if (mobileApps) {
      insights.push({
        pct: mobileApps,
        text: 'are familiar with brand / company mobile apps',
        source: 'Q23 – Technology Familiarity (Topline)',
      });
    }

    // Q17 by_category: people who are okay with data use
    const dataOkay = tryGet('personalization', 'Q17', 'generally okay');
    if (dataOkay) {
      insights.push({
        pct: dataOkay,
        text: 'are generally okay with brands using their data, as long as it is secure',
        source: 'Q17 – Data Personalization Sentiment',
      });
    }

    // Q12 NET: physical store usage
    const storeUsage = tryGet('cx-activities', 'Q12', 'Physical');
    if (storeUsage) {
      insights.push({
        pct: storeUsage,
        text: 'have used a physical store or location when purchasing from a brand',
        source: 'Q12 – Channel Usage (NET)',
      });
    }

    // Q29: AI agent readiness
    const aiAgent = (() => {
      const section = surveyData.sections.find(s => s.id === 'digital-ai');
      if (!section) return null;
      const q = section.questions.find(q => q.questionNumber === 'Q29');
      if (!q) return null;
      const r = (q.responses || []).find(r =>
        r.label.toLowerCase().includes('would use') || r.label.toLowerCase().includes('open to')
      );
      return r?.values?.NET ?? null;
    })();

    if (aiAgent) {
      insights.push({
        pct: aiAgent,
        text: 'are open to using or would use AI agents for customer interactions',
        source: 'Q29 – AI Agent Readiness',
      });
    }

    // Q13: importance of easy / convenient experience
    const easyExp = (() => {
      const section = surveyData.sections.find(s => s.id === 'cx-activities');
      if (!section) return null;
      const q = section.questions.find(q => q.questionNumber === 'Q13');
      if (!q) return null;
      const act = (q.activities || [])[0];
      const r = (act?.responses || []).find(r => r.label.toLowerCase().includes('easy'));
      return r?.values?.NET ?? null;
    })();

    if (easyExp) {
      insights.push({
        pct: easyExp,
        text: 'rate an easy and convenient experience as Very / Extremely Important',
        source: 'Q13 – CX Importance (SHOP activity)',
      });
    }

    return insights.slice(0, 6);
  };

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    fmt,
    fmtTooltip,
    fmtAxis,
    resolveQuestionData,
    buildMatrix,
    sortResponses,
    defaultVisibleCols,
    buildCsv,
    downloadCsv,
    extractInsights,
  };

})();
