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
  if (!style) throw new Error('Missing references style block')
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
  return match.value
}

describe('References UI contract', () => {
  it('uses package jobs for DOI, PDF, and paste capture', () => {
    const js = script()
    expect(js).toContain("runtime.jobs.start('captureDoi'")
    expect(js).toContain("runtime.jobs.start('capturePdf'")
    expect(js).toContain("runtime.jobs.start('capturePaste'")
    expect(js).toContain("runtime.call('fs.writeBytes'")
  })

  it('keeps a dense two-pane work layout', () => {
    expect(declaration(ruleFor('.shell'), 'grid-template-columns'))
      .toBe('minmax(390px, 1fr) minmax(320px, 420px)')
    expect(declaration(ruleFor('.field'), 'grid-template-columns'))
      .toBe('92px minmax(0, 1fr)')
  })

  it('exposes managed/external mode and import controls without a landing page', () => {
    const html = source()
    expect(html).toContain('id="managedMode"')
    expect(html).toContain('id="externalMode"')
    expect(html).toContain('id="importBtn"')
    expect(html).not.toContain('hero')
  })
})
