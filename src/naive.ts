/**
 * naive-ui comes from a CDN at runtime instead of the bundle: the app only
 * uses the history modal's date picker, and the whole library would multiply
 * the bundle several times over. The UMD build binds to `window.Vue`, so the
 * app's own Vue copy is parked there first — pointing it at a second Vue
 * instance would leave the calendar's internal state unreactive.
 */
import * as Vue from 'vue'

export type Naive = typeof import('naive-ui')

/** Pinned version; mirrors are tried in order, first one that answers wins. */
const NAIVE_URLS = [
  'https://gcore.jsdelivr.net/npm/naive-ui@2.45.3/dist/index.prod.js',
  'https://cdn.staticfile.net/naive-ui/2.45.3/index.prod.js',
  'https://fastly.jsdelivr.net/npm/naive-ui@2.45.3/dist/index.prod.js',
  'https://cdn.jsdelivr.net/npm/naive-ui@2.45.3/dist/index.prod.js',
]

let loading: Promise<Naive> | null = null

function injectScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`无法加载 ${url}`))
    document.head.appendChild(script)
  })
}

/** Fetch the CDN build once; later calls await the same script. */
export function loadNaive(): Promise<Naive> {
  loading ??= (async () => {
    // Must land before the UMD script executes: its factory reads `window.Vue`.
    ;(window as unknown as { Vue?: unknown }).Vue = Vue

    let lastError: unknown
    for (const url of NAIVE_URLS) {
      try {
        await injectScript(url)
        const naive = (window as unknown as { naive?: Naive }).naive
        if (naive) return naive
        lastError = new Error('脚本已执行但 naive 全局缺失')
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('naive-ui 加载失败')
  })()
  return loading
}
