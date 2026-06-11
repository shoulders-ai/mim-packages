import assert from 'node:assert/strict'

const ctx = { actor: 'user' }

export async function smoke({ tools, packageId }) {
  await tools.call('fs.mkdir', { path: 'compat' }, ctx)
  await tools.call('fs.create', {
    path: 'compat/source.bib',
    content: `@article{smith2024,
  title = {Compat Import},
  author = {Jane Smith and Max Doe},
  year = {2024},
  journal = {Evidence Journal}
}`,
  }, ctx)

  const started = await tools.call('package.jobs.start', {
    packageId,
    jobId: 'importMarkdown',
    inputs: { path: 'compat/source.bib', output_path: 'compat/source.md' },
  }, ctx)
  assert.ok(started.runId)

  let run
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await tools.call('package.jobs.get', { runId: started.runId }, ctx)
    run = result.run
    if (run.status !== 'running') break
    await new Promise(resolve => setTimeout(resolve, 25))
  }

  assert.equal(run.status, 'completed')
  assert.equal(run.result.outputPath, 'compat/source.md')

  const markdown = await tools.call('fs.read', { path: 'compat/source.md', full: true }, ctx)
  assert.match(markdown.content, /Compat Import/)
}
