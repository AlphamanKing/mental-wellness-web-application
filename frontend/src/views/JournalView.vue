<template>
  <div class="bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Journal header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-neutral-900">Journal</h1>
        <button @click="showJournalForm = true" class="btn btn-primary">
          New Entry
        </button>
      </div>
      
      <!-- Journal entries -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
      
      <div v-else-if="entries.length === 0" class="bg-white rounded-xl shadow-soft p-8 text-center">
        <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-neutral-900 mb-2">No journal entries yet</h3>
        <p class="text-neutral-600 mb-4">
          Start journaling your thoughts and feelings to track your mental wellness journey.
        </p>
        <button @click="showJournalForm = true" class="btn btn-primary">
          Write Your First Entry
        </button>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="entry in entries" 
          :key="entry.id" 
          class="bg-white rounded-xl shadow-soft overflow-hidden"
        >
          <div class="p-6">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-lg font-semibold text-neutral-900 line-clamp-1">
                {{ entry.title || 'Untitled Entry' }}
              </h3>
              <span class="text-xs text-neutral-500 whitespace-nowrap ml-2">
                {{ formatDate(entry.created_at) }}
              </span>
            </div>
            
            <p class="text-neutral-700 line-clamp-4 mb-4">
              {{ entry.content }}
            </p>
            
            <div class="flex justify-between items-center">
              <div>
                <span 
                  v-if="entry.share_with_ai" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Shared with AI
                </span>
              </div>
              <button 
                @click="viewEntry(entry)" 
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Read more
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Journal entry modal -->
      <div v-if="showJournalForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">New Journal Entry</h2>
            <button @click="showJournalForm = false" class="text-neutral-500 hover:text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="submitJournalEntry">
            <div class="mb-4">
              <label for="journal-title" class="block text-neutral-700 mb-2">Title</label>
              <input 
                id="journal-title"
                v-model="journalTitle"
                type="text"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Give your entry a title"
              />
            </div>
            
            <div class="mb-4">
              <label for="journal-content" class="block text-neutral-700 mb-2">Content</label>
              <textarea 
                id="journal-content"
                v-model="journalContent"
                rows="10"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Write your thoughts here..."
                required
              ></textarea>
            </div>
            
            <div class="mb-6">
              <div class="flex items-center">
                <input 
                  id="share-with-ai"
                  v-model="shareWithAi"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label for="share-with-ai" class="ml-2 block text-sm text-neutral-700">
                  Share with AI therapist
                </label>
              </div>
              <p class="mt-1 text-xs text-neutral-500 ml-6">
                This will allow your AI therapist to reference this journal entry in your conversations.
              </p>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="showJournalForm = false" 
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!journalContent.trim() || submitting"
              >
                <span v-if="submitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save Entry</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Journal view modal -->
      <div v-if="selectedEntry" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">{{ selectedEntry.title || 'Untitled Entry' }}</h2>
            <button @click="selectedEntry = null" class="text-neutral-500 hover:text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="mb-4 text-sm text-neutral-500">
            {{ formatDate(selectedEntry.created_at) }}
          </div>
          
          <div class="prose max-w-none mb-6">
            <p class="whitespace-pre-line">{{ selectedEntry.content }}</p>
          </div>
          
          <div v-if="selectedEntry.share_with_ai" class="flex items-center text-sm text-green-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Shared with AI therapist
          </div>
          
          <div class="flex justify-end">
            <button 
              @click="selectedEntry = null" 
              class="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useJournalStore } from '../store/journal'
import { format } from 'date-fns'

// Store
const journalStore = useJournalStore()

// State
const loading = ref(true)
const showJournalForm = ref(false)
const journalTitle = ref('')
const journalContent = ref('')
const shareWithAi = ref(false)
const submitting = ref(false)
const selectedEntry = ref(null)

// Computed properties
const entries = computed(() => journalStore.journalEntries)

// Methods
const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'MMMM d, yyyy h:mm a')
}

const submitJournalEntry = async () => {
  if (!journalContent.value.trim()) return
  
  submitting.value = true
  
  try {
    await journalStore.createJournal(
      journalTitle.value.trim() || 'Untitled Entry',
      journalContent.value,
      shareWithAi.value
    )
    
    // Reset form
    showJournalForm.value = false
    journalTitle.value = ''
    journalContent.value = ''
    shareWithAi.value = false
  } catch (error) {
    console.error('Error creating journal entry:', error)
  } finally {
    submitting.value = false
  }
}

const viewEntry = (entry) => {
  selectedEntry.value = entry
}

// Fetch journal entries on component mount
onMounted(async () => {
  loading.value = true
  
  try {
    await journalStore.fetchJournals()
  } catch (error) {
    console.error('Error fetching journal entries:', error)
  } finally {
    loading.value = false
  }
})
</script>
