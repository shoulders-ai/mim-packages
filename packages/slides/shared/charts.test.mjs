import { describe, it, expect } from 'vitest'
import { DOMParser } from '@xmldom/xmldom'
import { buildChartSvg } from './charts.mjs'

// ---------- helpers ----------

/** Strict-parse the SVG string; fail the test on any XML warning/error. */
function parseSvg(svg) {
  expect(typeof svg).toBe('string')
  const errors = []
  const onError = (level, message) => errors.push(`${level}: ${message}`)
  const doc = new DOMParser({ onError }).parseFromString(svg, 'text/xml')
  expect(errors).toEqual([])
  const root = doc.documentElement
  expect(root.tagName).toBe('svg')
  // Self-contained: proper namespace, no scripts, no external references.
  expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
  expect(root.getElementsByTagName('script').length).toBe(0)
  expect(svg).not.toMatch(/href|url\(/i)
  return root
}

function els(root, tag) {
  const list = root.getElementsByTagName(tag)
  const out = []
  for (let i = 0; i < list.length; i++) out.push(list.item(i))
  return out
}

function textContents(root) {
  return els(root, 'text').map((t) => t.textContent)
}

// ---------- spec validation ----------

describe('buildChartSvg spec validation', () => {
  it('rejects non-object specs', () => {
    expect(() => buildChartSvg(null)).toThrow(/must be an object/)
    expect(() => buildChartSvg('bar')).toThrow(/must be an object/)
  })

  it('rejects unknown chart types and lists the supported ones', () => {
    expect(() => buildChartSvg({ type: 'radar', data: [{ label: 'a', value: 1 }] }))
      .toThrow(/Unknown chart type "radar".*bar.*line.*pie.*donut.*scatter/)
  })

  it('rejects empty or missing data arrays', () => {
    expect(() => buildChartSvg({ type: 'bar', data: [] })).toThrow(/non-empty data array/)
    expect(() => buildChartSvg({ type: 'pie' })).toThrow(/non-empty data array/)
    expect(() => buildChartSvg({ type: 'line', data: [] })).toThrow(/non-empty data array/)
    expect(() => buildChartSvg({ type: 'scatter' })).toThrow(/non-empty data array/)
  })

  it('rejects non-object and non-finite data points', () => {
    expect(() => buildChartSvg({ type: 'bar', data: [null] })).toThrow(/data\[0\] must be an object/)
    expect(() => buildChartSvg({ type: 'bar', data: [{ label: 'a', value: 'oops' }] }))
      .toThrow(/data\[0\]\.value must be a finite number/)
    expect(() => buildChartSvg({ type: 'bar', data: [{ label: 'a', value: Infinity }] }))
      .toThrow(/finite number/)
    expect(() => buildChartSvg({ type: 'scatter', data: [{ x: 'a', y: 1 }] }))
      .toThrow(/data\[0\]\.x must be a finite number/)
    expect(() => buildChartSvg({ type: 'scatter', data: [{ x: 1, y: NaN }] }))
      .toThrow(/data\[0\]\.y must be a finite number/)
  })

  it('coerces numeric strings and non-string labels', () => {
    const root = parseSvg(buildChartSvg({ type: 'bar', data: [{ label: 2024, value: '20' }] }))
    expect(textContents(root)).toContain('2024')
    const rect = els(root, 'rect')[0]
    expect(Number(rect.getAttribute('height'))).toBeGreaterThan(0)
  })
})

// ---------- SVG envelope ----------

describe('SVG envelope', () => {
  const data = [{ label: 'a', value: 1 }]

  it('defaults to 600x400 with a matching viewBox', () => {
    const root = parseSvg(buildChartSvg({ type: 'bar', data }))
    expect(root.getAttribute('width')).toBe('600')
    expect(root.getAttribute('height')).toBe('400')
    expect(root.getAttribute('viewBox')).toBe('0 0 600 400')
  })

  it('honors custom dimensions and falls back on invalid ones', () => {
    const custom = parseSvg(buildChartSvg({ type: 'bar', data, width: 800, height: 300 }))
    expect(custom.getAttribute('viewBox')).toBe('0 0 800 300')
    const fallback = parseSvg(buildChartSvg({ type: 'bar', data, width: 0, height: 'nope' }))
    expect(fallback.getAttribute('viewBox')).toBe('0 0 600 400')
  })

  it('renders a centered, escaped title that survives XML parsing', () => {
    const title = 'R&D <"Q4"> spend'
    const root = parseSvg(buildChartSvg({ type: 'bar', data, title }))
    const titleEl = els(root, 'text').find((t) => t.textContent === title)
    expect(titleEl).toBeTruthy()
    expect(titleEl.getAttribute('x')).toBe('300')
    expect(titleEl.getAttribute('y')).toBe('24')
    expect(titleEl.getAttribute('text-anchor')).toBe('middle')
  })

  it('escapes data labels so the output stays parseable', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'A&B <tag> "q"', value: 5 }],
    }))
    expect(textContents(root)).toContain('A&B <tag> "q"')
  })
})

// ---------- bar charts ----------

describe('bar chart', () => {
  it('renders one rect per datum on an honest zero baseline (computed geometry)', () => {
    // 600x400, no title: margins l60 r20 t16 b48 -> plot 520x336.
    // niceTicks(0, 20) -> [0, 5, 10, 15, 20]; zero baseline at y=352.
    // barGap = max(4, 520*0.1/2) = 26; barW = (520 - 3*26)/2 = 221.
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'A', value: 10 }, { label: 'B', value: 20 }],
    }))
    const rects = els(root, 'rect')
    expect(rects.length).toBe(2)
    expect(rects[0].getAttribute('x')).toBe('86')
    expect(rects[0].getAttribute('y')).toBe('184.00')
    expect(rects[0].getAttribute('width')).toBe('221')
    expect(rects[0].getAttribute('height')).toBe('168.00')
    expect(rects[1].getAttribute('x')).toBe('333')
    expect(rects[1].getAttribute('y')).toBe('16.00')
    expect(rects[1].getAttribute('height')).toBe('336.00')
    // Axis line sits on the zero baseline.
    const axis = els(root, 'line').find((l) => l.getAttribute('stroke-opacity') === '0.3')
    expect(axis.getAttribute('y1')).toBe('352.00')
    expect(axis.getAttribute('y2')).toBe('352.00')
    // Y tick labels from the nice scale.
    const t = textContents(root)
    for (const label of ['0', '5', '10', '15', '20']) expect(t).toContain(label)
    // X category labels.
    expect(t).toContain('A')
    expect(t).toContain('B')
  })

  it('hangs negative bars below the zero line with positive heights', () => {
    // niceTicks(-10, 20) -> min -10, max 20, step 10; zeroY = 352 - (10/30)*336 = 240.
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'loss', value: -10 }, { label: 'gain', value: 20 }],
    }))
    const rects = els(root, 'rect')
    expect(rects[0].getAttribute('y')).toBe('240.00')
    expect(rects[0].getAttribute('height')).toBe('112.00')
    expect(rects[1].getAttribute('y')).toBe('16.00')
    expect(rects[1].getAttribute('height')).toBe('224.00')
    const axis = els(root, 'line').find((l) => l.getAttribute('stroke-opacity') === '0.3')
    expect(axis.getAttribute('y1')).toBe('240.00')
    // Negative bar starts exactly at the zero baseline.
    expect(rects[0].getAttribute('y')).toBe(axis.getAttribute('y1'))
    const t = textContents(root)
    expect(t).toContain('-10')
  })

  it('handles an all-zero series with zero-height bars on a padded scale', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'a', value: 0 }, { label: 'b', value: 0 }],
    }))
    for (const rect of els(root, 'rect')) {
      expect(rect.getAttribute('height')).toBe('0.00')
      expect(rect.getAttribute('y')).toBe('352.00')
    }
    expect(textContents(root)).toContain('0.2') // niceTicks degenerate 0..1 scale
  })

  it('renders a single bar without errors', () => {
    const root = parseSvg(buildChartSvg({ type: 'bar', data: [{ label: 'only', value: 7 }] }))
    expect(els(root, 'rect').length).toBe(1)
    expect(textContents(root)).toContain('only')
  })

  it('shows value labels above positive bars when showValues is set', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'A', value: 10 }, { label: 'B', value: 20 }],
      options: { showValues: true },
    }))
    // Value labels use font-size 11; axis tick labels use font-size 10.
    const valueLabel = els(root, 'text')
      .find((t) => t.textContent === '10' && t.getAttribute('font-size') === '11')
    expect(valueLabel.getAttribute('y')).toBe('180.00') // bar top 184 minus 4
    expect(textContents(root)).toContain('20')
  })

  it('renders axis labels, rotating the y label', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'a', value: 1 }],
      options: { yLabel: 'Revenue', xLabel: 'Quarter' },
    }))
    const yLabel = els(root, 'text').find((t) => t.textContent === 'Revenue')
    expect(yLabel.getAttribute('transform')).toMatch(/^rotate\(-90,/)
    expect(els(root, 'text').some((t) => t.textContent === 'Quarter')).toBe(true)
  })

  it('shrinks the plot when a title is present', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'A', value: 10 }, { label: 'B', value: 20 }],
      title: 'T',
    }))
    // titleOffset 36 -> plotH 300; max bar height 300 instead of 336.
    const rects = els(root, 'rect')
    expect(rects[1].getAttribute('y')).toBe('52.00')
    expect(rects[1].getAttribute('height')).toBe('300.00')
  })

  it('cycles the default palette and honors custom colors', () => {
    const nine = Array.from({ length: 9 }, (_, i) => ({ label: `l${i}`, value: i + 1 }))
    const root = parseSvg(buildChartSvg({ type: 'bar', data: nine }))
    const fills = els(root, 'rect').map((r) => r.getAttribute('fill'))
    expect(fills[0]).toBe('#2563eb')
    expect(fills[8]).toBe(fills[0]) // palette of 8 wraps around

    const custom = parseSvg(buildChartSvg({
      type: 'bar',
      data: nine.slice(0, 3),
      colors: ['red', 'green'],
    }))
    expect(els(custom, 'rect').map((r) => r.getAttribute('fill'))).toEqual(['red', 'green', 'red'])
  })

  it('truncates long category labels with an ellipsis', () => {
    const long = 'x'.repeat(50)
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: long, value: 1 }, { label: 'b', value: 2 }],
    }))
    const label = els(root, 'text').find((t) => t.textContent.endsWith('…'))
    expect(label).toBeTruthy()
    expect(label.textContent.length).toBeLessThan(long.length)
  })

  it('abbreviates large tick values with K/M suffixes', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      data: [{ label: 'a', value: 2_000_000 }, { label: 'b', value: 500_000 }],
    }))
    const t = textContents(root)
    expect(t).toContain('2.0M')
    expect(t).toContain('500.0K')
  })
})

// ---------- grouped (multi-series) bar ----------

describe('grouped bar chart', () => {
  const series = [
    { label: 'Plan', data: [{ label: 'Q1', value: 10 }, { label: 'Q2', value: 20 }] },
    { label: 'Actual', data: [{ label: 'Q1', value: 15 }, { label: 'Q2', value: 5 }] },
  ]

  it('renders series x groups bars plus one legend swatch per series', () => {
    const root = parseSvg(buildChartSvg({ type: 'bar', series }))
    expect(els(root, 'rect').length).toBe(2 * 2 + 2)
    const t = textContents(root)
    expect(t).toContain('Plan')
    expect(t).toContain('Actual')
    expect(t).toContain('Q1')
    expect(t).toContain('Q2')
  })

  it('works with series only (no top-level data), matching the line-chart contract', () => {
    // Regression: buildBar used to validate spec.data before checking spec.series.
    expect(() => buildChartSvg({ type: 'bar', series })).not.toThrow()
  })

  it('validates series data points', () => {
    expect(() => buildChartSvg({
      type: 'bar',
      series: [{ label: 'S', data: [{ label: 'a', value: 'NaN-ish' }] }],
    })).toThrow(/bar series\[0\] data\[0\]\.value must be a finite number/)
    expect(() => buildChartSvg({ type: 'bar', series: [{ label: 'S', data: [] }] }))
      .toThrow(/non-empty data array/)
  })

  it('falls back to "Series N" legend labels and tolerates numeric category labels', () => {
    const root = parseSvg(buildChartSvg({
      type: 'bar',
      series: [
        { data: [{ label: 2023, value: 1 }] },
        { data: [{ label: 2023, value: 2 }] },
      ],
    }))
    const t = textContents(root)
    expect(t).toContain('Series 1')
    expect(t).toContain('Series 2')
    expect(t).toContain('2023')
  })

  it('treats missing group entries as zero instead of crashing', () => {
    const ragged = [
      { label: 'A', data: [{ label: 'Q1', value: 10 }, { label: 'Q2', value: 20 }] },
      { label: 'B', data: [{ label: 'Q1', value: 5 }] },
    ]
    const root = parseSvg(buildChartSvg({ type: 'bar', series: ragged }))
    expect(els(root, 'rect').length).toBe(4 + 2) // 4 bars (one zero-height) + 2 legend
  })

  it('shares the zero baseline across mixed-sign series', () => {
    const mixed = [
      { label: 'up', data: [{ label: 'g', value: 5 }] },
      { label: 'down', data: [{ label: 'g', value: -5 }] },
    ]
    const root = parseSvg(buildChartSvg({ type: 'bar', series: mixed }))
    const axis = els(root, 'line').find((l) => l.getAttribute('stroke-opacity') === '0.3')
    const zeroY = axis.getAttribute('y1')
    const bars = els(root, 'rect').slice(0, 2)
    const up = bars[0]
    const down = bars[1]
    // Positive bar ends at the baseline; negative bar starts there.
    expect((Number(up.getAttribute('y')) + Number(up.getAttribute('height'))).toFixed(2)).toBe(zeroY)
    expect(down.getAttribute('y')).toBe(zeroY)
    expect(Number(down.getAttribute('height'))).toBeGreaterThan(0)
  })
})

// ---------- line charts ----------

describe('line chart', () => {
  it('plots a single series as one path with computed coordinates', () => {
    // x ticks 0..10 step 2, y ticks 0..100 step 20; plot 520x336 at (60,16).
    const root = parseSvg(buildChartSvg({
      type: 'line',
      data: [{ x: 0, y: 0 }, { x: 5, y: 50 }, { x: 10, y: 100 }],
    }))
    const paths = els(root, 'path')
    expect(paths.length).toBe(1)
    expect(paths[0].getAttribute('d')).toBe('M60.00,352.00 L320.00,184.00 L580.00,16.00')
    expect(paths[0].getAttribute('fill')).toBe('none')
    expect(paths[0].getAttribute('stroke')).toBe('#2563eb')
    const t = textContents(root)
    for (const label of ['0', '2', '4', '6', '8', '10', '20', '40', '60', '80', '100']) {
      expect(t).toContain(label)
    }
  })

  it('renders one path per series with a legend, cycling colors', () => {
    const root = parseSvg(buildChartSvg({
      type: 'line',
      series: [
        { label: 'north', data: [{ x: 0, y: 1 }, { x: 1, y: 2 }] },
        { label: 'south', data: [{ x: 0, y: 2 }, { x: 1, y: 1 }] },
      ],
    }))
    const paths = els(root, 'path')
    expect(paths.length).toBe(2)
    expect(paths[0].getAttribute('stroke')).toBe('#2563eb')
    expect(paths[1].getAttribute('stroke')).toBe('#dc2626')
    const t = textContents(root)
    expect(t).toContain('north')
    expect(t).toContain('south')
  })

  it('omits the legend for a single series', () => {
    const root = parseSvg(buildChartSvg({ type: 'line', data: [{ x: 0, y: 1 }, { x: 1, y: 2 }] }))
    expect(textContents(root)).not.toContain('Series 1')
  })

  it('adds point markers when showValues is set', () => {
    const root = parseSvg(buildChartSvg({
      type: 'line',
      data: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }],
      options: { showValues: true },
    }))
    expect(els(root, 'circle').length).toBe(3)
  })

  it('handles a single point (zero range on both axes)', () => {
    const root = parseSvg(buildChartSvg({ type: 'line', data: [{ x: 5, y: 5 }] }))
    const d = els(root, 'path')[0].getAttribute('d')
    expect(d).toMatch(/^M[\d.]+,[\d.]+$/) // one move, no line segments
  })

  it('handles negative coordinates', () => {
    const root = parseSvg(buildChartSvg({
      type: 'line',
      data: [{ x: -10, y: -5 }, { x: 10, y: 5 }],
    }))
    expect(els(root, 'path').length).toBe(1)
    expect(textContents(root)).toContain('-10')
  })
})

// ---------- pie / donut ----------

describe('pie and donut charts', () => {
  const trio = [
    { label: 'A', value: 1 },
    { label: 'B', value: 1 },
    { label: 'C', value: 2 },
  ]

  it('renders one slice per datum with computed arc geometry', () => {
    // 600x400, no title: center (300,200), radius 160. First slice spans -90deg to 0deg.
    const root = parseSvg(buildChartSvg({ type: 'pie', data: trio }))
    const paths = els(root, 'path')
    expect(paths.length).toBe(3)
    expect(paths[0].getAttribute('d')).toBe('M300,200 L300.00,40.00 A160,160 0 0 1 460.00,200.00 Z')
    expect(paths[0].getAttribute('fill')).toBe('#2563eb')
    expect(paths[1].getAttribute('fill')).toBe('#dc2626')
  })

  it('places labels outside the slices on the mid-angle ray', () => {
    const root = parseSvg(buildChartSvg({ type: 'pie', data: trio }))
    const labelA = els(root, 'text').find((t) => t.textContent === 'A')
    expect(labelA.getAttribute('x')).toBe('424.45') // 300 + 176*cos(-45deg)
    expect(labelA.getAttribute('y')).toBe('75.55')
    expect(labelA.getAttribute('text-anchor')).toBe('start')
    const labelC = els(root, 'text').find((t) => t.textContent === 'C')
    expect(labelC.getAttribute('x')).toBe('124.00') // mid angle 180deg, left of center
    expect(labelC.getAttribute('text-anchor')).toBe('end')
  })

  it('appends percentages to labels when showValues is set', () => {
    const root = parseSvg(buildChartSvg({ type: 'pie', data: trio, options: { showValues: true } }))
    const t = textContents(root)
    expect(t).toContain('A (25.0%)')
    expect(t).toContain('C (50.0%)')
  })

  it('uses the large-arc flag for slices over half the circle', () => {
    const root = parseSvg(buildChartSvg({
      type: 'pie',
      data: [{ label: 'big', value: 3 }, { label: 'small', value: 1 }],
    }))
    const ds = els(root, 'path').map((p) => p.getAttribute('d'))
    expect(ds[0]).toMatch(/A160,160 0 1 1/)
    expect(ds[1]).toMatch(/A160,160 0 0 1/)
  })

  it('draws a full circle for a single datum instead of a degenerate arc', () => {
    const root = parseSvg(buildChartSvg({ type: 'pie', data: [{ label: 'all', value: 5 }] }))
    expect(els(root, 'path').length).toBe(0)
    const circle = els(root, 'circle')[0]
    expect(circle.getAttribute('cx')).toBe('300')
    expect(circle.getAttribute('cy')).toBe('200')
    expect(circle.getAttribute('r')).toBe('160')
  })

  it('draws a full even-odd ring for a single-datum donut', () => {
    const root = parseSvg(buildChartSvg({ type: 'donut', data: [{ label: 'all', value: 5 }] }))
    const path = els(root, 'path')[0]
    expect(path.getAttribute('fill-rule')).toBe('evenodd')
    expect(path.getAttribute('d')).toContain('A88,88') // inner radius 160 * 0.55
    expect(els(root, 'circle').length).toBe(0)
  })

  it('skips zero-value slices but keeps their labels', () => {
    const root = parseSvg(buildChartSvg({
      type: 'pie',
      data: [{ label: 'none', value: 0 }, { label: 'all', value: 5 }],
    }))
    expect(els(root, 'path').length).toBe(0)
    expect(els(root, 'circle').length).toBe(1) // remaining slice is the full circle
    const t = textContents(root)
    expect(t).toContain('none')
    expect(t).toContain('all')
  })

  it('cuts donut slices with outer and inner arcs', () => {
    const root = parseSvg(buildChartSvg({ type: 'donut', data: trio }))
    for (const p of els(root, 'path')) {
      const d = p.getAttribute('d')
      expect(d).toContain('A160,160')
      expect(d).toContain('A88,88')
    }
  })

  it('rejects negative values with guidance toward bar charts', () => {
    expect(() => buildChartSvg({ type: 'pie', data: [{ label: 'a', value: -1 }] }))
      .toThrow(/must not be negative.*bar chart/)
    expect(() => buildChartSvg({ type: 'donut', data: [{ label: 'a', value: -1 }] }))
      .toThrow(/donut chart values must not be negative/)
  })

  it('rejects an all-zero total', () => {
    expect(() => buildChartSvg({
      type: 'pie',
      data: [{ label: 'a', value: 0 }, { label: 'b', value: 0 }],
    })).toThrow(/total must be positive/)
  })
})

// ---------- scatter ----------

describe('scatter chart', () => {
  it('plots one circle per point with computed coordinates', () => {
    const root = parseSvg(buildChartSvg({
      type: 'scatter',
      data: [{ x: 0, y: 0 }, { x: 10, y: 100 }],
    }))
    const circles = els(root, 'circle')
    expect(circles.length).toBe(2)
    expect(circles[0].getAttribute('cx')).toBe('60.00')
    expect(circles[0].getAttribute('cy')).toBe('352.00')
    expect(circles[1].getAttribute('cx')).toBe('580.00')
    expect(circles[1].getAttribute('cy')).toBe('16.00')
    expect(circles[0].getAttribute('r')).toBe('4')
    expect(circles[0].getAttribute('fill')).toBe('#2563eb')
  })

  it('annotates points with (x,y) labels when showValues is set', () => {
    const root = parseSvg(buildChartSvg({
      type: 'scatter',
      data: [{ x: 0, y: 0 }, { x: 10, y: 100 }],
      options: { showValues: true },
    }))
    const t = textContents(root)
    expect(t).toContain('(0,0)')
    expect(t).toContain('(10,100)')
  })

  it('handles a single point and negative ranges', () => {
    const single = parseSvg(buildChartSvg({ type: 'scatter', data: [{ x: 3, y: 3 }] }))
    expect(els(single, 'circle').length).toBe(1)
    const negative = parseSvg(buildChartSvg({
      type: 'scatter',
      data: [{ x: -5, y: -10 }, { x: 5, y: 10 }],
    }))
    expect(els(negative, 'circle').length).toBe(2)
  })

  it('renders axis labels when provided', () => {
    const root = parseSvg(buildChartSvg({
      type: 'scatter',
      data: [{ x: 1, y: 2 }],
      options: { xLabel: 'dose', yLabel: 'response' },
    }))
    const t = textContents(root)
    expect(t).toContain('dose')
    expect(t).toContain('response')
  })
})

// ---------- cross-cutting determinism ----------

describe('determinism', () => {
  it('produces byte-identical output for identical specs', () => {
    const spec = {
      type: 'line',
      title: 'Trend',
      data: [{ x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 5 }],
      options: { showValues: true, yLabel: 'y', xLabel: 'x' },
    }
    expect(buildChartSvg(spec)).toBe(buildChartSvg(structuredClone(spec)))
  })

  it('every chart type yields parseable, namespaced, script-free SVG', () => {
    const lv = [{ label: 'a', value: 1 }, { label: 'b', value: 2 }]
    const xy = [{ x: 0, y: 1 }, { x: 1, y: 3 }]
    parseSvg(buildChartSvg({ type: 'bar', data: lv, title: 't' }))
    parseSvg(buildChartSvg({ type: 'pie', data: lv, title: 't' }))
    parseSvg(buildChartSvg({ type: 'donut', data: lv, title: 't' }))
    parseSvg(buildChartSvg({ type: 'line', data: xy, title: 't' }))
    parseSvg(buildChartSvg({ type: 'scatter', data: xy, title: 't' }))
  })
})
