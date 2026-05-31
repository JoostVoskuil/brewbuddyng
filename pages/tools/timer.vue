<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.timer') }}</h1>

    <div class="space-y-8">
      <!-- Countdown timer -->
      <section class="border rounded-lg p-5 space-y-4">
        <h2 class="font-semibold">Countdown</h2>
        <div class="flex items-end gap-3">
          <div>
            <label class="text-sm font-medium">Minutes</label>
            <input
              v-model.number="presetMinutes"
              type="number"
              min="0"
              class="w-24 mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <button class="px-3 py-2 border rounded-md text-sm" @click="setCountdown">Set</button>
        </div>
        <div
          class="text-5xl font-mono tabular-nums text-center py-2"
          :class="{ 'text-destructive': countdownDone }"
        >
          {{ formatTime(countdownRemaining) }}
        </div>
        <div class="flex gap-2 justify-center">
          <button
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            @click="toggleCountdown"
          >
            {{ countdownRunning ? 'Pause' : 'Start' }}
          </button>
          <button class="px-4 py-2 border rounded-md text-sm" @click="resetCountdown">
            {{ $t('common.reset') }}
          </button>
        </div>
        <div class="flex gap-2 justify-center flex-wrap">
          <button
            v-for="m in quickPresets"
            :key="m"
            class="px-3 py-1 border rounded-md text-xs"
            @click="applyPreset(m)"
          >
            {{ m }} min
          </button>
        </div>
      </section>

      <!-- Stopwatch -->
      <section class="border rounded-lg p-5 space-y-4">
        <h2 class="font-semibold">Stopwatch</h2>
        <div class="text-5xl font-mono tabular-nums text-center py-2">
          {{ formatTime(stopwatchElapsed) }}
        </div>
        <div class="flex gap-2 justify-center">
          <button
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            @click="toggleStopwatch"
          >
            {{ stopwatchRunning ? 'Pause' : 'Start' }}
          </button>
          <button class="px-4 py-2 border rounded-md text-sm" @click="resetStopwatch">
            {{ $t('common.reset') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const quickPresets = [15, 30, 45, 60, 90]

// Countdown
const presetMinutes = ref(60)
const countdownRemaining = ref(60 * 60)
const countdownRunning = ref(false)
const countdownDone = ref(false)
let countdownInterval: ReturnType<typeof setInterval> | undefined

function setCountdown() {
  countdownRunning.value = false
  countdownDone.value = false
  countdownRemaining.value = Math.max(0, Math.round(presetMinutes.value * 60))
}
function toggleCountdown() {
  if (countdownRunning.value) {
    countdownRunning.value = false
    return
  }
  if (countdownRemaining.value <= 0) setCountdown()
  countdownRunning.value = true
  countdownDone.value = false
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    if (countdownRemaining.value > 0) {
      countdownRemaining.value -= 1
      if (countdownRemaining.value === 0) {
        countdownRunning.value = false
        countdownDone.value = true
      }
    }
  }, 1000)
}
function resetCountdown() {
  countdownRunning.value = false
  countdownDone.value = false
  countdownRemaining.value = Math.max(0, Math.round(presetMinutes.value * 60))
}

function applyPreset(minutes: number) {
  presetMinutes.value = minutes
  setCountdown()
}

// Stopwatch
const stopwatchElapsed = ref(0)
const stopwatchRunning = ref(false)
let stopwatchInterval: ReturnType<typeof setInterval> | undefined

function toggleStopwatch() {
  if (stopwatchRunning.value) {
    stopwatchRunning.value = false
    return
  }
  stopwatchRunning.value = true
  if (stopwatchInterval) clearInterval(stopwatchInterval)
  stopwatchInterval = setInterval(() => {
    stopwatchElapsed.value += 1
  }, 1000)
}
function resetStopwatch() {
  stopwatchRunning.value = false
  stopwatchElapsed.value = 0
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

onBeforeUnmount(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (stopwatchInterval) clearInterval(stopwatchInterval)
})
</script>
