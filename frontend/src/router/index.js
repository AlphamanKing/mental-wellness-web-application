import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Import views
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import ChatView from '../views/ChatView.vue'
import JournalView from '../views/JournalView.vue'
import MoodTrackerView from '../views/MoodTrackerView.vue'
import GoalsView from '../views/GoalsView.vue'
import ProfileView from '../views/ProfileView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Create router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/:id',
      name: 'chat-detail',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/journal',
      name: 'journal',
      component: JournalView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mood-tracker',
      name: 'mood-tracker',
      component: MoodTrackerView,
      meta: { requiresAuth: true }
    },
    {
      path: '/goals',
      name: 'goals',
      component: GoalsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { requiresAuth: false }
    }
  ]
})

// Navigation guard
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener()
        resolve(user)
      },
      reject
    )
  })
}

router.beforeEach(async (to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is authenticated
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      // Redirect to login page if not authenticated
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      // Proceed to route if authenticated
      next()
    }
  } else {
    // Proceed to route if authentication is not required
    next()
  }
})

export default router
