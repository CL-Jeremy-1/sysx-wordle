import { ref } from 'vue';
import { fetchTimezone } from '../game/dateApi';

export function useTimezone() {
  /** Default is CST */
  const tz = ref('Asia/Shanghai');
  async function load(signal?: AbortSignal) {
    try {
      const newTz = await fetchTimezone(signal)
      if (newTz) tz.value = newTz
    } catch {/** Fail silently */}
  }
  return { tz, load };
}
