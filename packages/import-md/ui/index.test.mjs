import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import postcss from 'postcss'

const here = dirname(fileURLToPath(import.meta.url))

function source() {
  return readFileSync(join(here, 'index.html'), 'utf8')
}

function script() {
  return source().match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? ''
}

function styles() {
  const style = source().match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1]
  if (!style) throw new Error('Missing import-md style block')
  return postcss.parse(style)
}

function ruleFor(selector) {
  let match = null
  styles().walkRules(rule => {
    if (!match && rule.selector === selector) match = rule
  })
  if (!match) throw new Error(`Missing CSS rule for ${selector}`)
  return match
}

function declaration(rule, property) {
  const match = rule.nodes.find(node => node.type === 'decl' && node.prop === property)
  if (!match || match.type !== 'decl') throw new Error(`Missing ${property} declaration`)
  return { value: match.value, important: Boolean(match.important) }
}

describe('Import Markdown UI contract', () => {
  it('starts normal package runs so each import opens an Activity instance', () => {
    const js = script()
    expect(js).toContain("runtime.jobs.start('importMarkdown', params)")
    expect(js).not.toContain('openWork: false')
    expect(js).toContain('resetLauncher()')
  })

  it('keeps the launcher compact instead of rendering file-format cards', () => {
    const html = source()
    expect(html).not.toContain('format-strip')
    expect(html).not.toContain('class="format"')
    expect(html).toContain('id="recent"')
  })

  it('uses a two-pane launcher and activity layout', () => {
    expect(declaration(ruleFor('.layout'), 'grid-template-columns').value)
      .toBe('minmax(420px, 1fr) minmax(320px, 390px)')
    expect(declaration(ruleFor('.activity-row'), 'grid-template-columns').value)
      .toBe('minmax(0, 1fr) auto')
  })
})
