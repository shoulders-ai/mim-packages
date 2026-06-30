import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeNewIssueDraft } from './createDraft.js'
import { state } from './state.js'

const dataMocks = vi.hoisted(() => ({
  createIssue: vi.fn(),
  saveUserName: vi.fn(),
}))

vi.mock('./data.js', () => dataMocks)

const { handleCreateIssue } = await import('./create.js')

describe('Board create submit contracts', () => {
  beforeEach(() => {
    dataMocks.createIssue.mockReset()
    dataMocks.saveUserName.mockReset()
    state.newIssue = {
      ...makeNewIssueDraft({ userName: 'Ada' }),
      title: 'One issue only',
      body: 'Details',
    }
    state.userName = 'Ada'
    state.modalOpen = false
    state.createMore = false
    state.createSubmitting = false
  })

  it('ignores duplicate submits while an issue create is in flight', async () => {
    let resolveCreate
    dataMocks.createIssue.mockImplementation(() => new Promise(resolve => {
      resolveCreate = resolve
    }))

    const first = handleCreateIssue()
    const second = handleCreateIssue()

    await second
    expect(dataMocks.createIssue).toHaveBeenCalledTimes(1)
    expect(dataMocks.createIssue).toHaveBeenCalledWith('One issue only', expect.objectContaining({
      assignee: 'Ada',
      body: 'Details',
    }))

    resolveCreate({ id: 'issue-1700000000-ab12' })
    await first
    expect(state.createSubmitting).toBe(false)
  })
})
