/**
 * Shared model filter for deck-capable models.
 * Any provider with text output. Slides no longer run a model-owned tool loop;
 * the backend writes normal workspace files and renders once at the end.
 */
export function deckCapableModels(models) {
  if (!Array.isArray(models)) return []
  return models.filter(model =>
    model &&
    model.capabilities?.text !== false,
  )
}
