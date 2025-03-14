import { defineStore } from 'pinia'
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useJournalStore = defineStore('journal', {
  state: () => ({
    journals: [],
    currentJournal: null,
    loading: false,
    error: null
  }),
  
  getters: {
    journalEntries: (state) => state.journals,
    isLoading: (state) => state.loading
  },
  
  actions: {
    async fetchJournals() {
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
          '/api/journals',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        this.journals = response.data.map(journal => ({
          ...journal,
          created_at: new Date(journal.created_at._seconds * 1000),
          updated_at: new Date(journal.updated_at._seconds * 1000)
        }))
        
        return this.journals
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createJournal(title, content, shareWithAi = false) {
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
          '/api/journal',
          { 
            title, 
            content,
            share_with_ai: shareWithAi
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh journal entries
        await this.fetchJournals()
        
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
