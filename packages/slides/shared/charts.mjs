/**
 * Deterministic chart SVG builder for Mim slide decks.
 * Pure function, no dependencies, no JS in output SVG.
 * @param {Object} spec
 * @returns {string} self-contained inline <svg> string
 */

const CHART_TYPES = new Set(['bar', 'line', 'pie', 'donut', 'scatter'])

const DEFAULT_PALETTE = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
  '#db2777', // pink-600
  '#65a30d', // lime-600
]

export function buildChartSvg(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('Chart spec must be an object')
  if (!CHART_TYPES.has(spec.type)) {
    throw new Error(`Unknown chart type "${spec.type}". Must be one of: ${[...CHART_TYPES].join(', ')}`)
  }
  const width = Number(spec.width) || 600
  const height = Number(spec.height) || 400
  const colors = Array.isArray(spec.colors) && spec.colors.length > 0 ? spec.colors : DEFAULT_PALETTE
  const options = spec.options && typeof spec.options === 'object' ? spec.options : {}
  const title = typeof spec.title === 'string' ? spec.title.trim() : ''

  switch (spec.type) {
    case 'bar': return buildBar(spec, width, height, colors, options, title)
    case 'line': return buildLine(spec, width, height, colors, options, title)
    case 'pie': return buildPie(spec, width, height, colors, options, title, false)
    case 'donut': return buildPie(spec, width, height, colors, options, title, true)
    case 'scatter': return buildScatter(spec, width, height, colors, options, title)
    default: throw new Error(`Unhandled chart type: ${spec.type}`)
  }
}

// ---------- Nice tick rounding ----------

function niceNum(value, round) {
  const exp = Math.floor(Math.log10(Math.abs(value) || 1))
  const frac = value / Math.pow(10, exp)
  let nice
  if (round) {
    if (frac < 1.5) nice = 1
    else if (frac < 3) nice = 2
    else if (frac < 7) nice = 5
    else nice = 10
  } else {
    if (frac <= 1) nice = 1
    else if (frac <= 2) nice = 2
    else if (frac <= 5) nice = 5
    else nice = 10
  }
  return nice * Math.pow(10, exp)
}

function niceTicks(min, max, targetCount = 5) {
  if (min === max) {
    if (min === 0) return { min: 0, max: 1, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    const pad = Math.abs(min) * 0.1 || 1
    min -= pad
    max += pad
  }
  const range = niceNum(max - min, false)
  const step = niceNum(range / (targetCount - 1), true)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks = []
  for (let v = niceMin; v <= niceMax + step * 0.01; v += step) {
    ticks.push(parseFloat(v.toPrecision(12)))
  }
  return { min: niceMin, max: niceMax, step, ticks }
}

function formatTickValue(v) {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e4) return `${(v / 1e3).toFixed(1)}K`
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(1)
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ---------- Shared SVG wrapper ----------

function svgWrap(width, height, title, body) {
  const titleEl = title
    ? `<text x="${width / 2}" y="24" text-anchor="middle" font-size="16" font-weight="600" fill="currentColor">${esc(title)}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="font-family:system-ui,-apple-system,sans-serif">${titleEl}${body}</svg>`
}

// ---------- Bar chart ----------

function buildBar(spec, width, height, colors, options, title) {
  const series = spec.series // multi-series: [{label, data: [{label, value}]}]
  const titleOffset = title ? 36 : 0
  const margin = { top: 16 + titleOffset, right: 20, bottom: 48, left: 60 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const yLabel = options.yLabel || ''
  const xLabel = options.xLabel || ''

  if (series && Array.isArray(series) && series.length > 0) {
    const normalized = series.map((s, i) => ({
      label: typeof s?.label === 'string' ? s.label : '',
      data: validateLabelValueData(s?.data, `bar series[${i}]`),
    }))
    return buildGroupedBar(normalized, width, height, colors, options, title, margin, plotW, plotH, yLabel, xLabel)
  }

  const data = validateLabelValueData(spec.data, 'bar')

  // Honest zero baseline; negative values hang below the zero line.
  const scale = barScale(data.map(d => d.value), plotH, margin.top)
  const yAxis = scale.yAxis
  const barGap = Math.max(4, plotW * 0.1 / data.length)
  const barW = Math.max(8, (plotW - barGap * (data.length + 1)) / data.length)

  let bars = ''
  let xLabels = ''
  for (let i = 0; i < data.length; i++) {
    const x = margin.left + barGap + i * (barW + barGap)
    const { y, barH } = scale.barRect(data[i].value)
    const color = colors[i % colors.length]
    bars += `<rect x="${x}" y="${y.toFixed(2)}" width="${barW}" height="${barH.toFixed(2)}" fill="${esc(color)}" rx="2"/>`
    if (options.showValues) {
      const labelY = data[i].value >= 0 ? y - 4 : y + barH + 12
      bars += `<text x="${x + barW / 2}" y="${labelY.toFixed(2)}" text-anchor="middle" font-size="11" fill="currentColor">${formatTickValue(data[i].value)}</text>`
    }
    xLabels += `<text x="${x + barW / 2}" y="${margin.top + plotH + 16}" text-anchor="middle" font-size="10" fill="currentColor">${esc(truncLabel(data[i].label, barW))}</text>`
  }

  const yGrid = buildYGrid(yAxis, margin, plotW, plotH)
  const axisLine = `<line x1="${margin.left}" y1="${scale.zeroY.toFixed(2)}" x2="${margin.left + plotW}" y2="${scale.zeroY.toFixed(2)}" stroke="currentColor" stroke-opacity="0.3"/>`
  const yLabelEl = yLabel
    ? `<text x="14" y="${margin.top + plotH / 2}" text-anchor="middle" transform="rotate(-90,14,${margin.top + plotH / 2})" font-size="11" fill="currentColor">${esc(yLabel)}</text>`
    : ''
  const xLabelEl = xLabel
    ? `<text x="${margin.left + plotW / 2}" y="${height - 4}" text-anchor="middle" font-size="11" fill="currentColor">${esc(xLabel)}</text>`
    : ''

  return svgWrap(width, height, title, `${yGrid}${axisLine}${bars}${xLabels}${yLabelEl}${xLabelEl}`)
}

function buildGroupedBar(series, width, height, colors, options, title, margin, plotW, plotH, yLabel, xLabel) {
  const labels = series[0].data.map(d => d.label)
  const allValues = series.flatMap(s => s.data.map(d => d.value))
  const scale = barScale(allValues, plotH, margin.top)
  const yAxis = scale.yAxis
  const groupGap = Math.max(8, plotW * 0.15 / labels.length)
  const groupW = (plotW - groupGap * (labels.length + 1)) / labels.length
  const barW = Math.max(4, (groupW - 2 * (series.length - 1)) / series.length)

  let bars = ''
  let xLabels = ''
  for (let g = 0; g < labels.length; g++) {
    const gx = margin.left + groupGap + g * (groupW + groupGap)
    for (let s = 0; s < series.length; s++) {
      const val = series[s].data[g]?.value || 0
      const x = gx + s * (barW + 2)
      const { y, barH } = scale.barRect(val)
      bars += `<rect x="${x}" y="${y.toFixed(2)}" width="${barW}" height="${barH.toFixed(2)}" fill="${esc(colors[s % colors.length])}" rx="2"/>`
      if (options.showValues) {
        const labelY = val >= 0 ? y - 4 : y + barH + 10
        bars += `<text x="${x + barW / 2}" y="${labelY.toFixed(2)}" text-anchor="middle" font-size="9" fill="currentColor">${formatTickValue(val)}</text>`
      }
    }
    xLabels += `<text x="${gx + groupW / 2}" y="${margin.top + plotH + 16}" text-anchor="middle" font-size="10" fill="currentColor">${esc(truncLabel(labels[g], groupW))}</text>`
  }

  // Legend
  let legend = ''
  const legendY = height - 6
  let lx = margin.left
  for (let s = 0; s < series.length; s++) {
    legend += `<rect x="${lx}" y="${legendY - 8}" width="10" height="10" fill="${esc(colors[s % colors.length])}" rx="1"/>`
    legend += `<text x="${lx + 14}" y="${legendY}" font-size="10" fill="currentColor">${esc(series[s].label || `Series ${s + 1}`)}</text>`
    lx += 14 + (series[s].label?.length || 8) * 6 + 12
  }

  const yGrid = buildYGrid(yAxis, margin, plotW, plotH)
  const axisLine = `<line x1="${margin.left}" y1="${scale.zeroY.toFixed(2)}" x2="${margin.left + plotW}" y2="${scale.zeroY.toFixed(2)}" stroke="currentColor" stroke-opacity="0.3"/>`
  const yLabelEl = yLabel
    ? `<text x="14" y="${margin.top + plotH / 2}" text-anchor="middle" transform="rotate(-90,14,${margin.top + plotH / 2})" font-size="11" fill="currentColor">${esc(yLabel)}</text>`
    : ''
  const xLabelEl = xLabel
    ? `<text x="${margin.left + plotW / 2}" y="${height - 18}" text-anchor="middle" font-size="11" fill="currentColor">${esc(xLabel)}</text>`
    : ''

  return svgWrap(width, height, title, `${yGrid}${axisLine}${bars}${xLabels}${legend}${yLabelEl}${xLabelEl}`)
}

// Shared bar geometry: bars rise from (or hang below) an honest zero baseline,
// scaled across the full nice-tick range so negative values never produce a
// negative rect height.
function barScale(values, plotH, marginTop) {
  const yAxis = niceTicks(Math.min(...values, 0), Math.max(...values, 0))
  const span = yAxis.max - yAxis.min || 1
  const yFor = v => marginTop + plotH - ((v - yAxis.min) / span) * plotH
  const zeroY = yFor(0)
  return {
    yAxis,
    zeroY,
    barRect(value) {
      const barH = Math.abs(yFor(value) - zeroY)
      return { y: value >= 0 ? zeroY - barH : zeroY, barH }
    },
  }
}

// ---------- Line chart ----------

function buildLine(spec, width, height, colors, options, title) {
  const series = spec.series // multi-series: [{label, data: [{x, y}]}]
  const singleData = spec.data
  const titleOffset = title ? 36 : 0
  const margin = { top: 16 + titleOffset, right: 20, bottom: 48, left: 60 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const yLabel = options.yLabel || ''
  const xLabel = options.xLabel || ''

  let allSeries
  if (series && Array.isArray(series) && series.length > 0) {
    allSeries = series.map(s => ({
      label: s.label || '',
      data: validateXYData(s.data, 'line series'),
    }))
  } else {
    allSeries = [{ label: '', data: validateXYData(singleData, 'line') }]
  }

  const allPoints = allSeries.flatMap(s => s.data)
  const xVals = allPoints.map(p => p.x)
  const yVals = allPoints.map(p => p.y)
  const xAxis = niceTicks(Math.min(...xVals), Math.max(...xVals))
  const yAxis = niceTicks(Math.min(...yVals), Math.max(...yVals))

  const scaleX = v => margin.left + ((v - xAxis.min) / (xAxis.max - xAxis.min || 1)) * plotW
  const scaleY = v => margin.top + plotH - ((v - yAxis.min) / (yAxis.max - yAxis.min || 1)) * plotH

  let lines = ''
  for (let si = 0; si < allSeries.length; si++) {
    const pts = allSeries[si].data
    const color = colors[si % colors.length]
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x).toFixed(2)},${scaleY(p.y).toFixed(2)}`).join(' ')
    lines += `<path d="${pathD}" fill="none" stroke="${esc(color)}" stroke-width="2" stroke-linejoin="round"/>`
    if (options.showValues) {
      for (const p of pts) {
        lines += `<circle cx="${scaleX(p.x).toFixed(2)}" cy="${scaleY(p.y).toFixed(2)}" r="3" fill="${esc(color)}"/>`
      }
    }
  }

  // X ticks
  let xTicks = ''
  for (const t of xAxis.ticks) {
    const x = scaleX(t)
    xTicks += `<text x="${x.toFixed(2)}" y="${margin.top + plotH + 16}" text-anchor="middle" font-size="10" fill="currentColor">${formatTickValue(t)}</text>`
  }

  const yGrid = buildYGrid(yAxis, margin, plotW, plotH)
  const axisLine = `<line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="currentColor" stroke-opacity="0.3"/>`
  const yLabelEl = yLabel
    ? `<text x="14" y="${margin.top + plotH / 2}" text-anchor="middle" transform="rotate(-90,14,${margin.top + plotH / 2})" font-size="11" fill="currentColor">${esc(yLabel)}</text>`
    : ''
  const xLabelEl = xLabel
    ? `<text x="${margin.left + plotW / 2}" y="${height - 4}" text-anchor="middle" font-size="11" fill="currentColor">${esc(xLabel)}</text>`
    : ''

  // Legend for multi-series
  let legend = ''
  if (allSeries.length > 1) {
    let lx = margin.left
    const ly = height - 6
    for (let s = 0; s < allSeries.length; s++) {
      legend += `<line x1="${lx}" y1="${ly - 4}" x2="${lx + 12}" y2="${ly - 4}" stroke="${esc(colors[s % colors.length])}" stroke-width="2"/>`
      legend += `<text x="${lx + 16}" y="${ly}" font-size="10" fill="currentColor">${esc(allSeries[s].label || `Series ${s + 1}`)}</text>`
      lx += 16 + (allSeries[s].label?.length || 8) * 6 + 12
    }
  }

  return svgWrap(width, height, title, `${yGrid}${axisLine}${lines}${xTicks}${legend}${yLabelEl}${xLabelEl}`)
}

// ---------- Pie / Donut ----------

function buildPie(spec, width, height, colors, options, title, isDonut) {
  const data = validateLabelValueData(spec.data, spec.type)
  if (data.some(d => d.value < 0)) {
    throw new Error(`${spec.type} chart values must not be negative; use a bar chart for gains/losses`)
  }
  const titleOffset = title ? 32 : 0
  const cx = width / 2
  const cy = titleOffset + (height - titleOffset) / 2
  const radius = Math.min(width, height - titleOffset) / 2 - 40
  const innerRadius = isDonut ? radius * 0.55 : 0
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0) throw new Error('Pie/donut chart total must be positive')

  let slices = ''
  let labels = ''
  let startAngle = -Math.PI / 2
  for (let i = 0; i < data.length; i++) {
    const fraction = data[i].value / total
    const angle = fraction * Math.PI * 2
    const endAngle = startAngle + angle
    const largeArc = angle > Math.PI ? 1 : 0
    const color = esc(colors[i % colors.length])

    if (angle >= Math.PI * 2 - 1e-6) {
      // A full slice (single data point, or zero-value siblings): an arc whose
      // start and end coincide has zero length and renders as nothing, so draw
      // a circle (pie) or an even-odd ring (donut) instead.
      slices += isDonut
        ? `<path fill-rule="evenodd" d="M${cx},${(cy - radius).toFixed(2)} A${radius},${radius} 0 1 1 ${cx},${(cy + radius).toFixed(2)} A${radius},${radius} 0 1 1 ${cx},${(cy - radius).toFixed(2)} Z M${cx},${(cy - innerRadius).toFixed(2)} A${innerRadius},${innerRadius} 0 1 0 ${cx},${(cy + innerRadius).toFixed(2)} A${innerRadius},${innerRadius} 0 1 0 ${cx},${(cy - innerRadius).toFixed(2)} Z" fill="${color}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`
    } else if (angle > 1e-9) {
      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)

      let d = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${radius},${radius} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`
      if (isDonut) {
        const ix1 = cx + innerRadius * Math.cos(startAngle)
        const iy1 = cy + innerRadius * Math.sin(startAngle)
        const ix2 = cx + innerRadius * Math.cos(endAngle)
        const iy2 = cy + innerRadius * Math.sin(endAngle)
        d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${radius},${radius} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`
      }
      slices += `<path d="${d}" fill="${color}"/>`
    }

    // Label
    const midAngle = startAngle + angle / 2
    const labelR = radius + 16
    const lx = cx + labelR * Math.cos(midAngle)
    const ly = cy + labelR * Math.sin(midAngle)
    const anchor = lx > cx ? 'start' : 'end'
    const pct = (fraction * 100).toFixed(1)
    const labelText = options.showValues
      ? `${data[i].label} (${pct}%)`
      : data[i].label
    labels += `<text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchor}" font-size="10" fill="currentColor">${esc(labelText)}</text>`

    startAngle = endAngle
  }

  return svgWrap(width, height, title, `${slices}${labels}`)
}

// ---------- Scatter ----------

function buildScatter(spec, width, height, colors, options, title) {
  const data = validateXYData(spec.data, 'scatter')
  const titleOffset = title ? 36 : 0
  const margin = { top: 16 + titleOffset, right: 20, bottom: 48, left: 60 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const yLabel = options.yLabel || ''
  const xLabel = options.xLabel || ''

  const xVals = data.map(p => p.x)
  const yVals = data.map(p => p.y)
  const xAxis = niceTicks(Math.min(...xVals), Math.max(...xVals))
  const yAxis = niceTicks(Math.min(...yVals), Math.max(...yVals))

  const scaleX = v => margin.left + ((v - xAxis.min) / (xAxis.max - xAxis.min || 1)) * plotW
  const scaleY = v => margin.top + plotH - ((v - yAxis.min) / (yAxis.max - yAxis.min || 1)) * plotH

  let dots = ''
  const color = colors[0]
  for (const p of data) {
    dots += `<circle cx="${scaleX(p.x).toFixed(2)}" cy="${scaleY(p.y).toFixed(2)}" r="4" fill="${esc(color)}" fill-opacity="0.7"/>`
    if (options.showValues) {
      dots += `<text x="${(scaleX(p.x) + 6).toFixed(2)}" y="${(scaleY(p.y) - 6).toFixed(2)}" font-size="9" fill="currentColor">(${formatTickValue(p.x)},${formatTickValue(p.y)})</text>`
    }
  }

  // X ticks
  let xTicks = ''
  for (const t of xAxis.ticks) {
    const x = scaleX(t)
    xTicks += `<text x="${x.toFixed(2)}" y="${margin.top + plotH + 16}" text-anchor="middle" font-size="10" fill="currentColor">${formatTickValue(t)}</text>`
  }

  const yGrid = buildYGrid(yAxis, margin, plotW, plotH)
  const axisLine = `<line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="currentColor" stroke-opacity="0.3"/>`
  const yLabelEl = yLabel
    ? `<text x="14" y="${margin.top + plotH / 2}" text-anchor="middle" transform="rotate(-90,14,${margin.top + plotH / 2})" font-size="11" fill="currentColor">${esc(yLabel)}</text>`
    : ''
  const xLabelEl = xLabel
    ? `<text x="${margin.left + plotW / 2}" y="${height - 4}" text-anchor="middle" font-size="11" fill="currentColor">${esc(xLabel)}</text>`
    : ''

  return svgWrap(width, height, title, `${yGrid}${axisLine}${dots}${xTicks}${yLabelEl}${xLabelEl}`)
}

// ---------- Helpers ----------

function buildYGrid(yAxis, margin, plotW, plotH) {
  let grid = ''
  for (const t of yAxis.ticks) {
    const y = margin.top + plotH - ((t - yAxis.min) / (yAxis.max - yAxis.min || 1)) * plotH
    grid += `<line x1="${margin.left}" y1="${y.toFixed(2)}" x2="${margin.left + plotW}" y2="${y.toFixed(2)}" stroke="currentColor" stroke-opacity="0.08"/>`
    grid += `<text x="${margin.left - 6}" y="${(y + 4).toFixed(2)}" text-anchor="end" font-size="10" fill="currentColor">${formatTickValue(t)}</text>`
  }
  return grid
}

function validateLabelValueData(data, chartType) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${chartType} chart requires a non-empty data array of {label, value} objects`)
  }
  return data.map((d, i) => {
    if (!d || typeof d !== 'object') throw new Error(`${chartType} data[${i}] must be an object`)
    const label = typeof d.label === 'string' ? d.label : String(d.label ?? `Item ${i + 1}`)
    const value = Number(d.value)
    if (!Number.isFinite(value)) throw new Error(`${chartType} data[${i}].value must be a finite number`)
    return { label, value }
  })
}

function validateXYData(data, chartType) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${chartType} chart requires a non-empty data array of {x, y} objects`)
  }
  return data.map((d, i) => {
    if (!d || typeof d !== 'object') throw new Error(`${chartType} data[${i}] must be an object`)
    const x = Number(d.x)
    const y = Number(d.y)
    if (!Number.isFinite(x)) throw new Error(`${chartType} data[${i}].x must be a finite number`)
    if (!Number.isFinite(y)) throw new Error(`${chartType} data[${i}].y must be a finite number`)
    return { x, y }
  })
}

function truncLabel(label, maxPx) {
  const maxChars = Math.max(3, Math.floor(maxPx / 6))
  if (label.length <= maxChars) return label
  return `${label.slice(0, maxChars - 1)}…`
}
