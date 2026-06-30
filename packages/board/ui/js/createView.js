import { STATUS_LABELS, PRIORITY_LABELS, LABEL_COLOR_VALUES } from './constants.js'
import { statusToken, priorityBars, icon } from './icons.js'
import { escapeAttr, escapeHtml, userInitial } from './utils.js'

function chipButton(field, content) {
  return `<button class="create-chip" data-action="open-new-field" data-field="${field}">${content}</button>`
}

export function renderCreateModal(viewState) {
  if (!viewState.modalOpen) return ''

  const n = viewState.newIssue
  const statusLabel = STATUS_LABELS[n.status] || n.status
  const priorityLabel = n.priority === 'normal' ? 'Priority' : (PRIORITY_LABELS[n.priority] || n.priority)
  const assigneeLabel = n.assignee || 'Assignee'
  const assigneeIcon = n.assignee
    ? `<span class="avatar-sm">${escapeHtml(userInitial(n.assignee))}</span>`
    : icon('user', 13)
  const projectLabel = n.project || 'Project'

  const labelsChip = n.labels.length > 0
    ? n.labels.map(l => {
        const color = LABEL_COLOR_VALUES[l.color] || LABEL_COLOR_VALUES.gray
        return `<span class="label-pill compact"><span class="label-dot" style="background:${color}"></span>${escapeHtml(l.name)}</span>`
      }).join('')
    : `${icon('tag', 13)} Labels`

  const namePrompt = !viewState.userName
    ? `<div class="name-prompt">
        <span>What's your name?</span>
        <input class="name-input" id="nameInput" type="text" placeholder="Your name..." autocomplete="off" value="${escapeAttr(n.nameInput)}">
      </div>`
    : ''

  return `<div class="overlay" id="createOverlay">
    <div class="create-modal">
      <div class="create-header">
        <span class="create-team">${statusToken(n.status)} Board</span>
        <span class="create-sep">›</span>
        <span>New issue</span>
        <span class="create-spacer"></span>
        <button class="create-close" data-action="close-modal">${icon('close', 14)}</button>
      </div>
      <div class="create-body">
        ${namePrompt}
        <div class="create-title" id="createTitle" contenteditable="true" data-placeholder="Issue title">${escapeHtml(n.title)}</div>
        <textarea class="create-desc" id="createBody" placeholder="Add description..." autocomplete="off">${escapeHtml(n.body)}</textarea>
        <div class="create-chips">
          ${chipButton('status', `${statusToken(n.status)} ${statusLabel}`)}
          ${chipButton('priority', `${priorityBars(n.priority)} ${priorityLabel}`)}
          ${chipButton('assignee', `${assigneeIcon} ${escapeHtml(assigneeLabel)}`)}
          ${chipButton('project', `${icon('folder', 13)} ${escapeHtml(projectLabel)}`)}
          ${chipButton('labels', labelsChip)}
        </div>
      </div>
      <div class="create-footer">
        <div class="create-spacer"></div>
        <button class="create-more-toggle ${viewState.createMore ? 'on' : ''}" data-action="toggle-create-more">
          <span class="toggle-track"><span class="toggle-knob"></span></span>
        </button>
        <span class="create-more-label">Create more</span>
        <button class="create-submit" data-action="create-issue"${viewState.createSubmitting ? ' disabled' : ''}>Create issue</button>
      </div>
    </div>
  </div>`
}
