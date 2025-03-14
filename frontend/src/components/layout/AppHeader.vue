<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo and navigation -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/" class="flex items-center">
              <span class="text-primary-600 text-xl font-bold">Mental Wellness</span>
            </router-link>
          </div>
          
          <!-- Main navigation -->
          <nav v-if="isAuthenticated" class="hidden md:ml-6 md:flex md:space-x-8">
            <router-link 
              to="/dashboard" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'dashboard' 
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              Dashboard
            </router-link>
            
            <router-link 
              to="/chat" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'chat' || $route.name === 'chat-detail'
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              AI Therapy
            </router-link>
            
            <router-link 
              to="/journal" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'journal' 
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              Journal
            </router-link>
            
            <router-link 
              to="/mood-tracker" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'mood-tracker' 
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              Mood Tracker
            </router-link>
            
            <router-link 
              to="/goals" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'goals' 
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              Goals
            </router-link>
          </nav>
          
          <!-- Public navigation -->
          <nav v-else class="hidden md:ml-6 md:flex md:space-x-8">
            <router-link 
              to="/" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="[
                $route.name === 'home' 
                  ? 'border-primary-500 text-primary-900' 
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              ]"
            >
              Home
            </router-link>
            
            <router-link 
              to="/about" 
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
            >
              About
            </router-link>
          </nav>
        </div>
        
        <!-- Right side buttons -->
        <div class="flex items-center">
          <!-- User is authenticated -->
          <div v-if="isAuthenticated" class="flex items-center ml-4 md:ml-6">
            <!-- Profile dropdown -->
            <div class="ml-3 relative">
              <div>
                <button 
                  @click="toggleProfileMenu" 
                  class="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span class="sr-only">Open user menu</span>
                  <img 
                    v-if="userPhotoURL" 
                    class="h-8 w-8 rounded-full" 
                    :src="userPhotoURL" 
                    :alt="userDisplayName" 
                  />
                  <div v-else class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                    {{ userInitials }}
                  </div>
                </button>
              </div>
              
              <!-- Profile dropdown menu -->
              <div 
                v-if="showProfileMenu" 
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <div class="px-4 py-2 text-sm text-neutral-700 border-b border-neutral-200">
                  <div class="font-medium">{{ userDisplayName }}</div>
                  <div class="text-neutral-500 truncate">{{ userEmail }}</div>
                </div>
                
                <router-link 
                  to="/profile" 
                  @click="showProfileMenu = false"
                  class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Your Profile
                </router-link>
                
                <button 
                  @click="logout" 
                  class="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          
          <!-- User is not authenticated -->
          <div v-else class="flex items-center">
            <router-link 
              to="/login" 
              class="text-neutral-500 hover:text-neutral-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Log in
            </router-link>
            
            <router-link 
              to="/register" 
              class="ml-4 btn btn-primary"
            >
              Sign up
            </router-link>
          </div>
          
          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden ml-4">
            <button 
              @click="toggleMobileMenu" 
              class="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span class="sr-only">Open main menu</span>
              <svg 
                class="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path 
                  v-if="!showMobileMenu" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
                <path 
                  v-else 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    <div v-if="showMobileMenu" class="md:hidden">
      <div v-if="isAuthenticated" class="pt-2 pb-3 space-y-1">
        <router-link 
          to="/dashboard" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'dashboard' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Dashboard
        </router-link>
        
        <router-link 
          to="/chat" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'chat' || $route.name === 'chat-detail'
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          AI Therapy
        </router-link>
        
        <router-link 
          to="/journal" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'journal' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Journal
        </router-link>
        
        <router-link 
          to="/mood-tracker" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'mood-tracker' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Mood Tracker
        </router-link>
        
        <router-link 
          to="/goals" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'goals' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Goals
        </router-link>
        
        <router-link 
          to="/profile" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'profile' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Profile
        </router-link>
        
        <button 
          @click="logout" 
          class="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
        >
          Sign out
        </button>
      </div>
      
      <div v-else class="pt-2 pb-3 space-y-1">
        <router-link 
          to="/" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          :class="[
            $route.name === 'home' 
              ? 'border-primary-500 text-primary-700 bg-primary-50' 
              : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700'
          ]"
        >
          Home
        </router-link>
        
        <router-link 
          to="/about" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
        >
          About
        </router-link>
        
        <router-link 
          to="/login" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
        >
          Log in
        </router-link>
        
        <router-link 
          to="/register" 
          @click="showMobileMenu = false"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
        >
          Sign up
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const showMobileMenu = ref(false)
const showProfileMenu = ref(false)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userDisplayName = computed(() => authStore.userDisplayName)
const userEmail = computed(() => authStore.userEmail)
const userPhotoURL = computed(() => authStore.userPhotoURL)
const userInitials = computed(() => {
  if (!userDisplayName.value) return '?'
  return userDisplayName.value
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

// Methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (showMobileMenu.value) {
    showProfileMenu.value = false
  }
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const logout = async () => {
  try {
    await authStore.logoutUser()
    showProfileMenu.value = false
    showMobileMenu.value = false
    router.push({ name: 'home' })
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Close profile menu when clicking outside
const handleClickOutside = (event) => {
  if (showProfileMenu.value && !event.target.closest('.profile-menu')) {
    showProfileMenu.value = false
  }
}

// Add click outside listener
window.addEventListener('click', handleClickOutside)
</script>
