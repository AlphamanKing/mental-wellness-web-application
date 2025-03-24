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
          
          <div v-if="loadingMood" class="space-y-4">
            <div class="flex items-center space-x-2">
              <div class="skeleton w-10 h-10 rounded-full"></div>
              <div class="space-y-2">
                <div class="skeleton h-4 w-20"></div>
                <div class="skeleton h-3 w-24"></div>
              </div>
            </div>
            <div class="skeleton h-16 w-full"></div>
            <div class="skeleton h-10 w-full rounded-md"></div>
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
            
            <p class="text-sm text-neutral-600 mb-4">Track your emotional wellbeing and identify patterns over time.</p>
            <router-link to="/mood-tracker" class="mt-auto btn btn-primary w-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Log Your Mood
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">You haven't logged your mood yet</p>
            <router-link to="/mood-tracker" class="btn btn-primary flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
          
          <div v-if="loadingChat" class="space-y-4">
            <div class="space-y-2">
              <div class="skeleton p-3 rounded-lg h-20 w-full"></div>
              <div class="skeleton p-3 rounded-lg h-20 w-full"></div>
            </div>
            <div class="skeleton h-10 w-full rounded-md"></div>
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
            
            <p class="text-sm text-neutral-600 mb-4">Talk to your AI therapist about anything that's on your mind.</p>
            <router-link to="/chat" class="mt-auto btn btn-primary w-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Start New Conversation
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">No conversations yet</p>
            <router-link to="/chat" class="btn btn-primary flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Start Your First Conversation
            </router-link>
          </div>
        </div>
        
        <!-- Journal card -->
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Journal</h2>
            <router-link to="/journal" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
          </div>
          
          <div v-if="loadingJournal" class="space-y-4">
            <div class="space-y-2">
              <div class="skeleton p-3 rounded-lg h-24 w-full"></div>
              <div class="skeleton p-3 rounded-lg h-24 w-full"></div>
            </div>
            <div class="skeleton h-10 w-full rounded-md"></div>
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
            
            <p class="text-sm text-neutral-600 mb-4">Record your thoughts, feelings, and experiences in your private journal.</p>
            <router-link to="/journal" class="mt-auto btn btn-primary w-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write New Entry
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">No journal entries yet</p>
            <router-link to="/journal" class="btn btn-primary flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write Your First Entry
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Goals section -->
      <div class="max-w-2xl mx-auto mb-8">
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Your Goals</h2>
            <router-link to="/goals" class="text-sm text-primary-600 hover:text-primary-500">View all</router-link>
          </div>
          
          <div v-if="loadingGoals" class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-center">
                <div class="skeleton h-4 w-4 rounded mr-3"></div>
                <div class="skeleton h-4 w-full"></div>
              </div>
              <div class="flex items-center">
                <div class="skeleton h-4 w-4 rounded mr-3"></div>
                <div class="skeleton h-4 w-full"></div>
              </div>
              <div class="flex items-center">
                <div class="skeleton h-4 w-4 rounded mr-3"></div>
                <div class="skeleton h-4 w-full"></div>
              </div>
            </div>
            <div class="skeleton h-10 w-full rounded-md mt-4"></div>
          </div>
          
          <div v-else-if="activeGoals && activeGoals.length > 0" class="space-y-4">
            <div class="space-y-3">
              <div v-for="goal in activeGoals.slice(0, 3)" :key="goal.id" class="flex items-center p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                <input 
                  :id="'goal-' + goal.id" 
                  type="checkbox" 
                  :checked="goal.completed" 
                  @change="toggleGoalCompletion(goal)"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" 
                />
                <label :for="'goal-' + goal.id" class="ml-3 block text-sm text-neutral-700 flex-grow">
                  {{ goal.title }}
                </label>
                <span class="text-xs text-neutral-500">{{ formatDate(goal.due_date) }}</span>
              </div>
            </div>
            
            <p class="text-sm text-neutral-600 mb-4">Track your progress towards your mental wellness goals.</p>
            <router-link to="/goals" class="mt-auto btn btn-primary w-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Create New Goal
            </router-link>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-neutral-600 mb-4">No goals set yet</p>
            <router-link to="/goals" class="btn btn-primary flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Create Your First Goal
            </router-link>
          </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../store/auth'
import { useMoodStore } from '../store/mood'
import { useChatStore } from '../store/chat'
import { useJournalStore } from '../store/journal'
import { useGoalsStore } from '../store/goals'
import { format } from 'date-fns'
import apiClient from '../utils/apiClient'

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
const fetchControllers = [] // Store AbortControllers for fetch operations

// Fetch status tracking
const fetchStatus = ref({
  mood: { success: false, error: null },
  chat: { success: false, error: null },
  journal: { success: false, error: null },
  goals: { success: false, error: null }
})

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
  return journalStore.journalEntries
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
  if (!date) return '';
  
  try {
    // Handle Firebase Timestamp objects
    if (date && typeof date === 'object' && date._seconds) {
      return format(new Date(date._seconds * 1000), 'MMM d, yyyy');
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM d, yyyy');
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    }
    
    // Default fallback
    return format(new Date(), 'MMM d, yyyy');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid date';
  }
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

const toggleGoalCompletion = async (goal) => {
  try {
    await goalsStore.toggleGoalCompletion(goal.id, !goal.completed)
  } catch (error) {
    console.error('Error toggling goal completion:', error)
  }
}

// Fetch data on component mount
onMounted(() => {
  const controller = new AbortController();
  const { signal } = controller;
  fetchControllers.push(controller);
  
  // Add a small delay to ensure auth is initialized before making API requests
  setTimeout(() => {
    // Load all data in parallel using Promise.allSettled
    Promise.allSettled([
      // Fetch mood data
      (async () => {
        try {
          loadingMood.value = true;
          let attempts = 0;
          let moodData = null;
          
          while (!moodData && attempts < 3) {
            try {
              moodData = await apiClient.get('/api/mood/recent', { 
                signal, 
                params: { limit: 5 },
                cache: false  // Disable cache for fresh data
              });
              
              if (moodData) {
                moodStore.setMoods(moodData);
                fetchStatus.value.mood.success = true;
              }
            } catch (error) {
              attempts++;
              console.log(`Mood data fetch attempt ${attempts} failed, retrying...`);
              if (attempts >= 3) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching moods:', error);
            fetchStatus.value.mood.error = error.message;
          }
        } finally {
          loadingMood.value = false;
        }
      })(),
      
      // Fetch chat data
      (async () => {
        try {
          loadingChat.value = true;
          let attempts = 0;
          let chatData = null;
          
          while (!chatData && attempts < 3) {
            try {
              chatData = await apiClient.get('/api/chat/conversations', { 
                signal,
                params: { limit: 3 },
                cache: false  // Disable cache for fresh data
              });
              
              if (chatData) {
                chatStore.setConversations(chatData);
                fetchStatus.value.chat.success = true;
              }
            } catch (error) {
              attempts++;
              console.log(`Chat data fetch attempt ${attempts} failed, retrying...`);
              if (attempts >= 3) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching chat history:', error);
            fetchStatus.value.chat.error = error.message;
          }
        } finally {
          loadingChat.value = false;
        }
      })(),
      
      // Fetch journal entries
      (async () => {
        try {
          loadingJournal.value = true;
          let attempts = 0;
          let journalData = null;
          
          while (!journalData && attempts < 3) {
            try {
              journalData = await apiClient.get('/api/journal/entries', { 
                signal,
                params: { limit: 3 },
                cache: false  // Disable cache for fresh data
              });
              
              if (journalData) {
                journalStore.setJournals(journalData);
                fetchStatus.value.journal.success = true;
              }
            } catch (error) {
              attempts++;
              console.log(`Journal data fetch attempt ${attempts} failed, retrying...`);
              if (attempts >= 3) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching journal entries:', error);
            fetchStatus.value.journal.error = error.message;
          }
        } finally {
          loadingJournal.value = false;
        }
      })(),
      
      // Fetch goals data
      (async () => {
        try {
          loadingGoals.value = true;
          let attempts = 0;
          let goalsData = null;
          
          while (!goalsData && attempts < 3) {
            try {
              goalsData = await apiClient.get('/api/goals', { 
                signal,
                params: { status: 'active' },
                cache: false  // Disable cache for fresh data
              });
              
              if (goalsData) {
                goalsStore.setGoals(goalsData);
                fetchStatus.value.goals.success = true;
              }
            } catch (error) {
              attempts++;
              console.log(`Goals data fetch attempt ${attempts} failed, retrying...`);
              if (attempts >= 3) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching goals:', error);
            fetchStatus.value.goals.error = error.message;
          }
        } finally {
          loadingGoals.value = false;
        }
      })()
    ]);
  }, 500); // Wait 500ms before starting API requests to ensure auth is initialized
})

// Clean up on component unmount
onBeforeUnmount(() => {
  // Abort any ongoing fetch operations
  fetchControllers.forEach(controller => {
    if (controller) {
      controller.abort()
    }
  })
  
  // Clear fetch controllers array
  fetchControllers.length = 0
})
</script>

<style scoped>
/* Skeleton loading animation */
@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}

.skeleton {
  animation: pulse 1.5s infinite;
  background-color: #e5e7eb;
  border-radius: 0.375rem;
}
</style>
