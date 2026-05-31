<template>
  <div class="border rounded-lg p-4 space-y-4 print:hidden">
    <h3 class="font-semibold">{{ $t('brewDay.title') }}</h3>

    <p v-if="!steps.length && !boilTime" class="text-sm text-muted-foreground">
      {{ $t('brewDay.noSteps') }}
    </p>

    <!-- Mash steps -->
    <ol v-if="steps.length" class="space-y-3">
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="border rounded-md p-3"
        :class="{ 'bg-primary/5 border-primary': activeIndex === i, 'opacity-60': done[i] }"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="font-medium">{{ i + 1 }}. {{ step.name }}</div>
            <div class="text-sm text-muted-foreground">
              {{ Math.round(step.stepTemp) }}&nbsp;°C · {{ Math.round(step.stepTime) }}&nbsp;{{
                $t('brewDay.min')
              }}
              <template v-if="(step.infuseAmount ?? 0) > 0">
                · {{ $t('brewDay.infuse') }} {{ formatL(step.infuseAmount) }}&nbsp;L
              </template>
            </div>
          </div>
          <div class="font-mono tabular-nums text-2xl" :class="{ 'text-destructive': alarm[i] }">
            {{ formatTime(remaining[i] ?? 0) }}
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button class="px-3 py-1 border rounded text-xs" @click="toggle(i)">
            {{ running[i] ? $t('brewDay.pause') : $t('brewDay.start') }}
          </button>
          <button class="px-3 py-1 border rounded text-xs" @click="reset(i)">
            {{ $t('common.reset') }}
          </button>
          <label class="flex items-center gap-1 text-xs ml-auto">
            <input type="checkbox" :checked="done[i]" class="rounded" @change="toggleDone(i)" />
            {{ $t('brewDay.done') }}
          </label>
        </div>
      </li>
    </ol>

    <!-- Boil timer -->
    <div v-if="boilTime > 0" class="border rounded-md p-3">
      <div class="flex items-center justify-between">
        <div class="font-medium">
          {{ $t('brewDay.boil') }}
          <span class="text-sm text-muted-foreground"
            >({{ Math.round(boilTime) }} {{ $t('brewDay.min') }})</span
          >
        </div>
        <div class="font-mono tabular-nums text-2xl" :class="{ 'text-destructive': boilAlarm }">
          {{ formatTime(boilRemaining) }}
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <button class="px-3 py-1 border rounded text-xs" @click="toggleBoil">
          {{ boilRunning ? $t('brewDay.pause') : $t('brewDay.start') }}
        </button>
        <button class="px-3 py-1 border rounded text-xs" @click="resetBoil">
          {{ $t('common.reset') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BrewMashStep {
  name: string
  stepTemp: number
  stepTime: number
  infuseAmount?: number | null
  type?: string | null
}

const props = defineProps<{
  steps: BrewMashStep[]
  boilTime: number
}>()

const remaining = ref<number[]>([])
const running = ref<boolean[]>([])
const alarm = ref<boolean[]>([])
const done = ref<boolean[]>([])
const activeIndex = ref<number>(-1)
const intervals: Array<ReturnType<typeof setInterval> | undefined> = []

const boilRemaining = ref(0)
const boilRunning = ref(false)
const boilAlarm = ref(false)
let boilInterval: ReturnType<typeof setInterval> | undefined

function initSteps() {
  remaining.value = props.steps.map((s) => Math.round((s.stepTime || 0) * 60))
  running.value = props.steps.map(() => false)
  alarm.value = props.steps.map(() => false)
  done.value = props.steps.map(() => false)
  boilRemaining.value = Math.round((props.boilTime || 0) * 60)
}

watch(() => [props.steps, props.boilTime], initSteps, { immediate: true })

function toggle(i: number) {
  if (running.value[i]) {
    running.value[i] = false
    clearInterval(intervals[i])
    return
  }
  if ((remaining.value[i] ?? 0) <= 0)
    remaining.value[i] = Math.round((props.steps[i]?.stepTime || 0) * 60)
  running.value[i] = true
  alarm.value[i] = false
  activeIndex.value = i
  clearInterval(intervals[i])
  intervals[i] = setInterval(() => {
    if ((remaining.value[i] ?? 0) > 0) {
      remaining.value[i] = (remaining.value[i] ?? 0) - 1
      if (remaining.value[i] === 0) {
        running.value[i] = false
        alarm.value[i] = true
        clearInterval(intervals[i])
        ping()
      }
    }
  }, 1000)
}

function reset(i: number) {
  running.value[i] = false
  alarm.value[i] = false
  clearInterval(intervals[i])
  remaining.value[i] = Math.round((props.steps[i]?.stepTime || 0) * 60)
}

function toggleDone(i: number) {
  done.value[i] = !done.value[i]
}

function toggleBoil() {
  if (boilRunning.value) {
    boilRunning.value = false
    if (boilInterval) clearInterval(boilInterval)
    return
  }
  if (boilRemaining.value <= 0) boilRemaining.value = Math.round((props.boilTime || 0) * 60)
  boilRunning.value = true
  boilAlarm.value = false
  if (boilInterval) clearInterval(boilInterval)
  boilInterval = setInterval(() => {
    if (boilRemaining.value > 0) {
      boilRemaining.value -= 1
      if (boilRemaining.value === 0) {
        boilRunning.value = false
        boilAlarm.value = true
        if (boilInterval) clearInterval(boilInterval)
        ping()
      }
    }
  }, 1000)
}

function resetBoil() {
  boilRunning.value = false
  boilAlarm.value = false
  if (boilInterval) clearInterval(boilInterval)
  boilRemaining.value = Math.round((props.boilTime || 0) * 60)
}

/** Short audible beep when a timer finishes (best-effort, browser only). */
function ping() {
  if (!import.meta.client) return
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // Audio not available; ignore.
  }
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds ?? 0)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function formatL(v: number | null | undefined): string {
  return (v ?? 0).toFixed(1)
}

onBeforeUnmount(() => {
  intervals.forEach((iv) => iv && clearInterval(iv))
  if (boilInterval) clearInterval(boilInterval)
})
</script>
