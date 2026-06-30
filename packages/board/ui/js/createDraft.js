export function makeNewIssueDraft({ status = 'backlog', project = '', userName = '' } = {}) {
  return {
    nameInput: '',
    title: '',
    body: '',
    status,
    priority: 'normal',
    assignee: userName,
    project,
    labels: [],
  }
}

export function makeNextIssueDraft(current, userName = '') {
  return makeNewIssueDraft({
    status: current?.status || 'backlog',
    project: current?.project || '',
    userName,
  })
}
