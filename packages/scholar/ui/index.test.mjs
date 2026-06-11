import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const here = dirname(fileURLToPath(import.meta.url))

function source() {
  return readFileSync(join(here, 'index.html'), 'utf8')
}

function script() {
  return source().match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ''
}

function styles() {
  const style = source().match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1]
  if (!style) throw new Error('Missing Scholar style block')
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
  if (!match || match.type !== 'decl') throw new Error(`Missing ${property}`)
  return match.value
}

describe('Scholar UI contract', () => {
  it('starts the persisted literature-search job from the package view', () => {
    const js = script()
    expect(js).toContain("runtime.jobs.start('runSearch', inputs)")
    expect(js).not.toContain('openWork: false')
    expect(js).toContain('runtime.secrets.status()')
    expect(js).toContain('depth: selectedDepth()')
    expect(js).not.toContain('max_results_per_source')
  })

  it('starts from a question instead of asking for a search strategy', () => {
    const html = source()
    expect(html).toContain('What are you trying to understand?')
    expect(html).toContain('Focus or exclusions')
    expect(html).toContain('Find Evidence')
    expect(html).toContain('value="quick" checked')
    expect(html).not.toContain('Search Plan')
    expect(html).not.toContain('Inclusion criteria')
    expect(html).not.toContain('value="25"')
  })

  it('keeps source credentials and source toggles in optional settings', () => {
    const html = source()
    expect(html).toContain('Search settings')
    expect(html).toContain('Sources, keys, depth')
    expect(html).toContain('Best available')
    expect(html).toContain('data-secret="openalex_api_key"')
    expect(html).toContain('data-secret="ncbi_api_key"')
    expect(html).toContain('data-secret="semantic_scholar_api_key"')
    expect(html).toContain('value="pubmed"')
    expect(html).toContain('value="europepmc"')
    expect(html).toContain('value="clinicaltrials"')
    expect(html).toContain('value="arxiv"')
  })

  it('presents one primary brief with evidence files tucked behind details', () => {
    const html = source()
    const js = script()
    expect(html).toContain('id="resultBody"')
    expect(html).toContain('Evidence files')
    expect(js).toContain('result.primaryOutput')
    expect(js).toContain('result.evidenceOutputs')
  })

  it('renders recent searches as readable saved-run summaries', () => {
    const html = source()
    const js = script()
    expect(html).toContain('Recent searches')
    expect(html).toContain('class="quiet-button">Refresh')
    expect(js).toContain('runTitle(run, result)')
    expect(js).toContain('runMeta(run, result, flow)')
    expect(js).toContain('runDate(run, result)')
    expect(js).toContain('statusLabel(status)')
    expect(js).not.toContain('completed}</span>')
    expect(js).not.toContain('result.folder || run.runId')
  })

  it('keeps the start view quiet and leaves progress to the run view', () => {
    const html = source()
    const js = script()
    expect(html).toContain('id="sourceSummary"')
    expect(html).not.toContain('Search Progress')
    expect(html).not.toContain('progress-panel')
    expect(html).not.toContain('id="progressBar"')
    expect(html).not.toContain('id="steps"')
    expect(html).not.toContain('id="events"')
    expect(js).not.toContain('stepModel')
    expect(js).not.toContain('setProgress')
    expect(js).not.toMatch(/\bfunction addEvent\b/)
  })

  it('uses a stable calmer layout and no pointer cursor CSS', () => {
    expect(declaration(ruleFor('.layout'), 'grid-template-columns')).toBe('minmax(360px, 0.86fr) minmax(420px, 1.14fr)')
    expect(declaration(ruleFor('.preset-row'), 'grid-template-columns')).toBe('1fr')
    expect(declaration(ruleFor('.source-grid'), 'grid-template-columns')).toBe('1fr')
    expect(declaration(ruleFor('.settings-grid'), 'grid-template-columns')).toBe('1fr')
    expect(declaration(ruleFor('.toggle-row'), 'grid-template-columns')).toBe('1fr')
    expect(declaration(ruleFor('.key-row'), 'grid-template-columns')).toBe('1fr')
    expect(declaration(ruleFor('.topbar'), 'min-height')).toBe('38px')
    expect(declaration(ruleFor('.source-summary'), 'white-space')).toBe('nowrap')
    expect(declaration(ruleFor('.advanced summary'), 'min-height')).toBe('48px')
    expect(declaration(ruleFor('.history-panel'), 'padding')).toBe('0')
    expect(declaration(ruleFor('.run-row'), 'min-height')).toBe('64px')
    expect(source()).not.toContain('cursor: pointer')
  })
})
