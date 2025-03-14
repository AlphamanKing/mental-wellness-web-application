<template>
  <div class="bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-neutral-900 mb-8">Welcome, {{ userDisplayName }}</h1>
      
      <!-- Dashboard cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Mood card -->
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Your Mood</h2>
            <router-link to="/mood-tracker" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
          </div>
          
          <div v-if="loadingMood" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          
          <div v-else-if="latestMood" class="space-y-4">
            <div class="flex items-center space-x-2">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="getMoodColor(latestMood.score)">
                <span class="text-lg">{{ getMoodEmoji(latestMood.score) }}</span>
              </div>
              <div>
                <div class="font-medium">{{ getMoodLabel(latestMood.score) }}</div>
                <div class="text-sm text-neutral-500">{{ formatDate(latestMood.created_at) }}</div>
              </div>
            </div>
            
            <p v-if="latestMood.notes" class="text-neutral-700 text-sm">
              "{{ latestMood.notes }}"
            </p>
            
            <router-link to="/mood-tracker/new" class="btn btn-primary w-full">
              Log Today's Mood
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">You haven't logged your mood yet</p>
            <router-link to="/mood-tracker/new" class="btn btn-primary">
              Log Your First Mood
            </router-link>
          </div>
        </div>
        
        <!-- AI Therapy card -->
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">AI Therapy</h2>
            <router-link to="/chat" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
          </div>
          
          <div v-if="loadingChat" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          
          <div v-else-if="recentChats && recentChats.length > 0" class="space-y-4">
            <div class="space-y-2">
              <div v-for="chat in recentChats.slice(0, 2)" :key="chat.id" class="p-3 bg-neutral-50 rounded-lg">
                <div class="flex justify-between items-start">
                  <span class="font-medium text-neutral-900">{{ chat.title || 'Conversation' }}</span>
                  <span class="text-xs text-neutral-500">{{ formatDate(chat.updated_at) }}</span>
                </div>
                <p class="text-sm text-neutral-600 mt-1 truncate">
                  {{ chat.last_message || 'Start chatting with your AI therapist' }}
                </p>
              </div>
            </div>
            
            <router-link to="/chat/new" class="btn btn-primary w-full">
              Start New Conversation
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">No conversations yet</p>
            <router-link to="/chat/new" class="btn btn-primary">
              Start Talking to Your AI Therapist
            </router-link>
          </div>
        </div>
        
        <!-- Journal card -->
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Journal</h2>
            <router-link to="/journal" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
          </div>
          
          <div v-if="loadingJournal" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          
          <div v-else-if="recentJournalEntries && recentJournalEntries.length > 0" class="space-y-4">
            <div class="space-y-2">
              <div v-for="entry in recentJournalEntries.slice(0, 2)" :key="entry.id" class="p-3 bg-neutral-50 rounded-lg">
                <div class="flex justify-between items-start">
                  <span class="font-medium text-neutral-900">{{ entry.title || 'Untitled Entry' }}</span>
                  <span class="text-xs text-neutral-500">{{ formatDate(entry.created_at) }}</span>
                </div>
                <p class="text-sm text-neutral-600 mt-1 line-clamp-2">
                  {{ entry.content }}
                </p>
              </div>
            </div>
            
            <router-link to="/journal/new" class="btn btn-primary w-full">
              Write New Entry
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">No journal entries yet</p>
            <router-link to="/journal/new" class="btn btn-primary">
              Write Your First Entry
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Goals section -->
      <div class="bg-white rounded-xl shadow-soft p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-neutral-900">Your Goals</h2>
          <router-link to="/goals" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
        </div>
        
        <div v-if="loadingGoals" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        
        <div v-else-if="activeGoals && activeGoals.length > 0" class="space-y-4">
          <div class="space-y-3">
            <div v-for="goal in activeGoals.slice(0, 3)" :key="goal.id" class="flex items-center">
              <input 
                :id="'goal-' + goal.id" 
                type="checkbox" 
                :checked="goal.completed" 
                @change="toggleGoalCompletion(goal.id, !goal.completed)"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" 
              />
              <label :for="'goal-' + goal.id" class="ml-3 block text-sm font-medium text-neutral-900">
                {{ goal.title }}
                <span v-if="goal.target_date" class="text-xs text-neutral-500 ml-2">
                  Due: {{ formatDate(goal.target_date) }}
                </span>
              </label>
            </div>
          </div>
          
          <router-link to="/goals/new" class="btn btn-primary w-full">
            Add New Goal
          </router-link>
        </div>
        
        <div v-else class="text-center py-8">
          <p class="text-neutral-600 mb-4">No goals set yet</p>
          <router-link to="/goals/new" class="btn btn-primary">
            Set Your First Goal
          </router-link>
        </div>
      </div>
      
      <!-- Resources section -->
      <div class="bg-white rounded-xl shadow-soft p-6">
        <h2 class="text-xl font-semibold text-neutral-900 mb-4">Mental Health Resources</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Articles -->
          <div>
            <h3 class="font-medium text-neutral-900 mb-3">Articles</h3>
            <ul class="space-y-2">
              <li v-for="(article, index) in resources.articles" :key="index">
                <a :href="article.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:text-primary-500 hover:underline">
                  {{ article.title }}
                </a>
              </li>
            </ul>
          </div>
          
          <!-- Videos -->
          <div>
            <h3 class="font-medium text-neutral-900 mb-3">Videos</h3>
            <ul class="space-y-2">
              <li v-for="(video, index) in resources.videos" :key="index">
                <a :href="video.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:text-primary-500 hover:underline">
                  {{ video.title }}
                </a>
              </li>
            </ul>
          </div>
          
          <!-- Exercises -->
          <div>
            <h3 class="font-medium text-neutral-900 mb-3">Mindfulness Exercises</h3>
            <ul class="space-y-2">
              <li v-for="(exercise, index) in resources.exercises" :key="index">
                <a :href="exercise.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:text-primary-500 hover:underline">
                  {{ exercise.title }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useMoodStore } from '../store/mood'
import { useChatStore } from '../store/chat'
import { useJournalStore } from '../store/journal'
import { useGoalsStore } from '../store/goals'
import { format } from 'date-fns'

// Stores
const authStore = useAuthStore()
const moodStore = useMoodStore()
const chatStore = useChatStore()
const journalStore = useJournalStore()
const goalsStore = useGoalsStore()

// State
const loadingMood = ref(true)
const loadingChat = ref(true)
const loadingJournal = ref(true)
const loadingGoals = ref(true)

// Computed properties
const userDisplayName = computed(() => {
  return authStore.userDisplayName || 'User'
})

const latestMood = computed(() => {
  if (!moodStore.moods || moodStore.moods.length === 0) return null
  return moodStore.moods[0]
})

const recentChats = computed(() => {
  return chatStore.conversations
})

const recentJournalEntries = computed(() => {
  return journalStore.entries
})

const activeGoals = computed(() => {
  return goalsStore.activeGoals
})

// Resources data
const resources = ref({
  articles: [
    { title: 'Understanding Anxiety and Depression', url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders' },
    { title: 'The Power of Positive Thinking', url: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/positive-thinking/art-20043950' },
    { title: 'Sleep and Mental Health', url: 'https://www.health.harvard.edu/newsletter_article/sleep-and-mental-health' }
  ],
  videos: [
    { title: '5-Minute Meditation for Stress Relief', url: 'https://www.youtube.com/watch?v=inpok4MKVLM' },
    { title: 'Understanding Cognitive Behavioral Therapy', url: 'https://www.youtube.com/watch?v=8bnSCAFysso' },
    { title: 'The Science of Happiness', url: 'https://www.youtube.com/watch?v=GXy__kBVq1M' }
  ],
  exercises: [
    { title: 'Progressive Muscle Relaxation', url: 'https://www.healthline.com/health/progressive-muscle-relaxation' },
    { title: 'Deep Breathing Techniques', url: 'https://www.verywellmind.com/abdominal-breathing-2584115' },
    { title: 'Mindful Walking Practice', url: 'https://www.mindful.org/how-to-practice-mindful-walking/' }
  ]
})

// Methods
const formatDate = (date) => {
  if (!date) return ''
  
  // Handle Firebase Timestamp objects
  if (date._seconds) {
    date = new Date(date._seconds * 1000)
  }
  
  return format(new Date(date), 'MMM d, yyyy')
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

const toggleGoalCompletion = async (goalId, completed) => {
  try {
    await goalsStore.toggleGoalCompletion(goalId, completed)
  } catch (error) {
    console.error('Error toggling goal completion:', error)
  }
}

// Fetch data on component mount
onMounted(async () => {
  try {
    await moodStore.fetchMoods()
  } catch (error) {
    console.error('Error fetching moods:', error)
  } finally {
    loadingMood.value = false
  }
  
  try {
    await chatStore.fetchConversations()
  } catch (error) {
    console.error('Error fetching conversations:', error)
  } finally {
    loadingChat.value = false
  }
  
  try {
    await journalStore.fetchEntries()
  } catch (error) {
    console.error('Error fetching journal entries:', error)
  } finally {
    loadingJournal.value = false
  }
  
  try {
    await goalsStore.fetchGoals()
  } catch (error) {
    console.error('Error fetching goals:', error)
  } finally {
    loadingGoals.value = false
  }
})
</script>
