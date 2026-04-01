/**
 * CX Imperatives 2026 – Chart Renderers
 * Builds ECharts option objects for all chart types
 */

'use strict';

window.CX = window.CX || {};

window.CX.Charts = (() => {

  const { CHART_PALETTE, BRAND_COLORS } = window.CX.CONFIG;
  const { fmt, fmtAxis, buildMatrix, sortResponses } = window.CX.DataUtils;

  // -------------------------------------------------------------------------
  // Shared helpers
  // -------------------------------------------------------------------------

  /** Truncate a string to max N chars with ellipsis */
  const trunc = (str, max = 40) => {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  };

  /** Build a rich tooltip formatter for percentage data */
  const pctTooltipFormatter = (params) => {
    if (!Array.isArray(params)) params = [params];
    const lines = params.map(p => {
      const val = typeof p.value === 'number' ? p.value : (Array.isArray(p.value) ? p.value[1] : null);
      const pctStr = val != null ? fmt(val) : '–';
      const dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
      return `${dot}<span style="color:rgba(255,255,255,0.7)">${trunc(p.seriesName || p.name, 35)}</span> <strong style="color:white;margin-left:4px">${pctStr}</strong>`;
    });
    const title = params[0]?.axisValue ? `<div style="color:rgba(255,255,255,0.55);font-size:11px;margin-bottom:6px">${trunc(params[0].axisValue, 50)}</div>` : '';
    return `<div style="font-size:12px;padding:2px 0">${title}${lines.join('<br/>')}</div>`;
  };

  // -------------------------------------------------------------------------
  // Horizontal Bar Chart
  // -------------------------------------------------------------------------

  const buildBarOption = (resolved, visibleCols, sortMode, questionText) => {
    const sortedResponses = sortResponses(resolved.responses, sortMode);
    const { labels, columns, matrix } = buildMatrix(
      { ...resolved, responses: sortedResponses },
      visibleCols
    );

    const isTopline = resolved.type === 'topline';
    const maxVal = Math.max(
      ...matrix.flat().filter(v => v != null)
    );

    // For topline: single series, show NET values
    if (isTopline) {
      const values = matrix.map(row => row[0]);
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const p = params[0];
            return `<div style="font-size:12px"><div style="color:rgba(255,255,255,0.55);font-size:11px;margin-bottom:4px">${trunc(p.name, 50)}</div><strong style="color:white">${fmt(p.value)}</strong></div>`;
          },
        },
        grid: { left: 16, right: 80, top: 16, bottom: 16, containLabel: true },
        xAxis: {
          type: 'value',
          max: Math.ceil(maxVal * 10) / 10,
          axisLabel: {
            formatter: (v) => fmtAxis(v),
            color: BRAND_COLORS.textMuted,
            fontSize: 11,
          },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        },
        yAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            color: BRAND_COLORS.text,
            fontSize: 12,
            width: 220,
            overflow: 'break',
            formatter: (v) => trunc(v, 48),
          },
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisTick: { show: false },
        },
        series: [{
          type: 'bar',
          data: values,
          barMaxWidth: 28,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params) => {
              const v = params.value;
              if (v >= 0.8) return BRAND_COLORS.primary;
              if (v >= 0.5) return BRAND_COLORS.teal;
              return BRAND_COLORS.teal + 'CC';
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: (p) => fmt(p.value),
            color: BRAND_COLORS.textMuted,
            fontSize: 11,
            fontWeight: '600',
          },
        }],
      };
    }

    // Cross-tab: grouped series per column
    const series = columns.map((col, ci) => ({
      name: col,
      type: 'bar',
      data: matrix.map(row => row[ci]),
      barMaxWidth: columns.length <= 3 ? 32 : columns.length <= 6 ? 22 : 14,
      itemStyle: { borderRadius: [0, 3, 3, 0], color: CHART_PALETTE[ci % CHART_PALETTE.length] },
      emphasis: { focus: 'series' },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: pctTooltipFormatter,
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        left: 'center',
        textStyle: { fontSize: 11, color: BRAND_COLORS.textMuted },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 16, right: 24, top: 16, bottom: 60, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v) => fmtAxis(v),
          color: BRAND_COLORS.textMuted,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: BRAND_COLORS.text,
          fontSize: 11,
          width: 200,
          overflow: 'break',
          formatter: (v) => trunc(v, 44),
        },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
      },
      series,
    };
  };

  // -------------------------------------------------------------------------
  // Vertical Bar Chart
  // -------------------------------------------------------------------------

  const buildVBarOption = (resolved, visibleCols, sortMode) => {
    const sortedResponses = sortResponses(resolved.responses, sortMode);
    const { labels, columns, matrix } = buildMatrix(
      { ...resolved, responses: sortedResponses },
      visibleCols
    );
    const isTopline = resolved.type === 'topline';

    if (isTopline) {
      const values = matrix.map(row => row[0]);
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const p = params[0];
            return `<div style="font-size:12px"><div style="color:rgba(255,255,255,0.55);font-size:11px;margin-bottom:4px">${trunc(p.name, 40)}</div><strong style="color:white">${fmt(p.value)}</strong></div>`;
          },
        },
        grid: { left: 24, right: 24, top: 24, bottom: 80, containLabel: true },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            color: BRAND_COLORS.text,
            fontSize: 11,
            rotate: labels.length > 6 ? 35 : 0,
            formatter: (v) => trunc(v, 20),
            interval: 0,
          },
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (v) => fmtAxis(v),
            color: BRAND_COLORS.textMuted,
            fontSize: 11,
          },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        },
        series: [{
          type: 'bar',
          data: values,
          barMaxWidth: 48,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params) => CHART_PALETTE[params.dataIndex % CHART_PALETTE.length],
          },
          label: {
            show: true,
            position: 'top',
            formatter: (p) => fmt(p.value),
            color: BRAND_COLORS.textMuted,
            fontSize: 11,
            fontWeight: '600',
          },
        }],
      };
    }

    // Cross-tab vertical grouped
    const series = columns.map((col, ci) => ({
      name: col,
      type: 'bar',
      data: matrix.map(row => row[ci]),
      barMaxWidth: columns.length <= 3 ? 40 : columns.length <= 6 ? 28 : 18,
      itemStyle: {
        borderRadius: [3, 3, 0, 0],
        color: CHART_PALETTE[ci % CHART_PALETTE.length],
      },
      emphasis: { focus: 'series' },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: pctTooltipFormatter,
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 11, color: BRAND_COLORS.textMuted },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 24, right: 24, top: 24, bottom: 72, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: BRAND_COLORS.text,
          fontSize: 11,
          rotate: labels.length > 4 ? 30 : 0,
          formatter: (v) => trunc(v, 18),
          interval: 0,
        },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v) => fmtAxis(v),
          color: BRAND_COLORS.textMuted,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
      series,
    };
  };

  // -------------------------------------------------------------------------
  // Radar Chart
  // -------------------------------------------------------------------------

  const buildRadarOption = (resolved, visibleCols, sortMode) => {
    const { RADAR_MAX_INDICATORS, RADAR_MAX_SERIES } = window.CX.CONFIG;
    const isTopline = resolved.type === 'topline';

    const sortedResponses = sortResponses(resolved.responses, sortMode);

    if (isTopline) {
      // Topline radar: responses are indicators, single series
      const items = sortedResponses.slice(0, RADAR_MAX_INDICATORS);
      const indicators = items.map(r => ({
        name: trunc(r.label, 30),
        max: 1,
      }));
      const values = items.map(r => r.values?.NET ?? 0);

      return {
        tooltip: {
          trigger: 'item',
          formatter: (p) => {
            const lines = p.value.map((v, i) => {
              return `<span style="color:rgba(255,255,255,0.6);font-size:11px">${trunc(items[i]?.label, 35)}</span><br/><strong style="color:white">${fmt(v)}</strong>`;
            });
            return lines.join('<br/>');
          },
        },
        radar: {
          indicator: indicators,
          radius: '68%',
          shape: 'polygon',
          axisName: { color: BRAND_COLORS.textMuted, fontSize: 11 },
          splitLine: { lineStyle: { color: '#E2E8F0' } },
          splitArea: { areaStyle: { color: ['#F8FAFC', '#FFFFFF'] } },
        },
        series: [{
          type: 'radar',
          data: [{ value: values, name: 'Topline %', areaStyle: { opacity: 0.25 } }],
          lineStyle: { width: 2, color: BRAND_COLORS.teal },
          itemStyle: { color: BRAND_COLORS.teal },
          symbol: 'circle',
          symbolSize: 5,
        }],
      };
    }

    // Cross-tab radar: columns are series, responses (limited) are indicators
    const { columns, matrix, labels } = buildMatrix(
      { ...resolved, responses: sortedResponses },
      visibleCols
    );

    const indicatorItems = labels.slice(0, RADAR_MAX_INDICATORS);
    const indicators = indicatorItems.map(l => ({
      name: trunc(l, 28),
      max: 1,
    }));

    const seriesCols = columns.slice(0, RADAR_MAX_SERIES);

    const seriesData = seriesCols.map((col, ci) => {
      const values = indicatorItems.map((_, ri) => matrix[ri]?.[ci] ?? 0);
      return {
        value: values,
        name: col,
        areaStyle: { opacity: 0.08 },
        lineStyle: { width: 1.5, color: CHART_PALETTE[ci % CHART_PALETTE.length] },
        itemStyle: { color: CHART_PALETTE[ci % CHART_PALETTE.length] },
        symbol: 'circle',
        symbolSize: 4,
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const lines = p.value.map((v, i) => {
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
            return `${dot}<span style="color:rgba(255,255,255,0.6);font-size:11px">${trunc(indicatorItems[i] || '', 35)}</span> <strong style="color:white">${fmt(v)}</strong>`;
          });
          return `<div style="font-size:12px"><strong style="color:white">${p.name}</strong><br/>${lines.join('<br/>')}</div>`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 11, color: BRAND_COLORS.textMuted },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
      },
      radar: {
        indicator: indicators,
        radius: '62%',
        center: ['50%', '48%'],
        shape: 'polygon',
        axisName: { color: BRAND_COLORS.textMuted, fontSize: 10 },
        splitLine: { lineStyle: { color: '#E2E8F0' } },
        splitArea: { areaStyle: { color: ['#F8FAFC', '#FFFFFF'] } },
      },
      series: [{
        type: 'radar',
        data: seriesData,
      }],
    };
  };

  // -------------------------------------------------------------------------
  // Heatmap Chart
  // -------------------------------------------------------------------------

  const buildHeatmapOption = (resolved, visibleCols, sortMode) => {
    const sortedResponses = sortResponses(resolved.responses, sortMode);
    const { labels, columns, matrix } = buildMatrix(
      { ...resolved, responses: sortedResponses },
      visibleCols
    );

    // Build flat data: [colIndex, rowIndex, value]
    const data = [];
    matrix.forEach((row, ri) => {
      row.forEach((val, ci) => {
        if (val != null) data.push([ci, ri, val]);
      });
    });

    const allVals = data.map(d => d[2]).filter(v => v != null);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    return {
      tooltip: {
        position: 'top',
        formatter: (p) => {
          const colLabel = columns[p.data[0]] ?? '';
          const rowLabel = labels[p.data[1]] ?? '';
          const val = p.data[2];
          return `<div style="font-size:12px">
            <div style="color:rgba(255,255,255,0.55);font-size:11px">${trunc(colLabel, 30)}</div>
            <div style="color:rgba(255,255,255,0.7);font-size:11px;margin:2px 0 6px">${trunc(rowLabel, 45)}</div>
            <strong style="color:white;font-size:14px">${fmt(val)}</strong>
          </div>`;
        },
      },
      grid: {
        left: 20,
        right: 20,
        bottom: 60,
        top: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: columns,
        splitArea: { show: true },
        axisLabel: {
          color: BRAND_COLORS.text,
          fontSize: 11,
          rotate: columns.length > 6 ? 35 : 0,
          formatter: (v) => trunc(v, 18),
          interval: 0,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        splitArea: { show: true },
        inverse: true,
        axisLabel: {
          color: BRAND_COLORS.text,
          fontSize: 11,
          width: 200,
          overflow: 'break',
          formatter: (v) => trunc(v, 40),
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#F0FDFD', '#A7F3F3', '#3ECAC8', '#2AB0AE', '#1A8B89', '#003057'],
        },
        textStyle: { fontSize: 11, color: BRAND_COLORS.textMuted },
        formatter: (v) => fmt(v),
        itemWidth: 12,
        itemHeight: 100,
      },
      series: [{
        type: 'heatmap',
        data,
        label: {
          show: columns.length <= 12 && labels.length <= 20,
          formatter: (p) => fmt(p.data[2], 0),
          fontSize: 10,
          color: (params) => {
            const v = params.data[2];
            return v > 0.55 ? '#ffffff' : '#003057';
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
        },
      }],
    };
  };

  // -------------------------------------------------------------------------
  // Pie / Donut Chart
  // -------------------------------------------------------------------------

  const buildPieOption = (resolved, sortMode) => {
    const sortedResponses = sortResponses(resolved.responses, sortMode);

    const data = sortedResponses.map((r, i) => ({
      name: r.label,
      value: r.values?.NET ?? 0,
      itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length] },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          return `<div style="font-size:12px">
            <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:4px">${trunc(p.name, 45)}</div>
            <strong style="color:white">${fmt(p.value)}</strong>
          </div>`;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 8,
        top: 'middle',
        textStyle: { fontSize: 11, color: BRAND_COLORS.textMuted },
        formatter: (name) => trunc(name, 28),
        icon: 'roundRect',
      },
      series: [{
        type: 'pie',
        radius: ['38%', '68%'],
        center: ['42%', '50%'],
        data,
        label: {
          show: true,
          formatter: (p) => p.percent > 5 ? `${p.percent.toFixed(1)}%` : '',
          fontSize: 11,
          color: BRAND_COLORS.textMuted,
        },
        labelLine: { show: true, length: 8, length2: 12 },
        itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)',
          },
          scale: true,
          scaleSize: 5,
        },
      }],
    };
  };

  // -------------------------------------------------------------------------
  // HTML Data Table
  // -------------------------------------------------------------------------

  const buildDataTable = (resolved, visibleCols, sortMode) => {
    const sortedResponses = sortResponses(resolved.responses, sortMode);
    const { labels, columns, matrix } = buildMatrix(
      { ...resolved, responses: sortedResponses },
      visibleCols
    );

    const isTopline = resolved.type === 'topline';

    // Find max per column for heat-tinting
    const colMaxes = columns.map((_, ci) => {
      const vals = matrix.map(row => row[ci]).filter(v => v != null);
      return vals.length > 0 ? Math.max(...vals) : 1;
    });

    let html = '<table class="data-table" role="table"><thead><tr>';
    html += '<th scope="col">Response</th>';
    columns.forEach(col => {
      html += `<th scope="col">${col === 'NET' ? 'NET (All)' : col}</th>`;
    });
    html += '</tr></thead><tbody>';

    labels.forEach((label, ri) => {
      html += '<tr>';
      html += `<td>${label}</td>`;
      matrix[ri].forEach((val, ci) => {
        const pct = val != null ? (val * 100) : null;
        const fmtd = pct != null ? pct.toFixed(1) + '%' : '–';
        // Heat tint: top 20% of column gets highlighted
        const threshold = colMaxes[ci] * 0.8;
        const cls = val != null && val >= threshold ? 'heat-high' : (val != null && val >= colMaxes[ci] * 0.6 ? 'heat-med' : '');
        html += `<td class="${cls}">${fmtd}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  };

  // -------------------------------------------------------------------------
  // Hero chart (donut showing topic distribution)
  // -------------------------------------------------------------------------

  const buildHeroChart = (surveyData) => {
    const sections = surveyData.sections;
    const data = sections.map((s, i) => ({
      name: s.id === 'cx-activities' ? 'CX Activities' :
            s.id === 'personalization' ? 'Personalization' :
            s.id === 'digital-ai' ? 'Digital & AI' : 'Screening',
      value: s.questions.length,
      itemStyle: {
        color: [BRAND_COLORS.teal, BRAND_COLORS.primary, BRAND_COLORS.coral, '#7C3AED'][i],
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1A202C',
        borderWidth: 0,
        textStyle: { color: '#FFFFFF', fontSize: 12 },
        formatter: (p) => `<strong style="color:white">${p.name}</strong><br/><span style="color:rgba(255,255,255,0.7)">${p.value} questions</span>`,
      },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 'middle',
        textStyle: { fontSize: 12, color: BRAND_COLORS.textMuted },
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [{
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['40%', '50%'],
        data,
        label: {
          show: true,
          formatter: (p) => `${p.value}`,
          fontSize: 12,
          fontWeight: '700',
          color: '#FFFFFF',
          position: 'inside',
        },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 5,
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
        },
      }],
    };
  };

  // -------------------------------------------------------------------------
  // Main render function
  // -------------------------------------------------------------------------

  /**
   * Render a chart into the given ECharts instance.
   * @param {object} echartsInstance - the echarts instance
   * @param {string} chartType - 'bar' | 'vbar' | 'radar' | 'heatmap' | 'pie' | 'table'
   * @param {object} resolved - output of DataUtils.resolveQuestionData
   * @param {string[]} visibleCols - which cross-tab columns to show
   * @param {string} sortMode - sort mode string
   * @param {string} questionText - for CSV export context
   * @returns {string|null} HTML string if chartType is 'table', else null
   */
  const render = (echartsInstance, chartType, resolved, visibleCols, sortMode, questionText) => {
    if (chartType === 'table') return null;

    let option;
    switch (chartType) {
      case 'bar':
        option = buildBarOption(resolved, visibleCols, sortMode, questionText);
        break;
      case 'vbar':
        option = buildVBarOption(resolved, visibleCols, sortMode);
        break;
      case 'radar':
        option = buildRadarOption(resolved, visibleCols, sortMode);
        break;
      case 'heatmap':
        option = buildHeatmapOption(resolved, visibleCols, sortMode);
        break;
      case 'pie':
        option = buildPieOption(resolved, sortMode);
        break;
      default:
        option = buildBarOption(resolved, visibleCols, sortMode, questionText);
    }

    echartsInstance.setOption(option, true);
    return null;
  };

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    render,
    buildHeroChart,
    buildDataTable,
  };

})();
