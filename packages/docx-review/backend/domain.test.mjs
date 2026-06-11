import { describe, it, expect } from 'vitest'
import {
  docProfileBlock,
  normalizeProfile,
  normalizeStandardId,
  runGatekeeper,
  listGuidanceCategory,
  loadGuidanceChapter,
} from './index.mjs'

// The full set of standard ids the gatekeeper is allowed to emit.
const EMITTABLE_STANDARDS = ['ich-e3', 'consort', 'consort-extensions', 'spirit', 'strobe', 'prisma', 'cheers', 'stard']

function gatekeeperCtx(jsonText) {
  return {
    ai: {
      callModel: async () => ({ text: jsonText, usage: { input: 1, output: 1, cacheRead: 0, cacheCreation: 0 } }),
    },
  }
}

describe('normalizeStandardId', () => {
  it('lowercases and hyphenates', () => {
    expect(normalizeStandardId('ICH_E3')).toBe('ich-e3')
    expect(normalizeStandardId(' Consort ')).toBe('consort')
  })
})

describe('normalizeProfile', () => {
  it('coerces fields and de-dupes/normalizes standards', () => {
    const p = normalizeProfile({
      doc_type: 'csr', is_clinical: true, study_design: 'parallel_rct',
      applicable_standards: ['ich_e3', 'ICH_E3', 'consort'], registration_id: 'NCT01234567', domain_hint: 'oncology',
    })
    expect(p.doc_type).toBe('csr')
    expect(p.is_clinical).toBe(true)
    expect(p.applicable_standards).toEqual(['ich-e3', 'consort'])
    expect(p.registration_id).toBe('NCT01234567')
  })
  it('falls back to other_research on a sparse object', () => {
    const p = normalizeProfile({})
    expect(p.doc_type).toBe('other_research')
    expect(p.applicable_standards).toEqual([])
    expect(p.registration_id).toBeNull()
  })
})

describe('docProfileBlock', () => {
  it('renders classification lines and omits absent optionals', () => {
    const block = docProfileBlock({ doc_type: 'csr', is_clinical: true, study_design: 'parallel_rct', applicable_standards: ['ich-e3', 'consort'] })
    expect(block).toContain('Type: csr')
    expect(block).toContain('Applicable standards: ich-e3, consort')
    expect(block).not.toContain('Trial registration')
  })
  it('includes registration + domain when present, empty for null', () => {
    const block = docProfileBlock({ doc_type: 'csr', registration_id: 'NCT01234567', domain_hint: 'oncology' })
    expect(block).toContain('Trial registration: NCT01234567')
    expect(block).toContain('Domain: oncology')
    expect(docProfileBlock(null)).toBe('')
  })
})

describe('runGatekeeper (classifier)', () => {
  it('returns a structured profile for a CSR', async () => {
    const ctx = gatekeeperCtx(JSON.stringify({
      eligible: true, doc_type: 'csr', is_clinical: true, study_design: 'parallel_rct',
      applicable_standards: ['ich_e3', 'consort'], registration_id: 'NCT01234567', domain_hint: 'oncology phase III', reason: 'CSR',
    }))
    const r = await runGatekeeper(ctx, 'a clinical study report', 'claude-sonnet-4-6', { sampleChars: 8000, maxOutputTokens: 1000 })
    expect(r.eligible).toBe(true)
    expect(r.profile.doc_type).toBe('csr')
    expect(r.profile.applicable_standards).toEqual(['ich-e3', 'consort'])
    expect(r.profile.registration_id).toBe('NCT01234567')
  })
  it('falls back gracefully on unparseable output', async () => {
    const ctx = gatekeeperCtx('not json')
    const r = await runGatekeeper(ctx, 'x', 'claude-sonnet-4-6', { sampleChars: 8000, maxOutputTokens: 1000 })
    expect(r.eligible).toBe(true)
    expect(r.profile.doc_type).toBe('other_research')
    expect(r.reason).toMatch(/Could not parse/)
  })
})

describe('guidance corpus', () => {
  it('reporting-standards lists only frontmatter-tagged chapters (legacy prompts gone)', () => {
    const ids = listGuidanceCategory('statistics').map(c => c.id)
    expect(ids).not.toContain('00-master-agent-prompt')
    expect(ids).not.toContain('00-ocr-agent-prompt')
    expect(ids).toContain('01-pvalues') // real chapters now carry frontmatter
  })
  it('clinical-methods category exists with the nine chapters', () => {
    const ids = listGuidanceCategory('clinical-methods').map(c => c.id)
    for (const id of ['estimands-e9r1', 'analysis-populations', 'multiplicity', 'missing-data', 'safety-ae', 'endpoint-definitions', 'sap-consistency', 'gcp-integrity', 'trial-registration']) {
      expect(ids).toContain(id)
    }
  })
  it('CONTRACT: every emittable standard id resolves to a loadable chapter', () => {
    for (const id of EMITTABLE_STANDARDS) {
      const content = loadGuidanceChapter('reporting-standards', id)
      expect(content, `missing chapter for ${id}`).toBeTruthy()
    }
  })
  it('CONTRACT: underscore form also resolves (loader is tolerant)', () => {
    expect(loadGuidanceChapter('reporting-standards', 'ich_e3')).toBeTruthy()
  })
})
