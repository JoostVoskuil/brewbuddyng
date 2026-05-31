import { ref } from 'vue'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Tracks the state of a save action so the UI can give the user feedback
 * (saving / saved / error). Wraps an async save function, flips the status
 * and automatically returns to idle a short while after a successful save.
 */
export function useSaveState() {
  const status = ref<SaveStatus>('idle')
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  async function run(action: () => Promise<unknown>) {
    if (resetTimer) clearTimeout(resetTimer)
    status.value = 'saving'
    try {
      await action()
      status.value = 'saved'
      resetTimer = setTimeout(() => {
        status.value = 'idle'
      }, 2000)
    } catch (error) {
      status.value = 'error'
      console.error('Save failed', error)
    }
  }

  return { status, run }
}
