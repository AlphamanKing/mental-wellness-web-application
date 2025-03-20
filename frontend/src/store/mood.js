import { defineStore } from 'pinia'
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import axios from 'axios'
import apiClient from '../utils/apiClient'

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
    // Set moods directly (used by dashboard)
    setMoods(moods) {
      if (!Array.isArray(moods)) {
        console.warn('Invalid moods data received:', moods);
        return;
      }
      
      try {
        this.moods = moods.map(mood => {
          // Process the timestamp safely
          let timestamp = mood.timestamp || mood.created_at;
          
          // Handle different timestamp formats
          if (timestamp) {
            if (typeof timestamp === 'object' && timestamp._seconds) {
              timestamp = new Date(timestamp._seconds * 1000);
            } else if (typeof timestamp === 'string') {
              timestamp = new Date(timestamp);
            } else if (timestamp instanceof Date) {
              // already a Date object, do nothing
            } else if (typeof timestamp === 'number') {
              timestamp = new Date(timestamp);
            } else if (typeof timestamp === 'object' && timestamp.seconds) {
              timestamp = new Date(timestamp.seconds * 1000);
            } else if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
              timestamp = timestamp.toDate();
            }
          } else {
            // If no timestamp is found, use current date
            timestamp = new Date();
          }
          
          return {
            ...mood,
            score: mood.score || mood.mood, // Handle both formats
            timestamp: timestamp
          };
        });
      } catch (error) {
        console.error('Error processing moods data:', error);
      }
    },
    
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
        
        // Use the setMoods method to safely process the data
        this.setMoods(response.data);
        
        return this.moods
      } catch (error) {
        console.error('Error fetching moods:', error);
        this.error = error.message;
        
        // If we have an API error, try to use cached data
        if (this.moods && this.moods.length > 0) {
          console.log('Using cached mood data instead');
          return this.moods;
        }
        
        throw error;
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
