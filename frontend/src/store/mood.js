import { defineStore } from 'pinia'
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
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
        const userId = authStore.userId;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Calculate the date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Create Firestore query
        const moodsRef = collection(db, 'moods');
        const moodsQuery = query(
          moodsRef,
          where('userId', '==', userId),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(moodsQuery);
        
        const moods = [];
        querySnapshot.forEach((doc) => {
          moods.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          });
        });

        this.moods = moods;
        this.lastFetch = new Date();
        return moods;

      } catch (error) {
        console.error('Error fetching moods:', error);
        this.error = error.message;
        throw error;
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
        const userId = authStore.userId;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Create new mood document in Firestore
        const moodsRef = collection(db, 'moods');
        const newMoodRef = await addDoc(moodsRef, {
          userId,
          score,
          note,
          timestamp: serverTimestamp(),
          created_at: serverTimestamp()
        });

        // Create local mood object
        const newMood = {
          id: newMoodRef.id,
          userId,
          score,
          note,
          timestamp: new Date(),
          created_at: new Date()
        };
        
        // Update local state
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
