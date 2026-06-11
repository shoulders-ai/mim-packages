import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import postcss from 'postcss'

const here = dirname(fileURLToPath(import.meta.url))

function boardStyles() {
  const source = readFileSync(join(here, 'index.html'), 'utf8')
  const style = source.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1]
  if (!style) throw new Error('Missing board style block')
  return postcss.parse(style)
}

function ruleFor(selector) {
  let match = null
  boardStyles().walkRules(rule => {
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

describe('Board UI chrome contracts', () => {
  it('keeps board panning available without showing a horizontal scrollbar', () => {
    const boardRule = ruleFor('.board')
    const scrollbarRule = ruleFor('.board::-webkit-scrollbar')

    expect(declaration(boardRule, 'overflow-x')).toEqual({ value: 'auto', important: false })
    expect(declaration(boardRule, 'scrollbar-width')).toEqual({ value: 'none', important: false })
    expect(declaration(scrollbarRule, 'height')).toEqual({ value: '0', important: false })
  })
})
