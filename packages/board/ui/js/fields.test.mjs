import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeNewIssueDraft } from './createDraft.js'
import { state } from './state.js'

const dataMocks = vi.hoisted(() => ({
  ensureBody: vi.fn(async issue => issue.body || ''),
  saveIssue: vi.fn(),
}))

vi.mock('./data.js', () => dataMocks)

const { commitFieldMenuTextInput } = await import('./fields.js')

describe('Board field menu text input contracts', () => {
  beforeEach(() => {
    state.newIssue = makeNewIssueDraft({ userName: 'Ada' })
    state.fieldMenu = { field: 'project', issueId: '', isNew: true, x: 0, y: 0 }
  })

  afterEach(() => {
    delete globalThis.document
  })

  it('commits a typed project when the menu is closed by mouse flow', () => {
    const input = {
      value: 'Launch',
      dataset: { field: 'project', id: '', new: '1' },
    }
    globalThis.document = {
      querySelector(selector) {
        return selector === '.field-menu .fm-input' ? input : null
      },
    }

    expect(commitFieldMenuTextInput({ close: true })).toBe(true)
    expect(state.newIssue.project).toBe('Launch')
    expect(state.fieldMenu).toBeNull()
  })
})
