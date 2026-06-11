import assert from 'node:assert/strict'

const ctx = { actor: 'user' }

export async function smoke({ tools }) {
  const created = await tools.call('issues.create', {
    title: 'Compat issue',
    status: 'backlog',
    priority: 'normal',
    tags: ['compat'],
    body: 'Created by the Mim compatibility gate.',
  }, ctx)
  assert.match(created.id, /^issue-\d+-[a-z0-9]{4}$/)
  assert.equal(created.title, 'Compat issue')

  const got = await tools.call('issues.get', { id: created.id }, ctx)
  assert.equal(got.body, 'Created by the Mim compatibility gate.')

  const updated = await tools.call('issues.update', {
    id: created.id,
    title: 'Compat issue updated',
    status: 'done',
  }, ctx)
  assert.equal(updated.status, 'done')

  const listed = await tools.call('issues.list', {}, ctx)
  assert.ok(listed.items.some(item => item.id === created.id && item.status === 'done'))

  await tools.call('issues.delete', { id: created.id }, ctx)
  const after = await tools.call('issues.list', {}, ctx)
  assert.equal(after.items.some(item => item.id === created.id), false)
}
