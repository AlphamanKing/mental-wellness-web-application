<template>
  <div class="bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-neutral-900">Mood Tracker</h1>
        <button @click="showMoodForm = true" class="btn btn-primary">
          Log Mood
        </button>
      </div>
      
      <!-- Mood chart -->
      <div class="bg-white rounded-xl shadow-soft p-6 mb-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 class="text-xl font-semibold text-neutral-900 mb-2 md:mb-0">Your Mood History</h2>
          <div class="flex space-x-2">
            <button 
              v-for="period in timePeriods" 
              :key="period.value"
              @click="selectedPeriod = period.value"
              class="px-3 py-1 text-sm rounded-md"
              :class="selectedPeriod === period.value 
                ? 'bg-primary-100 text-primary-800 font-medium' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        
        <div v-if="loading" class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        
        <div v-else-if="moods.length === 0" class="text-center py-16">
          <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-neutral-900 mb-2">No mood data yet</h3>
          <p class="text-neutral-600 mb-4">
            Start tracking your mood to see patterns and insights over time.
          </p>
          <button @click="showMoodForm = true" class="btn btn-primary">
            Log Your First Mood
          </button>
        </div>
        
        <div v-else>
          <canvas ref="moodChart" class="w-full h-64"></canvas>
        </div>
      </div>
      
      <!-- Mood entries list -->
      <div class="bg-white rounded-xl shadow-soft p-6">
        <h2 class="text-xl font-semibold text-neutral-900 mb-4">Mood Entries</h2>
        
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        
        <div v-else-if="moods.length === 0" class="text-center py-8">
          <p class="text-neutral-600">No mood entries yet</p>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="mood in moods" 
            :key="mood.id" 
            class="p-4 rounded-lg border border-neutral-200"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                  :class="getMoodColor(mood.score)"
                >
                  <span class="text-lg">{{ getMoodEmoji(mood.score) }}</span>
                </div>
                <div>
                  <div class="font-medium text-neutral-900">{{ getMoodLabel(mood.score) }}</div>
                  <div class="text-sm text-neutral-500">{{ formatDate(mood.timestamp) }}</div>
                </div>
              </div>
              <div class="text-sm font-medium" :class="getMoodTextColor(mood.score)">
                {{ mood.score }}/5
              </div>
            </div>
            
            <div v-if="mood.note" class="mt-3 text-neutral-700 border-t border-neutral-100 pt-3">
              {{ mood.note }}
            </div>
            
            <div v-if="mood.emotions && mood.emotions.length > 0" class="mt-3 flex flex-wrap gap-2">
              <span 
                v-for="emotion in mood.emotions" 
                :key="emotion"
                class="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700"
              >
                {{ emotion }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mood logging modal -->
      <div v-if="showMoodForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Log Your Mood</h2>
            <button @click="showMoodForm = false" class="text-neutral-500 hover:text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="submitMood">
            <div class="mb-6">
              <label class="block text-neutral-700 mb-2">How are you feeling?</label>
              <div class="flex justify-between items-center">
                <button 
                  v-for="score in [1, 2, 3, 4, 5]" 
                  :key="score"
                  type="button"
                  @click="moodScore = score"
                  class="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform"
                  :class="[
                    moodScore === score 
                      ? 'transform scale-125 ' + getMoodColor(score) 
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  ]"
                >
                  {{ getMoodEmoji(score) }}
                </button>
              </div>
              <div class="flex justify-between mt-2 text-sm text-neutral-500">
                <span>Very Low</span>
                <span>Low</span>
                <span>Neutral</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
            
            <div class="mb-6">
              <label for="mood-note" class="block text-neutral-700 mb-2">Add a note (optional)</label>
              <textarea 
                id="mood-note"
                v-model="moodNote"
                rows="3"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="What's contributing to your mood today?"
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="showMoodForm = false" 
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!moodScore || submitting"
              >
                <span v-if="submitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMoodStore } from '../store/mood'
import { format } from 'date-fns'
import Chart from 'chart.js/auto'

// Store
const moodStore = useMoodStore()

// State
const loading = ref(true)
const showMoodForm = ref(false)
const moodScore = ref(null)
const moodNote = ref('')
const submitting = ref(false)
const moodChart = ref(null)
const chartInstance = ref(null)
const selectedPeriod = ref(30)

// Time period options
const timePeriods = [
  { label: 'Week', value: 7 },
  { label: 'Month', value: 30 },
  { label: '3 Months', value: 90 },
  { label: 'Year', value: 365 }
]

// Computed properties
const moods = computed(() => moodStore.moodHistory)

// Methods
const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

const getMoodEmoji = (score) => {
  const emojis = ['😢', '😔', '😐', '🙂', '😄']
  return emojis[Math.min(Math.max(Math.floor(score) - 1, 0), 4)]
}

const getMoodLabel = (score) => {
  const labels = ['Very Low', 'Low', 'Neutral', 'Good', 'Excellent']
  return labels[Math.min(Math.max(Math.floor(score) - 1, 0), 4)]
}

const getMoodColor = (score) => {
  const colors = [
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-yellow-100 text-yellow-800',
    'bg-green-100 text-green-800',
    'bg-primary-100 text-primary-800'
  ]
  return colors[Math.min(Math.max(Math.floor(score) - 1, 0), 4)]
}

const getMoodTextColor = (score) => {
  const colors = [
    'text-red-600',
    'text-orange-600',
    'text-yellow-600',
    'text-green-600',
    'text-primary-600'
  ]
  return colors[Math.min(Math.max(Math.floor(score) - 1, 0), 4)]
}

const submitMood = async () => {
  if (!moodScore.value) return
  
  submitting.value = true
  
  try {
    await moodStore.recordMood(moodScore.value, moodNote.value)
    showMoodForm.value = false
    moodScore.value = null
    moodNote.value = ''
    
    // Refresh chart
    renderChart()
  } catch (error) {
    console.error('Error recording mood:', error)
  } finally {
    submitting.value = false
  }
}

const renderChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  if (!moodChart.value || moods.value.length === 0) return
  
  const ctx = moodChart.value.getContext('2d')
  
  // Prepare data for chart
  const sortedMoods = [...moods.value].sort((a, b) => a.timestamp - b.timestamp)
  
  const labels = sortedMoods.map(mood => format(new Date(mood.timestamp), 'MMM d'))
  const data = sortedMoods.map(mood => mood.score)
  
  // Define gradient for chart
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)')
  gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)')
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood Score',
        data,
        backgroundColor: gradient,
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(14, 165, 233, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex
              return format(new Date(sortedMoods[index].timestamp), 'MMMM d, yyyy h:mm a')
            },
            label: (context) => {
              const score = context.raw
              return `Mood: ${getMoodLabel(score)} (${score}/5)`
            },
            afterLabel: (context) => {
              const index = context.dataIndex
              const note = sortedMoods[index].note
              return note ? `Note: ${note}` : ''
            }
          }
        }
      }
    }
  })
}

// Fetch mood data on component mount
onMounted(async () => {
  loading.value = true
  
  try {
    await moodStore.fetchMoods(selectedPeriod.value)
    renderChart()
  } catch (error) {
    console.error('Error fetching moods:', error)
  } finally {
    loading.value = false
  }
})

// Watch for time period changes
watch(selectedPeriod, async (newPeriod) => {
  loading.value = true
  
  try {
    await moodStore.fetchMoods(newPeriod)
    renderChart()
  } catch (error) {
    console.error('Error fetching moods:', error)
  } finally {
    loading.value = false
  }
})
</script>
