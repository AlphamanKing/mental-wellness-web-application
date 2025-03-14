<template>
  <div class="bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Goals header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-neutral-900">Goals</h1>
        <button @click="showGoalForm = true" class="btn btn-primary">
          New Goal
        </button>
      </div>
      
      <!-- Goals stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div class="text-sm text-neutral-500">Total Goals</div>
              <div class="text-2xl font-bold text-neutral-900">{{ goals.length }}</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div class="text-sm text-neutral-500">Completed</div>
              <div class="text-2xl font-bold text-neutral-900">{{ completedGoals.length }}</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-soft p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div class="text-sm text-neutral-500">In Progress</div>
              <div class="text-2xl font-bold text-neutral-900">{{ inProgressGoals.length }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Goals list -->
      <div class="bg-white rounded-xl shadow-soft p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-neutral-900">Your Goals</h2>
          <div class="flex space-x-2">
            <button 
              v-for="filter in goalFilters" 
              :key="filter.value"
              @click="activeFilter = filter.value"
              class="px-3 py-1 text-sm rounded-md"
              :class="activeFilter === filter.value 
                ? 'bg-primary-100 text-primary-800 font-medium' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        
        <div v-else-if="filteredGoals.length === 0" class="text-center py-8">
          <div v-if="goals.length === 0">
            <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">No goals yet</h3>
            <p class="text-neutral-600 mb-4">
              Set goals to help improve your mental wellness journey.
            </p>
            <button @click="showGoalForm = true" class="btn btn-primary">
              Create Your First Goal
            </button>
          </div>
          <div v-else>
            <p class="text-neutral-600">No goals match the current filter</p>
          </div>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="goal in filteredGoals" 
            :key="goal.id" 
            class="p-4 rounded-lg border"
            :class="goal.completed ? 'border-green-200 bg-green-50' : 'border-neutral-200'"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-3">
                <button 
                  @click="toggleGoalCompletion(goal)"
                  class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  :class="goal.completed 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-neutral-300 hover:border-primary-500'"
                >
                  <svg v-if="goal.completed" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <div class="flex-grow">
                <div class="flex justify-between items-start">
                  <h3 
                    class="font-medium text-neutral-900"
                    :class="goal.completed ? 'line-through text-neutral-500' : ''"
                  >
                    {{ goal.title }}
                  </h3>
                  <div class="flex items-center space-x-2 ml-4">
                    <span 
                      class="px-2 py-1 text-xs rounded-full"
                      :class="getCategoryClass(goal.category)"
                    >
                      {{ goal.category }}
                    </span>
                    <button 
                      @click="editGoal(goal)" 
                      class="text-neutral-500 hover:text-neutral-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p class="text-sm text-neutral-600 mt-1">
                  {{ goal.description }}
                </p>
                
                <div class="mt-2 flex justify-between items-center">
                  <div class="text-xs text-neutral-500">
                    <span v-if="goal.due_date">Due: {{ formatDate(goal.due_date) }}</span>
                  </div>
                  <div class="text-xs text-neutral-500">
                    Created: {{ formatDate(goal.created_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Goal form modal -->
      <div v-if="showGoalForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">
              {{ editingGoal ? 'Edit Goal' : 'New Goal' }}
            </h2>
            <button @click="closeGoalForm" class="text-neutral-500 hover:text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="submitGoal">
            <div class="mb-4">
              <label for="goal-title" class="block text-neutral-700 mb-2">Title</label>
              <input 
                id="goal-title"
                v-model="goalTitle"
                type="text"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="What do you want to achieve?"
                required
              />
            </div>
            
            <div class="mb-4">
              <label for="goal-description" class="block text-neutral-700 mb-2">Description</label>
              <textarea 
                id="goal-description"
                v-model="goalDescription"
                rows="3"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add more details about your goal"
              ></textarea>
            </div>
            
            <div class="mb-4">
              <label for="goal-category" class="block text-neutral-700 mb-2">Category</label>
              <select 
                id="goal-category"
                v-model="goalCategory"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="" disabled>Select a category</option>
                <option v-for="category in goalCategories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="mb-4">
              <label for="goal-due-date" class="block text-neutral-700 mb-2">Due Date (Optional)</label>
              <input 
                id="goal-due-date"
                v-model="goalDueDate"
                type="date"
                class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="closeGoalForm" 
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!goalTitle.trim() || !goalCategory || submitting"
              >
                <span v-if="submitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>{{ editingGoal ? 'Update Goal' : 'Create Goal' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGoalsStore } from '../store/goals'
import { format } from 'date-fns'

// Store
const goalsStore = useGoalsStore()

// State
const loading = ref(true)
const showGoalForm = ref(false)
const goalTitle = ref('')
const goalDescription = ref('')
const goalCategory = ref('')
const goalDueDate = ref('')
const submitting = ref(false)
const editingGoal = ref(null)
const activeFilter = ref('all')

// Goal categories
const goalCategories = [
  'Mental Health',
  'Physical Health',
  'Work/Career',
  'Relationships',
  'Personal Growth',
  'Mindfulness',
  'Self-Care',
  'Other'
]

// Goal filters
const goalFilters = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' }
]

// Computed properties
const goals = computed(() => goalsStore.goals)

const completedGoals = computed(() => goals.value.filter(goal => goal.completed))

const inProgressGoals = computed(() => goals.value.filter(goal => !goal.completed))

const filteredGoals = computed(() => {
  if (activeFilter.value === 'all') {
    return goals.value
  } else if (activeFilter.value === 'completed') {
    return completedGoals.value
  } else {
    return inProgressGoals.value
  }
})

// Methods
const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'MMM d, yyyy')
}

const getCategoryClass = (category) => {
  const categoryClasses = {
    'Mental Health': 'bg-purple-100 text-purple-800',
    'Physical Health': 'bg-blue-100 text-blue-800',
    'Work/Career': 'bg-amber-100 text-amber-800',
    'Relationships': 'bg-pink-100 text-pink-800',
    'Personal Growth': 'bg-green-100 text-green-800',
    'Mindfulness': 'bg-indigo-100 text-indigo-800',
    'Self-Care': 'bg-teal-100 text-teal-800',
    'Other': 'bg-neutral-100 text-neutral-800'
  }
  
  return categoryClasses[category] || 'bg-neutral-100 text-neutral-800'
}

const toggleGoalCompletion = async (goal) => {
  try {
    await goalsStore.toggleGoalCompletion(goal.id)
  } catch (error) {
    console.error('Error toggling goal completion:', error)
  }
}

const editGoal = (goal) => {
  editingGoal.value = goal
  goalTitle.value = goal.title
  goalDescription.value = goal.description || ''
  goalCategory.value = goal.category
  goalDueDate.value = goal.due_date ? format(new Date(goal.due_date), 'yyyy-MM-dd') : ''
  showGoalForm.value = true
}

const closeGoalForm = () => {
  showGoalForm.value = false
  editingGoal.value = null
  goalTitle.value = ''
  goalDescription.value = ''
  goalCategory.value = ''
  goalDueDate.value = ''
}

const submitGoal = async () => {
  if (!goalTitle.value.trim() || !goalCategory.value) return
  
  submitting.value = true
  
  try {
    const goalData = {
      title: goalTitle.value.trim(),
      description: goalDescription.value.trim(),
      category: goalCategory.value,
      due_date: goalDueDate.value ? new Date(goalDueDate.value) : null
    }
    
    if (editingGoal.value) {
      await goalsStore.updateGoal(editingGoal.value.id, goalData)
    } else {
      await goalsStore.createGoal(goalData)
    }
    
    closeGoalForm()
  } catch (error) {
    console.error('Error submitting goal:', error)
  } finally {
    submitting.value = false
  }
}

// Fetch goals on component mount
onMounted(async () => {
  loading.value = true
  
  try {
    await goalsStore.fetchGoals()
  } catch (error) {
    console.error('Error fetching goals:', error)
  } finally {
    loading.value = false
  }
})
</script>
