import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [],
    loading: false,
    error: null
  }),
  
  getters: {
    allGoals: (state) => state.goals,
    activeGoals: (state) => state.goals.filter(goal => !goal.completed),
    completedGoals: (state) => state.goals.filter(goal => goal.completed),
    isLoading: (state) => state.loading
  },
  
  actions: {
    async fetchGoals() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        const response = await axios.get(
          '/api/goals',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        this.goals = response.data.map(goal => ({
          ...goal,
          target_date: new Date(goal.target_date),
          created_at: new Date(goal.created_at._seconds * 1000),
          updated_at: new Date(goal.updated_at._seconds * 1000)
        }))
        
        return this.goals
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createGoal(title, description, targetDate) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        const response = await axios.post(
          '/api/goals',
          { 
            title, 
            description,
            target_date: targetDate instanceof Date ? targetDate.toISOString() : targetDate
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh goals
        await this.fetchGoals()
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateGoal(goalId, updates) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        // Format target_date if it exists
        if (updates.target_date && updates.target_date instanceof Date) {
          updates.target_date = updates.target_date.toISOString()
        }
        
        const response = await axios.put(
          `/api/goal/${goalId}`,
          updates,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh goals
        await this.fetchGoals()
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async toggleGoalCompletion(goalId, completed) {
      return this.updateGoal(goalId, { completed })
    }
  }
})
