import { describe, expect, it } from 'vitest'
import { escapeAttr, escapeHtml } from './utils.js'

describe('Board UI escaping helpers', () => {
  it('escapes user text before interpolation into innerHTML templates', () => {
    expect(escapeHtml('<button data-action="new-issue">x</button>')).toBe('&lt;button data-action=&quot;new-issue&quot;&gt;x&lt;/button&gt;')
    expect(escapeHtml("Ada's & Bob's")).toBe('Ada&#39;s &amp; Bob&#39;s')
  })

  it('uses the same escaping for quoted attributes', () => {
    expect(escapeAttr('alpha" onfocus="bad')).toBe('alpha&quot; onfocus=&quot;bad')
  })
})
