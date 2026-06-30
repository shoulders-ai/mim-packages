import { state, render, showToast } from './state.js'
import { makeNextIssueDraft } from './createDraft.js'
import { renderCreateModal as renderCreateModalView } from './createView.js'
import { createIssue, saveUserName } from './data.js'
import { qs } from './utils.js'

export function renderCreateModal() {
  return renderCreateModalView(state)
}

export function syncCreateDraftFromDom() {
  if (!state.modalOpen) return
  const titleEl = qs('#createTitle')
  const bodyEl = qs('#createBody')
  const nameInputEl = qs('#nameInput')
  if (titleEl) state.newIssue.title = titleEl.textContent
  if (bodyEl) state.newIssue.body = bodyEl.value
  if (nameInputEl) state.newIssue.nameInput = nameInputEl.value
}

export async function handleCreateIssue() {
  if (state.createSubmitting) return
  state.createSubmitting = true
  syncCreateDraftFromDom()
  render()

  try {
    const nameInput = (state.newIssue.nameInput || '').trim()
    if (nameInput) {
      await saveUserName(nameInput)
      state.newIssue.assignee = state.userName
    }

    const rawTitle = (state.newIssue.title || '').trim()
    const title = rawTitle || 'Untitled issue'

    const created = await createIssue(title, {
      status: state.newIssue.status,
      priority: state.newIssue.priority,
      assignee: state.newIssue.assignee || state.userName,
      project: state.newIssue.project,
      labels: state.newIssue.labels,
      body: state.newIssue.body || '',
    })

    if (!created) return

    if (state.createMore) {
      state.newIssue = makeNextIssueDraft(state.newIssue, state.userName)
      render()
      requestAnimationFrame(() => {
        const el = qs('#createTitle')
        if (el) el.focus()
      })
    } else {
      state.modalOpen = false
      state.fieldMenu = null
    }

    showToast('Issue created')
  } finally {
    state.createSubmitting = false
    render()
  }
}

export function initCreateListeners() {
  document.addEventListener('keydown', (e) => {
    if (!state.modalOpen) return
    const active = document.activeElement
    if (e.key === 'Enter' && active?.id === 'createTitle') {
      e.preventDefault()
      handleCreateIssue()
    }
    if (e.key === 'Enter' && active?.id === 'nameInput') {
      e.preventDefault()
      const val = active.value.trim()
      if (val) {
        saveUserName(val)
        state.newIssue.assignee = state.userName
        render()
        requestAnimationFrame(() => {
          const el = qs('#createTitle')
          if (el) el.focus()
        })
      }
    }
  })
}
