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
    error: null,
    lastFetch: null
  }),
  
  getters: {
    moodHistory: (state) => state.moods,
    latestMood: (state) => state.moods[0],
    isLoading: (state) => state.loading,
    hasError: (state) => state.error !== null,
    
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
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const token = await authStore.user.getIdToken();
        
        // Try to fetch from /api/moods first
        try {
          const response = await axios.get('/api/moods', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              days: days
            }
          });
          
          // Process and sort moods by timestamp
          const processedMoods = response.data.map(mood => ({
            ...mood,
            timestamp: mood.timestamp?._seconds 
              ? new Date(mood.timestamp._seconds * 1000) 
              : new Date(mood.timestamp)
          })).sort((a, b) => b.timestamp - a.timestamp);
          
          this.moods = processedMoods;
          this.lastFetch = new Date();
          
          return processedMoods;
        } catch (error) {
          // If the first endpoint fails, try the alternative endpoint
          if (error.response?.status === 404) {
            const response = await axios.get('/api/mood', {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              params: {
                days: days
              }
            });
            
            const processedMoods = response.data.map(mood => ({
              ...mood,
              timestamp: mood.timestamp?._seconds 
                ? new Date(mood.timestamp._seconds * 1000) 
                : new Date(mood.timestamp)
            })).sort((a, b) => b.timestamp - a.timestamp);
            
            this.moods = processedMoods;
            this.lastFetch = new Date();
            
            return processedMoods;
          }
          throw error;
        }
      } catch (error) {
        console.error('Error fetching moods:', error);
        this.error = error.message;
        
        // In development, return sample data if no moods exist
        if (process.env.NODE_ENV === 'development') {
          console.log('Using sample mood data for development');
          const sampleMoods = this.generateSampleMoods();
          this.moods = sampleMoods;
          return sampleMoods;
        }
        
        // If we have existing moods, return those instead of throwing
        if (this.moods.length > 0) {
          console.log('Using cached mood data');
          return this.moods;
        }
        
        // If all else fails, return sample data
        const sampleMoods = this.generateSampleMoods();
        this.moods = sampleMoods;
        return sampleMoods;
      } finally {
        this.loading = false;
      }
    },

    generateSampleMoods() {
      const sampleMoods = [];
      const now = new Date();
      
      // Generate sample moods for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        sampleMoods.push({
          id: `sample-${i}`,
          score: Math.floor(Math.random() * 5) + 1,
          timestamp: date,
          note: 'Sample mood entry for development'
        });
      }
      
      return sampleMoods;
    },

    async logMood(score, note = '') {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const token = await authStore.user.getIdToken();
        
        // In development mode, bypass API call
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Adding mood locally');
          const newMood = {
            id: `local-${Date.now()}`,
            score,
            note,
            timestamp: new Date()
          };
          this.moods.unshift(newMood);
          return newMood;
        }

        const response = await apiClient.post('/api/moods', {
          score,
          note,
          timestamp: new Date().toISOString() // Ensure proper date format
        });
        
        const newMood = {
          ...response.data,
          timestamp: new Date()
        };
        
        this.moods.unshift(newMood);
        return newMood;
      } catch (error) {
        console.error('Error logging mood:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setMoods(moods) {
      if (!moods || !Array.isArray(moods)) {
        console.warn('Invalid moods data:', moods);
        return;
      }
      
      this.moods = moods.map(mood => ({
        ...mood,
        timestamp: mood.timestamp?._seconds 
          ? new Date(mood.timestamp._seconds * 1000) 
          : new Date(mood.timestamp)
      })).sort((a, b) => b.timestamp - a.timestamp);
    },

    clearMoods() {
      this.moods = [];
      this.error = null;
      this.lastFetch = null;
    }
  }
})
