<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    
    <main class="flex-grow">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <AppFooter />
    
    <!-- Global notifications -->
    <NotificationsContainer />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useAuthStore } from './store/auth'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import NotificationsContainer from './components/NotificationsContainer.vue'

const router = useRouter()
const authStore = useAuthStore()

// Set up auth state listener
let unsubscribe
onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    authStore.setUser(user)
    
    // If user is on login/register page and is authenticated, redirect to dashboard
    if (user && (router.currentRoute.value.name === 'login' || router.currentRoute.value.name === 'register')) {
      router.push({ name: 'dashboard' })
    }
  })
})

// Clean up auth state listener
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
