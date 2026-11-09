import { computed, ref, shallowRef } from 'vue'
import { fetchHistory } from '../game/historyApi'

/**
 * The answer history: dates resolve to that day's code, and a picked day is
 * replayed on the main board — names and word lists are the game's business.
 */
export function useHistory() {
  const entries = shallowRef<HistoryEntry[] | null>(null)
  const errorMessage = ref('')

  /** ISO date → that day's entry, in the order the API listed them. */
  const byDate = computed(() => {
    const map = new Map<string, HistoryEntry>()
    for (const entry of entries.value ?? []) map.set(entry.date, entry)
    return map
  })

  const loaded = computed(() => entries.value !== null)

  let loading: Promise<void> | null = null

  /** Fetch once; a failed fetch clears the guard so the next open retries. */
  function load(): Promise<void> {
    if (!loading) {
      loading = fetchHistory().then(
        (list) => {
          entries.value = list
        },
        (error) => {
          errorMessage.value = error instanceof Error ? error.message : String(error)
          loading = null
        },
      )
    }
    return loading
  }

  return { entries, byDate, loaded, errorMessage, load }
}
