/**
 * Shared model filter for deck-capable models.
 * Any provider with tool-use and text capabilities.
 */
export function deckCapableModels(models) {
  if (!Array.isArray(models)) return []
  return models.filter(model =>
    model &&
    model.capabilities?.tools !== false &&
    model.capabilities?.text !== false,
  )
}
