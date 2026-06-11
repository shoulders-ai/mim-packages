import assert from 'node:assert/strict'

const ctx = { actor: 'user' }

export async function smoke({ tools }) {
  const imported = await tools.call('references.import', {
    format: 'bibtex',
    text: `@article{smith2024,
  author = {Smith, Jane},
  title = {Budget Impact},
  journal = {Value Health},
  year = {2024},
  doi = {10.1000/compat}
}`,
  }, ctx)
  assert.equal(imported.added, 1)

  const search = await tools.call('references.search', { query: 'Budget', limit: 10 }, ctx)
  assert.ok(search.items.some(item => item.key === 'smith2024'))

  const got = await tools.call('references.get', { key: 'smith2024' }, ctx)
  assert.equal(got.title, 'Budget Impact')
  assert.equal(got.doi, '10.1000/compat')
}
