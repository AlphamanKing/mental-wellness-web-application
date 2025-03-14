import { defineStore } from 'pinia'
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useMoodStore = defineStore('mood', {
  state: () => ({
    moods: [],
    loading: false,
    error: null
  }),
  
  getters: {
    moodHistory: (state) => state.moods,
    isLoading: (state) => state.loading,
    
    // Get mood data formatted for Chart.js
    moodChartData: (state) => {
      const labels = state.moods.map(mood => {
        const date = new Date(mood.timestamp)
        return date.toLocaleDateString()
      })
      
      const data = state.moods.map(mood => mood.mood)
      
      return {
        labels,
        datasets: [
          {
            label: 'Mood Score',
            data,
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      }
    }
  },
  
  actions: {
    async fetchMoods(days = 30) {
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
          `/api/moods?days=${days}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        this.moods = response.data.map(mood => ({
          ...mood,
          timestamp: new Date(mood.timestamp._seconds * 1000)
        }))
        
        return this.moods
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async recordMood(mood, note) {
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
          '/api/mood',
          { mood, note },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh mood history
        await this.fetchMoods()
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
