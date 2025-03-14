import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    messagesListener: null
  }),
  
  getters: {
    conversationsList: (state) => state.conversations,
    currentMessages: (state) => state.messages,
    isLoading: (state) => state.loading
  },
  
  actions: {
    async fetchConversations() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        const conversationsRef = collection(db, 'conversations', userId, 'chats')
        const q = query(conversationsRef, orderBy('updated_at', 'desc'))
        
        const querySnapshot = await getDocs(q)
        
        const conversations = []
        querySnapshot.forEach((doc) => {
          conversations.push({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate(),
            updated_at: doc.data().updated_at?.toDate()
          })
        })
        
        this.conversations = conversations
        return conversations
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchConversation(conversationId) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        const conversationRef = doc(db, 'conversations', userId, 'chats', conversationId)
        const conversationDoc = await getDoc(conversationRef)
        
        if (!conversationDoc.exists()) {
          throw new Error('Conversation not found')
        }
        
        const conversation = {
          id: conversationDoc.id,
          ...conversationDoc.data(),
          created_at: conversationDoc.data().created_at?.toDate(),
          updated_at: conversationDoc.data().updated_at?.toDate()
        }
        
        this.currentConversation = conversation
        
        // Set up real-time listener for messages
        this.setupMessagesListener(userId, conversationId)
        
        return conversation
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    setupMessagesListener(userId, conversationId) {
      // Clear previous listener if exists
      if (this.messagesListener) {
        this.messagesListener()
        this.messagesListener = null
      }
      
      const messagesRef = collection(db, 'conversations', userId, 'chats', conversationId, 'messages')
      const q = query(messagesRef, orderBy('timestamp'))
      
      this.messagesListener = onSnapshot(q, (snapshot) => {
        const messages = []
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          })
        })
        
        this.messages = messages
      })
    },
    
    clearMessagesListener() {
      if (this.messagesListener) {
        this.messagesListener()
        this.messagesListener = null
      }
      
      this.messages = []
    },
    
    async sendMessage(message) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Add user message to UI immediately
        if (this.currentConversation) {
          // Add message to local messages array immediately
          const userMessage = {
            id: 'temp-' + Date.now(), // Temporary ID
            content: message,
            sender: 'user',
            timestamp: new Date()
          }
          this.messages.push(userMessage)
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        // First, analyze sentiment
        const sentimentResponse = await axios.post(
          '/api/analyze_sentiment',
          { message },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        const sentiment = sentimentResponse.data
        
        // Then, generate AI response
        const aiResponse = await axios.post(
          '/api/generate_response',
          { 
            message,
            sentiment,
            conversation_id: this.currentConversation?.id
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // If this is a new conversation, update the current conversation
        if (!this.currentConversation) {
          const conversationId = aiResponse.data.conversation_id
          await this.fetchConversation(conversationId)
        } else {
          // Refresh the current conversation to show the new messages
          await this.fetchConversation(this.currentConversation.id)
        }
        
        return aiResponse.data
      } catch (error) {
        console.error('Error sending message:', error)
        this.error = error.message || 'Failed to send message'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
