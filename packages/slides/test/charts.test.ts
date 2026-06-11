import { describe, expect, it } from 'vitest'

describe('slides charts module', () => {
  async function getBuildChartSvg() {
    const mod = await import('../shared/charts.mjs') as any
    return mod.buildChartSvg as (spec: any) => string
  }

  describe('buildChartSvg', () => {
    it('returns a valid SVG string for bar chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [
          { label: 'Q1', value: 100 },
          { label: 'Q2', value: 200 },
          { label: 'Q3', value: 150 },
        ],
      })
      expect(svg).toMatch(/^<svg\b/)
      expect(svg).toMatch(/<\/svg>$/)
      expect(svg).toContain('viewBox')
      expect(svg).toContain('<rect')
    })

    it('returns a valid SVG for line chart with xy data', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'line',
        data: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 15 },
        ],
      })
      expect(svg).toMatch(/^<svg\b/)
      expect(svg).toContain('<path')
    })

    it('returns a valid SVG for pie chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'pie',
        data: [
          { label: 'A', value: 30 },
          { label: 'B', value: 70 },
        ],
      })
      expect(svg).toMatch(/^<svg\b/)
      expect(svg).toContain('<path')
    })

    it('returns a valid SVG for donut chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'donut',
        data: [
          { label: 'X', value: 50 },
          { label: 'Y', value: 50 },
        ],
      })
      expect(svg).toMatch(/^<svg\b/)
    })

    it('returns a valid SVG for scatter chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'scatter',
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 5, y: 1 },
        ],
      })
      expect(svg).toMatch(/^<svg\b/)
      expect(svg).toContain('<circle')
    })

    it('includes title when provided', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        title: 'Revenue',
        data: [{ label: 'Q1', value: 100 }],
      })
      expect(svg).toContain('Revenue')
    })

    it('respects custom dimensions', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        width: 800,
        height: 500,
        data: [{ label: 'Q1', value: 100 }],
      })
      expect(svg).toContain('viewBox="0 0 800 500"')
    })

    it('shows value labels when showValues is true', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Q1', value: 42 }],
        options: { showValues: true },
      })
      expect(svg).toContain('42')
    })

    it('includes axis labels', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Q1', value: 100 }],
        options: { xLabel: 'Quarter', yLabel: 'Revenue' },
      })
      expect(svg).toContain('Quarter')
      expect(svg).toContain('Revenue')
    })

    it('uses custom colors when provided', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Q1', value: 100 }],
        colors: ['#ff0000'],
      })
      expect(svg).toContain('#ff0000')
    })

    it('handles multi-series bar chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Q1', value: 0 }],
        series: [
          { label: 'Product A', data: [{ label: 'Q1', value: 100 }, { label: 'Q2', value: 200 }] },
          { label: 'Product B', data: [{ label: 'Q1', value: 150 }, { label: 'Q2', value: 120 }] },
        ],
      })
      expect(svg).toContain('Product A')
      expect(svg).toContain('Product B')
    })

    it('handles multi-series line chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'line',
        data: [{ x: 0, y: 0 }],
        series: [
          { label: 'Temp', data: [{ x: 0, y: 20 }, { x: 1, y: 22 }] },
          { label: 'Humidity', data: [{ x: 0, y: 50 }, { x: 1, y: 55 }] },
        ],
      })
      expect(svg).toContain('Temp')
      expect(svg).toContain('Humidity')
    })

    it('produces no JS in the SVG output', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Q1', value: 100 }, { label: 'Q2', value: 200 }],
      })
      expect(svg).not.toContain('<script')
      expect(svg).not.toMatch(/on[a-z]+\s*=/i)
    })

    it('uses zero-baseline for bar charts', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'A', value: 50 }, { label: 'B', value: 100 }],
      })
      // The Y axis should start at 0 (zero baseline)
      expect(svg).toContain('>0<')
    })

    it('escapes HTML entities in labels', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        title: 'R&D <Budget>',
        data: [{ label: 'A&B', value: 100 }],
      })
      expect(svg).toContain('R&amp;D &lt;Budget&gt;')
      expect(svg).toContain('A&amp;B')
    })

    it('throws on unknown chart type', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg({ type: 'radar', data: [] })).toThrow('Unknown chart type')
    })

    it('throws on non-object spec', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg(null)).toThrow('must be an object')
    })

    it('throws on empty data array for bar', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg({ type: 'bar', data: [] })).toThrow('non-empty data array')
    })

    it('throws on non-finite value', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg({
        type: 'bar',
        data: [{ label: 'A', value: NaN }],
      })).toThrow('finite number')
    })

    it('throws on non-finite x/y for scatter', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg({
        type: 'scatter',
        data: [{ x: Infinity, y: 1 }],
      })).toThrow('finite number')
    })

    it('throws on zero-total pie chart', async () => {
      const buildChartSvg = await getBuildChartSvg()
      expect(() => buildChartSvg({
        type: 'pie',
        data: [{ label: 'A', value: 0 }, { label: 'B', value: 0 }],
      })).toThrow('total must be positive')
    })

    it('renders negative bar values below a zero baseline with non-negative rect heights', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'bar',
        data: [{ label: 'Gain', value: 400 }, { label: 'Loss', value: -250 }],
      })
      expect(svg).not.toMatch(/height="-/)
      expect(svg).not.toContain('NaN')
      expect((svg.match(/<rect /g) || []).length).toBe(2)
    })

    it('rejects negative values for pie and donut charts', async () => {
      const buildChartSvg = await getBuildChartSvg()
      for (const type of ['pie', 'donut']) {
        expect(() => buildChartSvg({
          type,
          data: [{ label: 'A', value: 60 }, { label: 'B', value: -20 }],
        })).toThrow('negative')
      }
    })

    it('renders a single pie data point as a visible full circle', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'pie',
        data: [{ label: 'Everything', value: 42 }],
        options: { showValues: true },
      })
      expect(svg).toContain('100.0%')
      expect(svg).not.toContain('NaN')
      // A full slice must not be drawn as a zero-length arc between identical points.
      expect(/<circle\b/.test(svg) || /fill-rule="evenodd"/.test(svg)).toBe(true)
    })

    it('renders a single donut data point as a visible full ring', async () => {
      const buildChartSvg = await getBuildChartSvg()
      const svg = buildChartSvg({
        type: 'donut',
        data: [{ label: 'All', value: 7 }],
      })
      expect(svg).not.toContain('NaN')
      expect(/fill-rule="evenodd"|<circle\b/.test(svg)).toBe(true)
    })
  })
})
