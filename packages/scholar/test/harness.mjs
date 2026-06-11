export function memoryData() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, new Map())
      const store = collections.get(name)
      return {
        async get(id) {
          return store.has(id) ? structuredClone(store.get(id)) : null
        },
        async put(id, value) {
          store.set(id, structuredClone(value))
        },
        async list() {
          return [...store.entries()].map(([id, value]) => ({ id, value: structuredClone(value) }))
        },
        async delete(id) {
          store.delete(id)
        },
      }
    },
  }
}

export function scriptedHttp(routes) {
  const calls = []
  return {
    calls,
    async request(input) {
      calls.push(input)
      const route = routes.find(item => item.match(input))
      if (!route) throw new Error(`No scripted route for ${input.url}`)
      const spec = typeof route.respond === 'function' ? route.respond(input, calls.length - 1) : route.respond
      if (spec.error) throw spec.error
      const status = spec.status ?? 200
      const text = spec.body === undefined ? '' : typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body)
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => JSON.parse(text),
        text: async () => text,
        headers: { get: () => null },
      }
    },
  }
}

export function makeCtx({ routes = [], secrets = {}, aiResponses = [] } = {}) {
  const http = scriptedHttp(routes)
  const toolCalls = []
  const writes = new Map()
  const progress = { steps: [], values: [], done: null }
  let aiIndex = 0
  return {
    package: { id: 'scholar', name: 'Scholar', version: '0.1.0' },
    job: { id: 'runSearch', runId: 'run-scholar-1', startedAt: '2026-06-15T10:00:00.000Z' },
    data: memoryData(),
    http,
    secrets: {
      async has(name) {
        return Object.prototype.hasOwnProperty.call(secrets, name)
      },
      async get(name) {
        return Object.prototype.hasOwnProperty.call(secrets, name) ? secrets[name] : null
      },
    },
    ai: {
      async generateObject(input) {
        if (aiIndex >= aiResponses.length) throw new Error('No scripted AI response')
        const object = structuredClone(aiResponses[aiIndex++])
        return { object, modelId: input.modelId || 'mock-model', provider: 'mock', usage: { inputTokens: 1, outputTokens: 1 } }
      },
    },
    progress: {
      async step(name) {
        progress.steps.push(name)
      },
      async log() {},
      async progress(value, label) {
        progress.values.push({ value, label })
      },
      async done(message) {
        progress.done = message
      },
      records: progress,
    },
    abort: {
      aborted: false,
      throwIfAborted() {},
    },
    tools: {
      calls: toolCalls,
      writes,
      async call(name, params) {
        toolCalls.push({ name, params })
        if (name === 'fs.write') writes.set(params.path, params.content)
        return { ok: true }
      },
    },
  }
}
