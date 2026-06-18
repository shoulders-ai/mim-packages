import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss, { type Rule } from 'postcss'

const here = dirname(fileURLToPath(import.meta.url))

function slidesSource() {
  return readFileSync(join(here, '../ui/index.html'), 'utf8')
}

function slidesStyles() {
  const source = slidesSource()
  const style = source.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1]
  if (!style) throw new Error('Missing slides style block')
  return postcss.parse(style)
}

function ruleFor(selector: string): Rule {
  let match: Rule | null = null
  slidesStyles().walkRules(rule => {
    if (!match && rule.selector === selector) match = rule
  })
  if (!match) throw new Error(`Missing CSS rule for ${selector}`)
  return match
}

function declaration(rule: Rule, property: string) {
  const match = rule.nodes.find(node => node.type === 'decl' && node.prop === property)
  if (!match || match.type !== 'decl') throw new Error(`Missing ${property} declaration`)
  return { value: match.value, important: Boolean(match.important) }
}

describe('Slides UI chrome contracts', () => {
  it('keeps inactive workflow views hidden despite display utilities', () => {
    expect(declaration(ruleFor('[hidden]'), 'display')).toEqual({ value: 'none', important: true })
  })

  it('has a refine bar with input and button on the result view', () => {
    const html = slidesSource()
    expect(html).toContain('id="refineBar"')
    expect(html).toContain('id="refineInput"')
    expect(html).toContain('id="refineButton"')
    // Refine bar is inside result view
    const resultView = html.slice(html.indexOf('id="resultView"'))
    expect(resultView).toContain('id="refineBar"')
  })

  it('does not keep the retired design review UI path', () => {
    const html = slidesSource()
    expect(html).not.toContain('id="designReview"')
    expect(html).not.toContain('renderDesignReview')
    expect(() => ruleFor('.design-review')).toThrow('Missing CSS rule')
  })

  it('has a usage line on the result view', () => {
    const html = slidesSource()
    expect(html).toContain('id="usageLine"')
    const resultView = html.slice(html.indexOf('id="resultView"'))
    expect(resultView).toContain('id="usageLine"')
  })

  it('has CSS rules for refine bar and usage line', () => {
    const refineBar = ruleFor('.refine-bar')
    expect(declaration(refineBar, 'display').value).toBe('flex')

    const usageLine = ruleFor('.usage-line')
    expect(declaration(usageLine, 'font-size').value).toBe('10px')
  })

  it('has no separate style field; the brief invites style guidance instead', () => {
    const html = slidesSource()
    expect(html).not.toContain('id="style"')
    const briefPlaceholder = html.match(/<textarea id="brief" placeholder="([^"]*)"/)?.[1] || ''
    expect(briefPlaceholder.toLowerCase()).toContain('style')
  })

  it('picks references from the workspace via fs.list instead of free-text paths', () => {
    const html = slidesSource()
    const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ''
    expect(script).toContain("runtime.call('fs.list'")
    expect(html).toContain('id="referencePicker"')
    expect(html).toContain('id="referenceSearch"')
    // Reference rows no longer create an editable path input
    expect(script).not.toContain("path.placeholder = 'reports/q2-review.md'")
  })

  it('has CSS rules for the reference picker list', () => {
    const list = ruleFor('.picker-list')
    expect(declaration(list, 'overflow').value).toBe('auto')
  })

  it('uses an inline deckCapableModels function matching the shared filter', () => {
    const html = slidesSource()
    const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ''
    expect(script).toContain('function deckCapableModels(')
    expect(script).not.toContain("model.provider === 'anthropic'")
    expect(script).not.toContain('model.capabilities?.tools !== false')
    expect(script).toContain('model.capabilities?.text !== false')
  })

  it('escapes job events before inserting them into the progress list', () => {
    const html = slidesSource()
    const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ''
    expect(script).toContain('escapeHtml(event.type')
    expect(script).toContain('escapeHtml(String(body))')
  })
})
