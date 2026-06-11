// Self-contained real-AI caller for the eval harness. The package cannot import
// core internals, so this builds a thin caller from the same AI SDK v6 packages
// the core uses. It exposes callModel/callAnthropic/callGemini with the shapes
// the pipeline expects (provider is derived from the registry model, so the same
// function serves all three names — exactly the additive intent of Phase A).
//
// Requires devDeps: ai, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google.
import { generateText, tool, jsonSchema, stepCountIs } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const FACTORY = { anthropic: createAnthropic, openai: createOpenAI, google: createGoogleGenerativeAI }
const KEY_ENV = { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', google: 'GOOGLE_API_KEY' }

function toSdkMessages(messages) {
  return (messages || []).map(m => {
    if (typeof m.content === 'string') return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }
    const parts = (Array.isArray(m.content) ? m.content : []).map(b => {
      if (b?.type === 'text') return { type: 'text', text: String(b.text || '') }
      if (b?.type === 'image' && b.source?.data) return { type: 'image', image: `data:${b.source.media_type || 'image/png'};base64,${b.source.data}` }
      return null
    }).filter(Boolean)
    return { role: m.role === 'assistant' ? 'assistant' : 'user', content: parts }
  })
}

export function makeRealAi({ registry, log = { ai: [] } }) {
  const call = async (opts) => {
    const wanted = opts.modelId || opts.model
    const m = registry.models.find(x => x.id === wanted || x.model === wanted)
    if (!m) throw new Error(`eval: unknown model ${wanted}`)
    const key = process.env[KEY_ENV[m.provider]]
    if (!key) throw new Error(`eval: missing ${KEY_ENV[m.provider]} for provider ${m.provider}`)
    const model = FACTORY[m.provider]({ apiKey: key })(m.model)
    const sdkTools = {}
    for (const t of opts.tools ?? []) {
      sdkTools[t.name.replace(/[^A-Za-z0-9_-]/g, '_')] = tool({
        description: t.description,
        inputSchema: jsonSchema(t.input_schema ?? { type: 'object', properties: {} }),
        execute: async (input) => {
          try { return await t.execute(input ?? {}) } catch (err) { return { error: err?.message || String(err) } }
        },
      })
    }
    const res = await generateText({
      model,
      system: opts.system,
      messages: toSdkMessages(opts.messages),
      tools: Object.keys(sdkTools).length ? sdkTools : undefined,
      stopWhen: stepCountIs(Math.max(1, opts.maxSteps ?? 1)),
      maxOutputTokens: opts.maxTokens ?? 8192,
    })
    log.ai.push({ model: m.id, steps: res.steps?.length ?? 1 })
    return {
      text: res.text ?? '',
      content: [],
      usage: {
        input: res.usage?.inputTokens ?? 0, output: res.usage?.outputTokens ?? 0,
        cacheRead: res.usage?.cachedInputTokens ?? 0, cacheCreation: 0,
      },
    }
  }
  const notUsed = async () => { throw new Error('eval: generateObject is not used by docx-review') }
  return { callModel: call, callAnthropic: call, callGemini: call, generateObject: notUsed }
}

// A judge caller for the scorer's Tier-2 semantic gate. Pinned model, maxSteps 1.
export function makeJudge({ registry, judgeModel, parseJsonObject }) {
  const ai = makeRealAi({ registry })
  return async ({ defect, comment }) => {
    const prompt = `You are scoring an automated peer-review system against a known answer key.

PLANTED DEFECT (ground truth):
  category: ${defect.category}
  description: ${defect.description ?? defect.rationale}
  located at: "${defect.locationSnippet ?? defect.snippet}"

REVIEWER COMMENT under test:
  on text: "${comment.text_snippet}"
  comment: "${comment.content}"

Question: Does the reviewer comment IDENTIFY this specific planted defect — i.e. does it raise substantially the same problem about substantially the same location? A comment that raises a DIFFERENT issue about the same sentence is NOT a match. A comment that raises the SAME issue in different words IS a match.

Answer with ONLY this JSON: {"match": true|false, "why": "<=15 words"}`
    const { text } = await ai.callModel({ modelId: judgeModel, messages: [{ role: 'user', content: prompt }], maxTokens: 200, maxSteps: 1 })
    const parsed = parseJsonObject(text)
    if (!parsed || typeof parsed.match !== 'boolean') throw new Error('unparseable judge verdict')
    return { match: parsed.match, why: parsed.why }
  }
}
