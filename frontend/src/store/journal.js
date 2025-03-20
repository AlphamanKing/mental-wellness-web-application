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
    // Set journals directly (used by dashboard)
    setJournals(journals) {
      if (!Array.isArray(journals)) {
        console.warn('Invalid journals data received:', journals);
        return;
      }
      
      try {
        this.journals = journals.map(journal => {
          // Process timestamps safely
          let created_at = journal.created_at;
          let updated_at = journal.updated_at;
          
          // Handle different timestamp formats
          if (created_at) {
            if (typeof created_at === 'object' && created_at._seconds) {
              created_at = new Date(created_at._seconds * 1000);
            } else if (typeof created_at === 'string') {
              created_at = new Date(created_at);
            } else if (created_at instanceof Date) {
              // already a Date object, do nothing
            } else if (typeof created_at === 'number') {
              created_at = new Date(created_at);
            } else if (typeof created_at === 'object' && created_at.seconds) {
              created_at = new Date(created_at.seconds * 1000);
            } else if (typeof created_at === 'object' && typeof created_at.toDate === 'function') {
              created_at = created_at.toDate();
            }
          }
          
          if (updated_at) {
            if (typeof updated_at === 'object' && updated_at._seconds) {
              updated_at = new Date(updated_at._seconds * 1000);
            } else if (typeof updated_at === 'string') {
              updated_at = new Date(updated_at);
            } else if (updated_at instanceof Date) {
              // already a Date object, do nothing
            } else if (typeof updated_at === 'number') {
              updated_at = new Date(updated_at);
            } else if (typeof updated_at === 'object' && updated_at.seconds) {
              updated_at = new Date(updated_at.seconds * 1000);
            } else if (typeof updated_at === 'object' && typeof updated_at.toDate === 'function') {
              updated_at = updated_at.toDate();
            }
          }
          
          return {
            ...journal,
            created_at,
            updated_at
          };
        });
      } catch (error) {
        console.error('Error processing journals data:', error);
      }
    },
    
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
        
        // Use the setJournals method to safely process the data
        this.setJournals(response.data);
        
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
